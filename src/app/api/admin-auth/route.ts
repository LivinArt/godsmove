import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('Admin secret bypass endpoint is disabled. Authentication must go through Supabase Google OAuth with an assigned ADMIN role.', { status: 403 });
}

export async function DELETE() {
  return new NextResponse('Endpoint disabled.', { status: 403 });
}
