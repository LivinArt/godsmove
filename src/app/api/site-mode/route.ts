import { NextResponse } from 'next/server';
import { getSiteMode } from '@/actions/site-config.actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const siteMode = await getSiteMode();
    return NextResponse.json({ siteMode }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch {
    return NextResponse.json({ siteMode: 'PRELAUNCH' }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  }
}
