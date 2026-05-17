import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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

  // Refresh session — CRITICAL: do not remove, keeps auth token alive
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── ADMIN BYPASS LOGIC (SECRET VIA URL) ───────────────────────────
  const secretParam = request.nextUrl.searchParams.get('secret');
  if (secretParam && secretParam === process.env.ADMIN_SECRET) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete('secret');
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('admin_bypass', secretParam, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;
  }

  const hasAdminBypass = request.cookies.get('admin_bypass')?.value === process.env.ADMIN_SECRET;

  // ── ADMIN ROUTE PROTECTION ──────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (hasAdminBypass) {
      return supabaseResponse; // Completely bypass auth for this session
    }

    if (!user) {
      // Not logged in → redirect to login
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check admin role via Prisma — we use a DB fetch here
    // Note: We check the profile.role rather than a Supabase claim
    // so that role changes take effect immediately without token refresh
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
    if (!profile || !adminRoles.includes(profile.role)) {
      // Authenticated but not an admin → redirect to homepage
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ── AUTH ROUTE PROTECTION ───────────────────────────────────────────
  // Redirect logged-in users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/account';
    return NextResponse.redirect(redirectUrl);
  }

  // ── ACCOUNT ROUTE PROTECTION ────────────────────────────────────────
  if (!user && pathname.startsWith('/account')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
