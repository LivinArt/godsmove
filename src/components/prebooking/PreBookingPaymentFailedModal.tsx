'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertCircle, RotateCcw, ArrowRight } from 'lucide-react';
import styles from './PreBookingModals.module.css';

interface PreBookingPaymentFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorMessage?: string;
}

export function PreBookingPaymentFailedModal({
  isOpen,
  onClose,
  onRetry,
  errorMessage,
}: PreBookingPaymentFailedModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKey);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <span className={styles.headerBadgeError}>
              <AlertCircle size={13} style={{ color: '#e53e3e' }} />
              PAYMENT UNRESOLVED
            </span>
          </div>
          <h2 className={styles.modalTitle}>PAYMENT COULD NOT BE COMPLETED</h2>
          <p className={styles.modalSubtitle}>
            {errorMessage || 'Your transaction was interrupted. Your allocation context was saved.'}
          </p>
        </div>

        <div className={styles.body}>
          <div className={styles.detailCard}>
            <p className={styles.detailText}>
              You can retry secure online payment immediately or review your pending pre-booking attempts in your account profile.
            </p>
          </div>

          <div className={styles.ctaGrid}>
            <button
              type="button"
              className={styles.primaryCta}
              onClick={() => {
                onClose();
                onRetry();
              }}
            >
              <RotateCcw size={14} style={{ marginRight: '6px' }} />
              RETRY PAYMENT
            </button>

            <button
              type="button"
              className={styles.secondaryCta}
              onClick={() => {
                onClose();
                router.push('/profile?tab=prebookings');
              }}
            >
              VIEW PRE-BOOKINGS
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
