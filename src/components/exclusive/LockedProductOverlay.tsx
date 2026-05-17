'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { unlockProduct } from '@/actions/exclusive.actions';
import { ExclusiveCountdown } from './ExclusiveCountdown';
import { useStore } from '@/store/useStore';
import styles from './exclusive.module.css';

type Props = {
  productId: string;
  productSlug: string;
  teaser?: string | null;
  unlockButtonText?: string | null;
  endsAt?: string | null;
  coverImage?: string | null;
  isLoggedIn: boolean;
};

export function LockedProductOverlay({
  productId,
  productSlug,
  teaser,
  unlockButtonText,
  endsAt,
  coverImage,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const { showToast } = useStore();
  const [pending, startTransition] = useTransition();

  const handleUnlock = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/product/${productSlug}`);
      return;
    }

    startTransition(async () => {
      try {
        await unlockProduct({ productId });
        showToast('Access Unlocked', 'Welcome inside.');
        router.refresh();
      } catch (e: unknown) {
        showToast('Unlock Failed', e instanceof Error ? e.message : 'Please try again.');
      }
    });
  };

  return (
    <div className={styles.lockedWrap}>
      {coverImage && (
        <div
          className={styles.lockedBg}
          style={{ backgroundImage: `url(${coverImage})` }}
          aria-hidden
        />
      )}
      <div className={styles.lockedVeil} />
      <div className={styles.lockedContent}>
        <Lock size={28} strokeWidth={1.2} />
        <p className={styles.lockedTeaser}>
          {teaser || 'Some designs are released. Others are earned.'}
        </p>
        {endsAt && (
          <div className={styles.lockedCountdown}>
            <span className="caption" style={{ display: 'block', marginBottom: 12, opacity: 0.6 }}>
              Selection closes in
            </span>
            <ExclusiveCountdown endsAt={endsAt} />
          </div>
        )}
        <p className={styles.lockedScarcity}>Invitation-only access · Limited selection window</p>
        {isLoggedIn ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handleUnlock}
            disabled={pending}
            style={{ marginTop: 24, minWidth: 220 }}
          >
            {pending ? 'Unlocking…' : unlockButtonText || 'Unlock Access'}
          </button>
        ) : (
          <Link href={`/login?redirectTo=/product/${productSlug}`} className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
            {unlockButtonText || 'Unlock Access'}
          </Link>
        )}
      </div>
    </div>
  );
}
