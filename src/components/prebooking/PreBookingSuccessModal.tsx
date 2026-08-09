'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Crown, ArrowRight } from 'lucide-react';
import styles from './PreBookingModals.module.css';

interface PreBookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber?: string;
  productName?: string;
  size?: string;
  expectedDispatch?: string;
}

export function PreBookingSuccessModal({
  isOpen,
  onClose,
  orderNumber,
  productName,
  size,
  expectedDispatch,
}: PreBookingSuccessModalProps) {
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
            <span className={styles.headerBadge}>
              <CheckCircle2 size={13} style={{ color: '#d4af37' }} />
              ALLOCATION CONFIRMED
            </span>
          </div>
          <h2 className={styles.modalTitle}>PRE-BOOKING CONFIRMED</h2>
          <p className={styles.modalSubtitle}>
            Your allocation is secured.
            {orderNumber && <span className={styles.orderTag}> #{orderNumber}</span>}
          </p>
        </div>

        <div className={styles.body}>
          {/* Member Status Card */}
          <div className={styles.memberBox}>
            <div className={styles.memberHeader}>
              <Crown size={16} className={styles.crownIcon} />
              <span className={styles.memberTitle}>YOU'RE NOW A GODSMOVE MEMBER</span>
            </div>
            <p className={styles.memberDesc}>
              Your pre-booking includes complimentary GODSMOVE membership with exclusive privileges and early vault access.
            </p>
            <button
              type="button"
              className={styles.memberLinkBtn}
              onClick={() => {
                onClose();
                router.push('/membership');
              }}
            >
              VIEW MEMBERSHIP PERKS <ArrowRight size={13} />
            </button>
          </div>

          {/* Details Summary */}
          {(productName || expectedDispatch) && (
            <div className={styles.detailCard}>
              {productName && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Product</span>
                  <span className={styles.detailValue}>
                    {productName} {size ? `(${size})` : ''}
                  </span>
                </div>
              )}
              {expectedDispatch && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Dispatch Promise</span>
                  <span className={styles.detailValue}>{expectedDispatch}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.ctaGrid}>
            <button
              type="button"
              className={styles.primaryCta}
              onClick={() => {
                onClose();
                router.push('/exclusive-rack');
              }}
            >
              EXPLORE THE VAULT
            </button>

            <button
              type="button"
              className={styles.secondaryCta}
              onClick={() => {
                onClose();
                router.push('/profile?tab=prebookings');
              }}
            >
              MY PRE-BOOKINGS
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
