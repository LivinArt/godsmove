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
  const rawCookieNext = cookieStore.get('godsmove_oauth_next')?.value;
  // Cookie value is URL-encoded by the shared oauth helper — decode it
  const cookieNext = rawCookieNext ? decodeURIComponent(rawCookieNext) : undefined;
  const queryNext = searchParams.get('redirectTo') || searchParams.get('next');
  // Ensure destination is always a relative path (security: never allow external redirects)
  const rawNext = cookieNext || queryNext || '/profile';
  const next = rawNext.startsWith('/') ? rawNext : '/profile';

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
          let isNewRegistration = false;

          await prisma.$transaction(async (tx) => {
            const profile = await tx.profile.findUnique({ where: { id: user.id } });
            if (!profile) {
              isNewRegistration = true;
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

          // Trigger WELCOME transactional email only for first-time registration
          if (isNewRegistration && email) {
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Valued Collector';
            const { NotificationService } = await import('@/notifications/notification.service');
            NotificationService.dispatch({
              event: 'WELCOME',
              recipient: {
                email,
                name: fullName,
                userId: user.id,
              },
              payload: {
                customerName: fullName,
                email,
              },
            }).catch((err) => console.error('❌ [WELCOME EMAIL DISPATCH ERROR]:', err));
          }
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
