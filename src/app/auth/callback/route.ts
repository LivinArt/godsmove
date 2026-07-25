import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const SUPER_ADMIN_EMAIL = 'livinarttech@gmail.com';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Prefer the cookie destination (set before OAuth to survive Supabase/Vercel redirect stripping)
  const cookieStore = await cookies();
  const cookieNext = cookieStore.get('godsmove_oauth_next')?.value;
  const queryNext = searchParams.get('redirectTo') || searchParams.get('next');
  const next = cookieNext || queryNext || '/profile';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Synchronize database Profile & Wallet for new logins
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userEmail = (user.email || '').toLowerCase();
        const isAdminTarget = next.startsWith('/admin');
        const isSuperAdminEmail = userEmail === SUPER_ADMIN_EMAIL;

        // Reject non-super-admin emails attempting to access /admin
        if (isAdminTarget && !isSuperAdminEmail) {
          await supabase.auth.signOut();
          const denyResponse = NextResponse.redirect(`${origin}/admin/login?error=access_denied`);
          denyResponse.headers.append('Set-Cookie', 'godsmove_oauth_next=; path=/; max-age=0; SameSite=Lax');
          return denyResponse;
        }

        try {
          const email = user.email || '';
          await prisma.$transaction(async (tx) => {
            const profile = await tx.profile.findUnique({ where: { id: user.id } });
            if (!profile) {
              await tx.profile.create({
                data: {
                  id: user.id,
                  email,
                  firstName: email.split('@')[0] || 'User',
                  lastName: '',
                  role: isSuperAdminEmail ? 'ADMIN' : 'CUSTOMER',
                  tier: 'STANDARD',
                },
              });
            } else if (isSuperAdminEmail && profile.role !== 'ADMIN') {
              await tx.profile.update({
                where: { id: user.id },
                data: { role: 'ADMIN' },
              });
            }

            const wallet = await tx.wallet.findUnique({ where: { profileId: user.id } });
            if (!wallet) {
              await tx.wallet.create({
                data: {
                  profileId: user.id,
                  balance: 0,
                },
              });
            }
          });
        } catch (e) {
          console.error('[auth/callback] Profile sync failed:', e);
        }
      }

      // Clear the OAuth destination cookie now that we've used it
      const clearCookieHeader = 'godsmove_oauth_next=; path=/; max-age=0; SameSite=Lax';

      // Build the redirect response
      const redirectResponse = NextResponse.redirect(`${origin}${next}`);
      redirectResponse.headers.append('Set-Cookie', clearCookieHeader);
      return redirectResponse;
    }
  }

  // Redirect to login page if there's an error
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
