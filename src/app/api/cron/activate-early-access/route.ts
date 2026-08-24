import { NextRequest, NextResponse } from 'next/server';
import { activateScheduledEarlyAccessMemberships } from '@/actions/early-access.actions';
import { isStoreLaunched } from '@/lib/launch-config';

export const dynamic = 'force-dynamic';

/**
 * Production Automated Cron Endpoint for Early Access Membership Activation.
 * Runs on official store launch date (15 September 2026 00:00 IST).
 *
 * Vercel Cron or external scheduler invokes this endpoint.
 * Protected by CRON_SECRET authorization header in production.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized cron execution' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const forceRun = searchParams.get('force') === 'true';

    if (!isStoreLaunched() && !forceRun) {
      return NextResponse.json({
        success: true,
        activatedCount: 0,
        message: 'Store launch date has not arrived yet. Activation skipped.',
      });
    }

    const result = await activateScheduledEarlyAccessMemberships(forceRun);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error in early access activation cron endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
