'use client';

import { useLayoutEffect, useRef, type RefObject } from 'react';

export type AtmosphericRevealMode = 'vault' | 'card';

type Options = {
  enabled: boolean;
  mode: AtmosphericRevealMode;
};

/**
 * Sets --rx/--ry (mask focal %), --mx/--my (-0.5…0.5), --parallax-amt, --glow-nudge,
 * and data-reveal-interaction on the wrapper. No React state on pointer move (rAF batch).
 */
export function useAtmosphericRevealPointer(
  wrapRef: RefObject<HTMLElement | null>,
  { enabled, mode }: Options
) {
  const rafRef = useRef<number | null>(null);
  const pendingPointer = useRef<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !enabled) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touchLike =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(max-width: 767px)').matches;

    if (reducedMotion) {
      wrap.setAttribute('data-reveal-interaction', 'reduced');
      return;
    }

    if (touchLike) {
      wrap.setAttribute('data-reveal-interaction', 'touch');
      return;
    }

    const tablet = window.matchMedia('(max-width: 1023px)').matches;
    const fine = mode === 'vault' ? (tablet ? 2.2 : 3.2) : tablet ? 1.6 : 2.4;
    wrap.style.setProperty('--parallax-amt', String(fine));
    wrap.style.setProperty('--glow-nudge', tablet ? '2' : '3');
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
      wrap.style.setProperty('--ry', '46%');
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
  }, [enabled, mode]);
}
