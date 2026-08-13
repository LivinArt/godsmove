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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className={styles.overlay} 
      style={{
        paddingTop: 'calc(var(--header-height, 80px) + 24px)',
        zIndex: 9999,
        background: 'rgba(5, 5, 5, 0.92)',
        backdropFilter: 'blur(16px)',
      }} 
      role="dialog" 
      aria-modal="true"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitleRow}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)',
            }}>
              <CheckCircle2 size={26} style={{ color: '#22c55e' }} />
            </div>
          </div>
          <h2 className={styles.modalTitle} style={{ fontSize: '24px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>ORDER PLACED SUCCESSFULLY</h2>
          <p className={styles.modalSubtitle} style={{ marginTop: '6px' }}>
            Your order has been confirmed.
          </p>
          {orderNumber && (
            <p style={{
              fontSize: '12px',
              letterSpacing: '0.14em',
              color: '#c8a46a',
              textTransform: 'uppercase',
              marginTop: '12px',
              fontWeight: 700,
              background: 'rgba(200, 164, 106, 0.08)',
              padding: '6px 14px',
              borderRadius: '4px',
              display: 'inline-block',
            }}>
              Order #{orderNumber}
            </p>
          )}
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

          {/* Action Buttons — EXACT CTA LABELS & DESTINATIONS */}
          <div className={styles.ctaGrid} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className={styles.primaryCta}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: '#c8a46a',
                color: '#0a0a0a',
                border: 'none',
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              onClick={() => {
                window.location.href = '/#split-banner';
              }}
            >
              EXPLORE MORE
            </button>

            <button
              type="button"
              className={styles.secondaryCta}
              style={{
                width: '100%',
                padding: '15px 24px',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(200, 164, 106, 0.35)',
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              onClick={() => {
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
