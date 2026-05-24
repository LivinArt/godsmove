'use client';

import { usePathname } from 'next/navigation';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './CinematicSiteLoader.module.css';

const MICRO = [
  'PREPARING DROP',
  'ACCESSING ARCHIVE',
  'AUTHORIZED ENTRY',
] as const;

type BootState = 'gone' | 'boot' | 'reveal' | 'dwell' | 'leave';

function shouldSkipBoot(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login')
  );
}

export function CinematicSiteLoader() {
  const pathname = usePathname();
  const [boot, setBoot] = useState<BootState>('gone');
  const [routeFlash, setRouteFlash] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const dwellRef = useRef(1.6);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevPath = useRef<string | null>(null);
  const bootStarted = useRef(false);
  const line = useMemo(
    () => MICRO[Math.floor(Math.random() * MICRO.length)],
    []
  );

  /* ── Reduced motion ─────────────────────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const fn = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  /* ── Boot sequence (storefront only, first paint) ───────────── */
  useLayoutEffect(() => {
    if (bootStarted.current) return;
    bootStarted.current = true;

    if (shouldSkipBoot(pathname)) {
      setBoot('gone');
      return;
    }

    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduceMotion(rm);

    const dwell = rm ? 0.12 : 1.2 + Math.random() * 1.0; /* ~1200–2200ms */
    dwellRef.current = dwell;

    setBoot('boot');

    const clearAll = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    if (rm) {
      schedule(() => setBoot('dwell'), 0);
      schedule(() => setBoot('leave'), 80);
      schedule(() => {
        setBoot('gone');
        clearAll();
      }, 220);
      return clearAll;
    }

    schedule(() => setBoot('reveal'), 90);
    schedule(() => setBoot('dwell'), 420);
    schedule(() => setBoot('leave'), 420 + dwell * 1000);
    schedule(() => {
      setBoot('gone');
      clearAll();
    }, 420 + dwell * 1000 + 780);

    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot runs once per session mount
  }, []);

  /* ── Body scroll lock during boot ─────────────────────────────── */
  useEffect(() => {
    if (boot === 'gone' || boot === 'leave') {
      document.documentElement.style.removeProperty('overflow');
      return;
    }
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.removeProperty('overflow');
    };
  }, [boot]);

  /* ── Lightweight route pulse (client navigations) ───────────── */
  useEffect(() => {
    if (shouldSkipBoot(pathname)) {
      prevPath.current = pathname;
      return;
    }
    if (prevPath.current === null) {
      prevPath.current = pathname;
      return;
    }
    if (prevPath.current === pathname) return;

    const from = prevPath.current;
    prevPath.current = pathname;

    if (from.startsWith('/admin') || pathname.startsWith('/admin')) return;

    setRouteFlash(true);
    const t = setTimeout(() => setRouteFlash(false), 650);
    return () => clearTimeout(t);
  }, [pathname]);

  const showVeil = boot !== 'gone';
  const dataState =
    boot === 'boot'
      ? 'enter'
      : boot === 'reveal'
        ? 'reveal'
        : boot === 'dwell'
          ? 'hold'
          : boot === 'leave'
            ? 'exit'
            : 'gone';

  const rootClass = [styles.root, reduceMotion ? styles.reduce : '']
    .filter(Boolean)
    .join(' ');

  const dwellStyle = {
    ['--gm-dwell' as string]: `${reduceMotion ? 0.05 : dwellRef.current}s`,
  } as React.CSSProperties;

  return (
    <>
      {showVeil ? (
        <div
          className={rootClass}
          data-state={dataState}
          style={dwellStyle}
          aria-busy={boot === 'dwell' || boot === 'reveal'}
          aria-live="polite"
          aria-label="Loading"
        >
          <div className={styles.backdrop} />
          <div className={`${styles.vignette} ${reduceMotion ? '' : styles.pulse}`} />
          <div
            className={`${styles.grain} ${reduceMotion ? '' : `${styles.grainMotion}`}`}
            aria-hidden
          />

          <div className={styles.inner}>
            <p className={styles.wordmark}>GODSMOVE</p>
            <p className={styles.micro}>{line}</p>
            <div className={styles.progressTrack} aria-hidden>
              <div className={styles.progressFill} />
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`${styles.routeLine} ${reduceMotion ? styles.reduceRoute : ''}`}
        data-active={routeFlash ? 'true' : 'false'}
        aria-hidden
      />
    </>
  );
}
