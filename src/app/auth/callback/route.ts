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
          const rawEaCookie = cookieStore.get('godsmove_ea_details')?.value;
          let eaDetails: any = null;
          if (rawEaCookie) {
            try {
              eaDetails = JSON.parse(decodeURIComponent(rawEaCookie));
            } catch (err) {
              // ignore
            }
          }

          const { syncCanonicalCustomer } = await import('@/lib/customer-sync');

          await prisma.$transaction(async (tx) => {
            await syncCanonicalCustomer(tx, {
              userId: user.id,
              email,
              role: isSuperAdminEmail ? 'ADMIN' : 'CUSTOMER',
              details: eaDetails ? {
                name: eaDetails.name,
                phone: eaDetails.phone,
                dob: eaDetails.dob,
                gender: eaDetails.gender,
              } : undefined,
              googleMetadata: user.user_metadata,
              isEarlyAccessRegistration: Boolean(eaDetails),
            });

            if (isSuperAdminEmail) {
              await tx.profile.update({
                where: { id: user.id },
                data: { role: 'ADMIN' },
              });
            }
          });

          // Check if Welcome email has ever been dispatched for this recipient
          const existingWelcome = await prisma.notificationHistory.findFirst({
            where: {
              email: email.toLowerCase(),
              eventType: { in: ['WELCOME', 'FIRST_TIME_REGISTRATION'] },
            },
          });

          if (!existingWelcome && email) {
            console.log(`[FIRST_TIME_REGISTRATION] New customer auth detected for: ${email}`);
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'Valued Collector';
            const { NotificationService } = await import('@/notifications/notification.service');

            console.log(`[FIRST_TIME_REGISTRATION] Dispatching WELCOME notification for ${email}...`);
            const dispatchRes = await NotificationService.dispatch({
              event: 'FIRST_TIME_REGISTRATION',
              recipient: {
                email,
                name: fullName,
                userId: user.id,
              },
              payload: {
                customerName: fullName,
                email,
              },
            });
            console.log(`[FIRST_TIME_REGISTRATION] Dispatch complete:`, dispatchRes);
          }
        } catch (e) {
          console.error('[auth/callback] Profile sync failed:', e);
        }
      }

      // Clear the OAuth destination cookie & Early Access details cookie now that we've used them
      const clearCookieHeader = 'godsmove_oauth_next=; path=/; max-age=0; SameSite=Lax';
      const clearEaCookieHeader = 'godsmove_ea_details=; path=/; max-age=0; SameSite=Lax';

      // Build the redirect response
      const redirectResponse = NextResponse.redirect(`${origin}${next}`);
      redirectResponse.headers.append('Set-Cookie', clearCookieHeader);
      redirectResponse.headers.append('Set-Cookie', clearEaCookieHeader);
      return redirectResponse;
    }
  }

  // Redirect to login page if there's an error
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
