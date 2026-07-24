'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { runExclusiveDraw, refundParticipants } from '@/actions/exclusive.actions';

type DrawRow = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  drawnAt?: string | null;
  winnerCount: number;
  product: {
    id: string;
    name: string;
    slug: string;
    reservationPrice?: number | null;
    images?: { url: string }[];
  };
  _count: { reservations: number; winners: number };
  reservations?: { id: string }[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    OPEN: '#22c55e',
    CLOSED: '#f59e0b',
    COMPLETED: '#6b7280',
  };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: colors[status] || '#888',
      }}
    >
      {status}
    </span>
  );
}

export function ExclusiveDrawsTable({ draws }: { draws: DrawRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleRunDraw = (drawId: string) => {
    if (!confirm('Run draw now? This will select winners and issue wallet credits. This action is idempotent.')) return;
    startTransition(async () => {
      try {
        const result = (await runExclusiveDraw({ drawId })) as {
          alreadyCompleted?: boolean;
          winners?: unknown[];
        };
        setMessage(
          result.alreadyCompleted
            ? 'Draw was already completed'
            : `Draw completed — ${result.winners?.length ?? 0} winner(s) selected`
        );
        router.refresh();
      } catch (e: unknown) {
        setMessage(e instanceof Error ? e.message : 'Draw failed');
      }
    });
  };

  const handleReissueCredits = (drawId: string) => {
    startTransition(async () => {
      try {
        const result = await refundParticipants({ drawId });
        setMessage(`Reissued ${result.credited} wallet credit(s)`);
        router.refresh();
      } catch (e: unknown) {
        setMessage(e instanceof Error ? e.message : 'Reissue failed');
      }
    });
  };

  if (!draws.length) {
    return (
      <div className="admin-card" style={{ padding: 48, textAlign: 'center', color: 'var(--admin-muted)' }}>
        No exclusive draws yet. Enable Exclusive Unlock on a product and publish it.
      </div>
    );
  }

  return (
    <div className="admin-card" style={{ overflow: 'auto' }}>
      {message && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--admin-border)', fontSize: 13 }}>
          {message}
        </div>
      )}
      <table className="admin-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Status</th>
            <th>Reservations</th>
            <th>Ends</th>
            <th>Winners</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {draws.map((draw) => {
            const paidCount = draw.reservations?.length ?? draw._count.reservations;
            const isExpired = new Date(draw.endsAt) < new Date();
            return (
              <tr key={draw.id}>
                <td>
                  <Link href={`/product/${draw.product.slug}`} style={{ fontWeight: 600 }}>
                    {draw.product.name}
                  </Link>
                  {draw.product.reservationPrice != null && (
                    <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                      ₹{draw.product.reservationPrice} reservation
                    </div>
                  )}
                </td>
                <td>{statusBadge(draw.status)}</td>
                <td>{paidCount}</td>
                <td>
                  {formatDate(draw.endsAt)}
                  {isExpired && draw.status === 'OPEN' && (
                    <div style={{ fontSize: 11, color: '#f59e0b' }}>Expired</div>
                  )}
                </td>
                <td>{draw._count.winners} / {draw.winnerCount}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {draw.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        disabled={pending || paidCount === 0}
                        onClick={() => handleRunDraw(draw.id)}
                      >
                        Run Draw
                      </button>
                    )}
                    {draw.status === 'COMPLETED' && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        disabled={pending}
                        onClick={() => handleReissueCredits(draw.id)}
                      >
                        Reissue Credits
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
