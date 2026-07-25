import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('redirectTo') || searchParams.get('next') || '/profile';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Synchronize database Profile & Wallet for new logins
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
                  role: 'CUSTOMER',
                  tier: 'STANDARD',
                },
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

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to login page if there's an error
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
