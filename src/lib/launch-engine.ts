'use client';

import { useState, useEffect } from 'react';
import { CountdownState } from '@/types/launch';
import { getPreBookingCountdown } from './launch-engine-core';

export * from './launch-engine-core';

/**
 * Synchronized React Countdown Ticker Hook for PDPs, cards, profile, and widgets.
 */
export function useSynchronizedCountdown(launchDateTime: string | Date | null | undefined) {
  const [countdown, setCountdown] = useState<CountdownState>(() => getPreBookingCountdown(launchDateTime));

  useEffect(() => {
    if (!launchDateTime) return;

    const tick = () => {
      const state = getPreBookingCountdown(launchDateTime);
      setCountdown(state);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [launchDateTime]);

  return countdown;
}
