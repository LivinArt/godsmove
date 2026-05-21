'use client';

import { useLayoutEffect, useRef, useTransition, type CSSProperties } from 'react';
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

/**
 * EXCLUSIVE_UNLOCK locked vault only (invoked from ProductClient when channel is unlock + locked).
 * Parallax + masked reveal: CSS variables updated from pointer — no React state on move.
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
  const { showToast } = useStore();
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPointer = useRef<{ x: number; y: number } | null>(null);

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

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !coverImage) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touchLike =
      window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 767px)').matches;

    if (reducedMotion) {
      wrap.setAttribute('data-reveal-interaction', 'reduced');
      return;
    }

    if (touchLike) {
      wrap.setAttribute('data-reveal-interaction', 'touch');
      return;
    }

    const tablet = window.matchMedia('(max-width: 1023px)').matches;
    wrap.style.setProperty('--parallax-amt', tablet ? '2' : '4');
    wrap.setAttribute('data-reveal-interaction', 'pointer');

    const setVars = (clientX: number, clientY: number) => {
      const r = wrap.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const x = ((clientX - r.left) / r.width) * 100;
      const y = ((clientY - r.top) / r.height) * 100;
      const mx = (clientX - r.left) / r.width - 0.5;
      const my = (clientY - r.top) / r.height - 0.5;
      wrap.style.setProperty('--rx', `${x}%`);
      wrap.style.setProperty('--ry', `${y}%`);
      wrap.style.setProperty('--mx', mx.toFixed(4));
      wrap.style.setProperty('--my', my.toFixed(4));
    };

    const flush = () => {
      rafRef.current = null;
      const p = pendingPointer.current;
      if (p) setVars(p.x, p.y);
    };

    const onMove = (e: MouseEvent) => {
      pendingPointer.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(flush);
    };

    const onLeave = () => {
      wrap.style.setProperty('--rx', '50%');
      wrap.style.setProperty('--ry', '44%');
      wrap.style.setProperty('--mx', '0');
      wrap.style.setProperty('--my', '0');
    };

    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);

    return () => {
      wrap.removeEventListener('mousemove', onMove);
      wrap.removeEventListener('mouseleave', onLeave);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [coverImage]);

  return (
    <div
      ref={wrapRef}
      className={`${styles.lockedWrap} ${coverImage ? styles.lockedWrapParallax : ''}`}
      style={
        coverImage
          ? ({
              ['--rx' as string]: '50%',
              ['--ry' as string]: '44%',
              ['--mx' as string]: '0',
              ['--my' as string]: '0',
              ['--parallax-amt' as string]: '4',
            } as CSSProperties)
          : undefined
      }
    >
      {coverImage ? (
        <div className={styles.revealStage} aria-hidden>
          <div className={styles.revealAmbientGlow} />
          <div
            className={styles.revealSharp}
            style={{ backgroundImage: `url(${coverImage})` }}
          />
          <div
            className={styles.revealObscured}
            style={{ backgroundImage: `url(${coverImage})` }}
          />
          <div className={styles.revealGoldFollow} />
          <div className={styles.revealNoise} />
        </div>
      ) : null}

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
          <Link href={`/login?redirectTo=/product/${productSlug}`} className={styles.vaultCta}>
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
