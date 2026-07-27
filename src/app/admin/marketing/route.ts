import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace('/admin/marketing', '/admin/communication');
  return NextResponse.redirect(url);
}
