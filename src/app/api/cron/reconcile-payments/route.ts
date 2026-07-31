import { NextRequest, NextResponse } from 'next/server';
import { reconcilePendingPayments, cleanupExpiredCheckoutSessions } from '@/actions/order.actions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In dev mode, allow unauthenticated local requests if CRON_SECRET is unconfigured
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
      }
    }

    // 1. Run out-of-band payment reconciliation against Razorpay REST API
    const reconcileResult = await reconcilePendingPayments();

    // 2. Clean up expired checkout sessions (>30m old)
    const cleanupResult = await cleanupExpiredCheckoutSessions();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      reconciliation: reconcileResult,
      cleanup: cleanupResult,
    });
  } catch (error: any) {
    console.error('Background payment reconciliation cron error:', error);
    return NextResponse.json(
      { error: error?.message || 'Reconciliation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
