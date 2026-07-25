'use client';

import { useRef, useTransition, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { unlockProduct } from '@/actions/exclusive.actions';
import { ExclusiveCountdown } from './ExclusiveCountdown';
import { useStore } from '@/store/useStore';
import { AtmosphericLockedRevealLayers } from './AtmosphericLockedRevealLayers';
import { useAtmosphericRevealPointer } from './useAtmosphericRevealPointer';
import { useAuth } from '@/context/AuthContext';
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

/**
 * EXCLUSIVE_UNLOCK locked vault only (invoked from ProductClient when channel is unlock + locked).
 * Atmospheric emergence: CSS variables from pointer — no React state on move.
 */
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
  const { requireAuth } = useAuth();
  const { showToast } = useStore();
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  useAtmosphericRevealPointer(wrapRef, {
    enabled: !!coverImage,
    mode: 'vault',
  });

  const ctaLabel = unlockButtonText?.trim() || 'Request Clearance';

  const handleUnlock = () => {
    requireAuth(
      'unlock',
      () => {
        startTransition(async () => {
          try {
            await unlockProduct({ productId });
            showToast('Clearance Granted', 'You may proceed with acquisition.');
            router.refresh();
          } catch (e: unknown) {
            showToast('Clearance Denied', e instanceof Error ? e.message : 'Please try again.');
          }
        });
      },
      { type: 'navigate', url: `/product/${productSlug}` }
    );
  };

  return (
    <div
      ref={wrapRef}
      className={`${styles.lockedWrap} ${coverImage ? 'gm-atmospheric-reveal-host' : ''}`}
      style={
        coverImage
          ? ({
              ['--rx' as string]: '50%',
              ['--ry' as string]: '46%',
              ['--mx' as string]: '0',
              ['--my' as string]: '0',
            } as CSSProperties)
          : undefined
      }
    >
      {coverImage ? <AtmosphericLockedRevealLayers imageUrl={coverImage} /> : null}

      <div className={styles.lockedVeil} />
      {!coverImage && <div className={styles.lockedGlow} aria-hidden />}

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

        <button
          type="button"
          className={styles.vaultCta}
          onClick={handleUnlock}
          disabled={pending}
        >
          {pending ? 'Processing…' : ctaLabel}
        </button>

        <p className={styles.vaultTrust}>
          Approval grants a temporary acquisition opportunity.
        </p>
      </div>
    </div>
  );
}
