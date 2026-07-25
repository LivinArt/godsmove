'use client';

import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import styles from './LuxuryAuthLoader.module.css';

interface Props {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
}

export function LuxuryAuthLoader({
  isVisible,
  title = 'Authenticating...',
  subtitle = 'Securely connecting your account',
}: Props) {
  if (!isVisible) return null;

  return (
    <div className={styles.overlay} aria-live="polite" aria-busy="true">
      <div className={styles.glowEffect} />
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <Image
            src="/images/logo/auth-modal-logo.png"
            alt="GODSMOVE"
            width={160}
            height={40}
            priority
            className={styles.logo}
          />
        </div>
        <div className={styles.spinnerWrap}>
          <Loader2 size={24} className={styles.spinner} />
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}
