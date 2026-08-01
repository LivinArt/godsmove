'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { getCheckoutSessionToken, clearCheckoutSessionToken } from '@/lib/checkout-session';
import { getActiveCheckoutSessionAction, verifyCheckoutSessionAction } from '@/actions/order.actions';
import styles from './GlobalPaymentRecoveryModal.module.css';

type RecoveryState = 'IDLE' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'STILL_PENDING';

export default function GlobalPaymentRecoveryModal() {
  const router = useRouter();
  const pathname = usePathname();

  const [activeSession, setActiveSession] = useState<any>(null);
  const [modalState, setModalState] = useState<RecoveryState>('IDLE');
  const [pollCount, setPollCount] = useState(0);

  const isPollingRef = useRef(false);

  // Check for active checkout session on initial load and route changes
  const checkActiveSession = useCallback(async () => {
    // Don't pop modal if already on payment recovery full page
    if (pathname?.startsWith('/checkout/payment-recovery')) {
      return;
    }

    const token = getCheckoutSessionToken();
    if (!token && modalState === 'IDLE') return;

    try {
      const res = await getActiveCheckoutSessionAction(token || undefined);
      if (res.success && res.hasActiveSession && res.session) {
        setActiveSession(res.session);
        setModalState('VERIFYING');
      } else if (!res.hasActiveSession && modalState === 'VERIFYING') {
        // Session completed or cleaned up
        clearCheckoutSessionToken();
        setModalState('IDLE');
      }
    } catch {
      // Graceful fallback
    }
  }, [pathname, modalState]);

  useEffect(() => {
    checkActiveSession();
  }, [checkActiveSession]);

  // Execute 2-second REST verification polling up to 12s (6 attempts)
  const runVerificationPoll = useCallback(async () => {
    if (!activeSession?.orderId || isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const res = await verifyCheckoutSessionAction(activeSession.orderId);

      if (res.success && res.isCaptured) {
        clearCheckoutSessionToken();
        setModalState('SUCCESS');
        isPollingRef.current = false;
        return;
      }

      if (res.success && res.isFailed) {
        clearCheckoutSessionToken();
        setModalState('FAILED');
        isPollingRef.current = false;
        return;
      }

      // If poll count reached 6 (12s total), show STILL_PENDING message
      setPollCount((prev) => {
        const next = prev + 1;
        if (next >= 6) {
          setModalState('STILL_PENDING');
        }
        return next;
      });
    } catch {
      // Continue polling
    } finally {
      isPollingRef.current = false;
    }
  }, [activeSession]);

  useEffect(() => {
    if (modalState !== 'VERIFYING' || !activeSession?.orderId) return;

    const interval = setInterval(() => {
      runVerificationPoll();
    }, 2000);

    // Run first check immediately
    runVerificationPoll();

    return () => clearInterval(interval);
  }, [modalState, activeSession?.orderId, runVerificationPoll]);

  const handleDismiss = () => {
    clearCheckoutSessionToken();
    setModalState('IDLE');
    setActiveSession(null);
  };

  const handleViewOrders = () => {
    handleDismiss();
    router.push('/profile?tab=orders');
  };

  if (modalState === 'IDLE' || !activeSession) {
    return null;
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        {modalState === 'VERIFYING' && (
          <>
            <div className={styles.iconWrapper}>
              <Loader2 className={`${styles.spinner}`} size={32} />
            </div>
            <div className={styles.badge}>
              <ShieldCheck size={14} /> Encrypted Gateway Verification
            </div>
            <h3 className={styles.title}>Verifying your payment...</h3>
            <p className={styles.description}>
              We are connecting directly to Razorpay REST servers to confirm your transaction status. Please do not close your browser.
            </p>
            {activeSession.orderNumber && (
              <div className={styles.orderDetails}>
                <span className={styles.orderLabel}>Order Reference</span>
                <span className={styles.orderValue}>#{activeSession.orderNumber}</span>
              </div>
            )}
          </>
        )}

        {modalState === 'SUCCESS' && (
          <>
            <div className={styles.iconWrapper} style={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
              <CheckCircle2 size={32} />
            </div>
            <div className={styles.badge} style={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
              Payment Confirmed
            </div>
            <h3 className={styles.title}>Payment Successful!</h3>
            <p className={styles.description}>
              Your payment has been verified and confirmed on Razorpay. Your order is now processing and your allocation is secured.
            </p>
            {activeSession.orderNumber && (
              <div className={styles.orderDetails}>
                <span className={styles.orderLabel}>Order Reference</span>
                <span className={styles.orderValue}>#{activeSession.orderNumber}</span>
              </div>
            )}
            <button className={styles.actionButton} onClick={handleViewOrders}>
              View Order Details <ArrowRight size={16} />
            </button>
          </>
        )}

        {modalState === 'FAILED' && (
          <>
            <div className={styles.iconWrapper} style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertTriangle size={32} />
            </div>
            <div className={styles.badge} style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}>
              Payment Declined
            </div>
            <h3 className={styles.title}>Payment Verification Failed</h3>
            <p className={styles.description}>
              The payment transaction was cancelled or declined by your bank. No money was debited for this order.
            </p>
            <button className={styles.actionButton} onClick={() => { handleDismiss(); router.push('/checkout'); }}>
              Return to Checkout <ArrowRight size={16} />
            </button>
          </>
        )}

        {modalState === 'STILL_PENDING' && (
          <>
            <div className={styles.iconWrapper}>
              <ShieldCheck size={32} />
            </div>
            <div className={styles.badge}>
              Background Synchronization Active
            </div>
            <h3 className={styles.title}>We're still verifying your payment</h3>
            <p className={styles.description}>
              If payment has already been debited from your bank account, your order will automatically update once confirmed by Razorpay. No further payment is required.
            </p>
            {activeSession.orderNumber && (
              <div className={styles.orderDetails}>
                <span className={styles.orderLabel}>Order Reference</span>
                <span className={styles.orderValue}>#{activeSession.orderNumber}</span>
              </div>
            )}
            <button className={styles.actionButton} onClick={handleDismiss}>
              I Understand, Continue Browsing
            </button>
            <button className={styles.secondaryButton} onClick={handleViewOrders}>
              Go to My Orders
            </button>
          </>
        )}
      </div>
    </div>
  );
}
