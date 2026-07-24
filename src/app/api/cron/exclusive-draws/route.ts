import { NextResponse } from 'next/server';
import { processExpiredExclusiveDraws } from '@/actions/exclusive.actions';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processExpiredExclusiveDraws();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[cron/exclusive-draws]', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
