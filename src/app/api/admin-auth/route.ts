import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    return new NextResponse('ADMIN_SECRET is not configured.', { status: 500 });
  }

  if (secret !== adminSecret) {
    return new NextResponse('Unauthorized — invalid secret.', { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_bypass', adminSecret, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.redirect(new URL('/admin', request.url));
}

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('admin_bypass');
  return NextResponse.redirect(new URL('/', request.url));
}
