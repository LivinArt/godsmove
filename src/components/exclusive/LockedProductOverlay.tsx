'use client';

import { useTransition } from 'react';
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

  const ctaLabel = unlockButtonText?.trim() || 'Request Clearance';

  const handleUnlock = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirectTo=/product/${productSlug}`);
      return;
    }

    startTransition(async () => {
      try {
        await unlockProduct({ productId });
        showToast('Clearance Granted', 'You may proceed with acquisition.');
        router.refresh();
      } catch (e: unknown) {
        showToast('Clearance Denied', e instanceof Error ? e.message : 'Please try again.');
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
      <div className={styles.lockedGlow} aria-hidden />

      <div className={styles.lockedContent}>
        <div className={styles.vaultIcon} aria-hidden>
          <Lock size={32} strokeWidth={1.25} />
        </div>

        <p className={styles.vaultStatus}>Invitation Only</p>

        {endsAt ? (
          <>
            <p className={styles.vaultCountdownHeading}>Selection Window Closes In</p>
            <div className={styles.lockedCountdown}>
              <ExclusiveCountdown endsAt={endsAt} variant="vault" />
            </div>
          </>
        ) : (
          <p className={styles.vaultCountdownHeading}>Acquisition Window Pending</p>
        )}

        <p className={styles.vaultSupport}>
          Access is limited to approved custodians.
          <br />
          Only one artifact may be secured during this release window.
        </p>

        {teaser && <p className={styles.vaultTeaser}>{teaser}</p>}

        {isLoggedIn ? (
          <button
            type="button"
            className={styles.vaultCta}
            onClick={handleUnlock}
            disabled={pending}
          >
            {pending ? 'Processing…' : ctaLabel}
          </button>
        ) : (
          <Link
            href={`/login?redirectTo=/product/${productSlug}`}
            className={styles.vaultCta}
          >
            {ctaLabel}
          </Link>
        )}

        <p className={styles.vaultTrust}>
          Approval grants a temporary acquisition opportunity.
        </p>
      </div>
    </div>
  );
}
