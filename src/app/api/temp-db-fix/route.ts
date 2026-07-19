import { NextResponse } from 'next/server';

/**
 * GET /api/temp-db-fix
 * Temporary diagnostic route — kept as a 404 placeholder. Safe to delete.
 */
export async function GET() {
  return NextResponse.json({ message: 'Nothing to see here.' }, { status: 404 });
}
