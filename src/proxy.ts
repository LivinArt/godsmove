import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const mockAdminUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev@godsmove.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};

const mockCustomerUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'customer@godsmove.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};

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

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  // Apply dev mode mock session mappings to middleware auth check
  if (isDevMode) {
    const originalGetUser = supabase.auth.getUser.bind(supabase.auth);
    const getActiveMockUser = () => {
      const role = request.cookies.get('gm_dev_role')?.value;
      return role === 'USER' ? mockCustomerUser : mockAdminUser;
    };

    supabase.auth.getUser = async (...args: any[]) => {
      const res = await originalGetUser(...args);
      if (res.data?.user) return res;

      const isLoggedOut = request.cookies.get('gm_logged_out')?.value === 'true';
      if (isLoggedOut) {
        return { data: { user: null }, error: null };
      }
      return { data: { user: getActiveMockUser() as any }, error: null };
    };
  }

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
    if (isDevMode) {
      return supabaseResponse;
    }

    if (hasAdminBypass) {
      return supabaseResponse;
    }

    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check admin role via Supabase Service Role client to bypass RLS in middleware
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'OPERATIONS', 'SUPPORT', 'MARKETING'];
    if (!profile || !adminRoles.includes(profile.role)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
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

  // Redirect to login if unauthenticated on protected pages
  if (!user && isProtectedRoute && !isDevMode) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect logged-in users away from auth pages
  if (user && !isDevMode && (pathname === '/login' || pathname === '/register')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/profile';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
