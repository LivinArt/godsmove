'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { createReservation, confirmReservationPayment } from '@/actions/exclusive.actions';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useStore } from '@/store/useStore';
import { ExclusiveCountdown } from './ExclusiveCountdown';
import styles from './exclusive.module.css';

type AccessState = {
  unlocked: boolean;
  reservation?: {
    id: string;
    status: string;
    variant?: { size: string };
  } | null;
};

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    exclusiveStory?: string | null;
    exclusiveBadgeText?: string | null;
    reserveButtonText?: string | null;
    reservationPrice?: number | null;
  };
  draw: { id: string; endsAt: string; status: string } | null;
  access: AccessState;
  selectedVariantId: string | null;
  selectedSize: string | null;
  onSizeRequired: () => void;
};

export function ExclusiveProductExperience({
  product,
  draw,
  access,
  selectedVariantId,
  selectedSize,
  onSizeRequired,
}: Props) {
  const router = useRouter();
  const { showToast } = useStore();
  const { initiatePayment } = useRazorpay();
  const [pending, startTransition] = useTransition();

  const reservationPrice = Number(product.reservationPrice ?? 0);
  const hasReservation = ['PAID', 'WINNER', 'NON_WINNER', 'PENDING'].includes(
    access.reservation?.status ?? ''
  );
  const isWinner = access.reservation?.status === 'WINNER';
  const isPaid = ['PAID', 'WINNER', 'NON_WINNER'].includes(access.reservation?.status ?? '');

  const handleReserve = () => {
    if (!selectedVariantId || !selectedSize) {
      onSizeRequired();
      return;
    }
    if (!draw || draw.status !== 'OPEN') {
      showToast('Window Closed', 'Reservation window is closed.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await createReservation({
          productId: product.id,
          variantId: selectedVariantId,
        });

        const reservationId = result.reservation.id;
        const amount = result.amount as number;

        await initiatePayment({
          amount,
          description: `Reservation — ${product.name}`,
          name: 'GODSMOVE Exclusive',
          onSuccess: async (response) => {
            try {
              await confirmReservationPayment({
                reservationId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
              });
              showToast('Reservation Confirmed', 'You are in the draw.');
              router.refresh();
            } catch (e: unknown) {
              showToast('Confirmation Failed', e instanceof Error ? e.message : 'Contact support.');
            }
          },
          onError: (err) => {
            showToast('Payment', typeof err === 'string' ? err : 'Payment cancelled.');
          },
        });
      } catch (e: unknown) {
        showToast('Reservation Failed', e instanceof Error ? e.message : 'Please try again.');
      }
    });
  };

  if (!access.unlocked) return null;

  return (
    <div className={`${styles.revealEnter}`}>
      <span className={styles.revealBadge}>
        <Sparkles size={12} />
        {product.exclusiveBadgeText || 'Member Access'}
      </span>

      {product.exclusiveStory && (
        <section className={styles.exclusiveStory}>
          <h3>The Story</h3>
          <p>{product.exclusiveStory}</p>
        </section>
      )}

      {draw && draw.status === 'OPEN' && (
        <div style={{ marginTop: 28, padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="caption" style={{ marginBottom: 12 }}>Selection window closes in</p>
          <ExclusiveCountdown endsAt={draw.endsAt} compact />
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>
          Reservation · ₹{reservationPrice.toLocaleString('en-IN')}
          <span style={{ opacity: 0.5 }}> (credited to wallet after draw)</span>
        </p>

        {isWinner && (
          <p style={{ color: '#c9a962', fontSize: 14, marginBottom: 12 }}>
            You were selected. This piece is yours.
          </p>
        )}

        {isPaid && !isWinner && access.reservation?.status === 'PAID' && (
          <p style={{ fontSize: 14, marginBottom: 12, opacity: 0.8 }}>
            Reserved · Size {access.reservation.variant?.size}. Awaiting draw.
          </p>
        )}

        {access.reservation?.status === 'NON_WINNER' && (
          <p style={{ fontSize: 14, marginBottom: 12, opacity: 0.8 }}>
            Draw complete. Your reservation has been credited to your wallet.
          </p>
        )}

        {!hasReservation && draw?.status === 'OPEN' && (
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={pending}
            onClick={handleReserve}
          >
            {pending ? 'Processing…' : product.reserveButtonText || 'Reserve This Drop'}
          </button>
        )}

        {hasReservation && isPaid && (
          <button type="button" className="btn-secondary" style={{ width: '100%' }} disabled>
            Reservation Active
          </button>
        )}
      </div>
    </div>
  );
}
