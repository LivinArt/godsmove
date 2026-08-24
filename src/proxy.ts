import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSuperAdminEmail } from '@/lib/admin-auth';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Strictly query Supabase for authentic session
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // ── ADMIN ROUTE PROTECTION ──────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Exclude /admin/login from protection
    if (pathname === '/admin/login') {
      return supabaseResponse;
    }

    // Require active user session
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      return NextResponse.redirect(redirectUrl);
    }

    // Strictly enforce designated Super Administrator Google email
    if (!isSuperAdminEmail(user.email)) {
      console.warn(`[Proxy Admin Guard] Rejected access for user ${user.id} (${user.email}): Not designated super admin.`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  }

  // ── PRELAUNCH ROUTE GATE ─────────────────────────────────────────────
  // Operational routes exempt from PRELAUNCH lock:
  const isOperationalRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/logo') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico';

  if (!isOperationalRoute) {
    try {
      const origin = request.nextUrl.origin;
      const modeRes = await fetch(`${origin}/api/site-mode`, {
        headers: { 'x-internal-middleware-check': 'true' },
        cache: 'no-store',
      });

      if (modeRes.ok) {
        const data = await modeRes.json();
        if (data?.siteMode !== 'NORMAL' && pathname !== '/') {
          const url = request.nextUrl.clone();
          url.pathname = '/';
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      if (pathname !== '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.rewrite(url);
      }
    }
  }

  // ── PROTECTED ROUTES PROTECTION ────────────────────────────────────────
  const isProtectedRoute =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/returns') ||
    pathname.startsWith('/cart');

  // Redirect unauthenticated storefront protected routes directly to home page (no standalone /login page)
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect users away from standalone /login route to home page (or /profile if logged in)
  if (pathname === '/login' || pathname === '/register') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? '/profile' : '/';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
