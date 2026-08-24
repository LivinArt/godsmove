import { NextRequest, NextResponse } from 'next/server';
import { getSiteMode } from '@/actions/site-config.actions';
import { activateScheduledEarlyAccessMemberships } from '@/actions/early-access.actions';

export const dynamic = 'force-dynamic';

/**
 * Early Access Membership Activation Endpoint.
 * Storefront launch is controlled 100% by Admin via siteMode ('PRELAUNCH' vs 'NORMAL').
 * Membership activation occurs when Admin switches the storefront to LIVE.
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

    const mode = await getSiteMode();
    if (mode !== 'NORMAL') {
      return NextResponse.json({
        success: true,
        activatedCount: 0,
        message: 'Storefront launch is controlled strictly via Admin Dashboard. Store is currently PRELAUNCH.',
      });
    }

    const result = await activateScheduledEarlyAccessMemberships(true);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in early access activation cron endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
