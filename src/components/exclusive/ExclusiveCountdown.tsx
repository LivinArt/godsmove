'use client';

import { useEffect, useState } from 'react';
import styles from './exclusive.module.css';

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
] as const;

export function ExclusiveCountdown({
  endsAt,
  variant = 'vault',
}: {
  endsAt: string;
  variant?: 'vault' | 'compact';
}) {
  const [left, setLeft] = useState(() => getTimeLeft(endsAt));
  const isVault = variant === 'vault';

  useEffect(() => {
    const t = setInterval(() => setLeft(getTimeLeft(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (!left) {
    return (
      <p className={isVault ? styles.countdownClosed : styles.countdownClosedCompact}>
        Selection window closed
      </p>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className={isVault ? styles.countdownVault : styles.countdownCompact}
      role="timer"
      aria-live="polite"
    >
      {UNITS.map((unit) => (
        <div key={unit.key} className={styles.countdownUnit}>
          <span className={isVault ? styles.countdownDigit : styles.countdownDigitCompact}>
            {pad(left[unit.key])}
          </span>
          <span className={isVault ? styles.countdownLabel : styles.countdownLabelCompact}>
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
