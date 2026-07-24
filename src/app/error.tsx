'use client';

import { useEffect } from 'react';
import styles from './not-found.module.css'; // Reuse 404 centering styles for consistency

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className={styles.page}>
      <div className={styles.logoWrap}>
        <img
          src="/images/logo/logo-vertical-white.png"
          alt="GODSMOVE"
          className={styles.logo}
        />
      </div>
      <h1 className={styles.title}>500 — PROTOCOL BROKEN</h1>
      <p className={styles.text}>
        An unexpected error occurred in our system. The veil will be restored shortly.
      </p>
      <button onClick={() => reset()} className={styles.homeBtn} style={{ border: 'none', cursor: 'pointer' }}>
        Reset Connection
      </button>
    </div>
  );
}
