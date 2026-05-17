'use client';

import { useEffect, useState } from 'react';

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function ExclusiveCountdown({ endsAt, compact }: { endsAt: string; compact?: boolean }) {
  const [left, setLeft] = useState(() => getTimeLeft(endsAt));

  useEffect(() => {
    const t = setInterval(() => setLeft(getTimeLeft(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (!left) {
    return <span style={{ fontSize: compact ? 12 : 14, opacity: 0.7 }}>Selection window closed</span>;
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      style={{
        display: 'flex',
        gap: compact ? 8 : 16,
        alignItems: 'center',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.08em',
      }}
    >
      {[
        { label: 'D', value: left.days },
        { label: 'H', value: left.hours },
        { label: 'M', value: left.minutes },
        { label: 'S', value: left.seconds },
      ].map((u) => (
        <div key={u.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: compact ? 18 : 28, fontWeight: 300, lineHeight: 1 }}>
            {pad(u.value)}
          </div>
          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>{u.label}</div>
        </div>
      ))}
    </div>
  );
}
