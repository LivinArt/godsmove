'use client';

import Link from 'next/link';
import { ExclusiveCountdown } from '@/components/exclusive/ExclusiveCountdown';
import styles from './exclusive-access.module.css';

type DashboardData = {
  unlocks: Array<{
    unlockedAt: string;
    product: {
      id: string;
      name: string;
      slug: string;
      images?: { url: string }[];
      exclusiveDraws?: Array<{ endsAt: string; status: string }>;
    };
  }>;
  reservations: Array<{
    id: string;
    status: string;
    amount: number;
    createdAt: string;
    variant?: { size: string };
    draw?: {
      endsAt: string;
      status: string;
      product?: { name: string; slug: string; images?: { url: string }[] };
    };
    winnerRecord?: { id: string } | null;
  }>;
  wallet?: {
    balance: number;
    transactions?: Array<{
      amount: number;
      description?: string | null;
      createdAt: string;
    }>;
  } | null;
};

export function ExclusiveAccessPanel({ data }: { data: DashboardData }) {
  const balance = Number(data.wallet?.balance ?? 0);
  const exclusiveCredits = data.wallet?.transactions ?? [];

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Store Credit</h2>
        <p className={styles.balance}>₹{balance.toLocaleString('en-IN')}</p>
        {exclusiveCredits.length > 0 && (
          <ul className={styles.creditList}>
            {exclusiveCredits.map((tx) => (
              <li key={tx.createdAt + tx.amount}>
                <span>+₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                <span>{tx.description || 'Exclusive draw credit'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Unlocked Access</h2>
        {data.unlocks.length === 0 ? (
          <p className={styles.empty}>No exclusive products unlocked yet.</p>
        ) : (
          <ul className={styles.productList}>
            {data.unlocks.map((u) => {
              const draw = u.product.exclusiveDraws?.[0];
              const img = u.product.images?.[0]?.url;
              return (
                <li key={u.product.id} className={styles.productCard}>
                  {img && <img src={img} alt="" className={styles.thumb} />}
                  <div>
                    <Link href={`/product/${u.product.slug}`} className={styles.productName}>
                      {u.product.name}
                    </Link>
                    <p className={styles.meta}>Unlocked {new Date(u.unlockedAt).toLocaleDateString('en-IN')}</p>
                    {draw && draw.status === 'OPEN' && (
                      <div className={styles.countdown}>
                        <ExclusiveCountdown endsAt={draw.endsAt} compact />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Reservations</h2>
        {data.reservations.length === 0 ? (
          <p className={styles.empty}>No reservations yet.</p>
        ) : (
          <ul className={styles.reservationList}>
            {data.reservations.map((r) => {
              const product = r.draw?.product;
              const statusLabel =
                r.status === 'WINNER'
                  ? 'Selected'
                  : r.status === 'NON_WINNER'
                    ? 'Credited'
                    : r.status === 'PAID'
                      ? 'In draw'
                      : r.status;
              return (
                <li key={r.id} className={styles.reservationItem}>
                  <div>
                    <strong>{product?.name ?? 'Exclusive drop'}</strong>
                    <span className={styles.statusBadge} data-status={r.status}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className={styles.meta}>
                    Size {r.variant?.size} · ₹{Number(r.amount).toLocaleString('en-IN')} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </p>
                  {product?.slug && (
                    <Link href={`/product/${product.slug}`} className={styles.link}>
                      View product
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
