'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw } from 'lucide-react';
import { getCheckoutSessionToken, clearCheckoutSessionToken } from '@/lib/checkout-session';
import {
  getActiveCheckoutSessionAction,
  verifyCheckoutSessionAction,
  resumePaymentSessionAction,
} from '@/actions/order.actions';
import { supportsPaymentRecovery } from '@/lib/payments/payment-capabilities';
import styles from './GlobalPaymentRecoveryModal.module.css';

type RecoveryState = 'IDLE' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'STILL_PENDING' | 'NO_PAYMENT_ATTEMPT';

export default function GlobalPaymentRecoveryModal() {
  const router = useRouter();
  const pathname = usePathname();

  const [activeSession, setActiveSession] = useState<any>(null);
  const [modalState, setModalState] = useState<RecoveryState>('IDLE');
  const [pollCount, setPollCount] = useState(0);
  const [isResuming, setIsResuming] = useState(false);

  const isPollingRef = useRef(false);
  const zeroAttemptsCountRef = useRef(0);

  // Check for active checkout session on initial load and route changes
  const checkActiveSession = useCallback(async () => {
    if (pathname?.startsWith('/checkout/payment-recovery')) {
      return;
    }

    const token = getCheckoutSessionToken();
    if (!token && modalState === 'IDLE') return;

    try {
      const res = await getActiveCheckoutSessionAction(token || undefined);
      if (res.success && res.hasActiveSession && res.session) {
        // ── PAYMENT CAPABILITY ISOLATION GUARD ──────────────────────────────
        // The Recovery Modal is exclusively for recoverable digital gateways
        // (Razorpay, Mixed). COD, and any future non-recoverable method, must
        // never enter verification polling or render the modal.
        // Adding a new recoverable gateway (Stripe, PhonePe) only requires
        // updating RECOVERABLE_PAYMENT_METHODS in payment-capabilities.ts.
        if (!supportsPaymentRecovery({ paymentMethod: res.session.paymentMethod })) {
          clearCheckoutSessionToken();
          return;
        }
        setActiveSession(res.session);
        setModalState('VERIFYING');
      } else if (!res.hasActiveSession && modalState === 'VERIFYING') {
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

  // Execute REST verification with 4-second grace window for attempts == 0
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

      // Check for Grace Window on attempts == 0
      if (res.success && res.hasAttempts === false) {
        zeroAttemptsCountRef.current += 1;
        // Check 1 (0s): Wait for 4s grace window. Check 2 (after 4s): If still false, set NO_PAYMENT_ATTEMPT
        if (zeroAttemptsCountRef.current >= 2) {
          setModalState('NO_PAYMENT_ATTEMPT');
          isPollingRef.current = false;
          return;
        }
      } else {
        zeroAttemptsCountRef.current = 0;
      }

      setPollCount((prev) => {
        const next = prev + 1;
        if (next >= 7) {
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

    // Grace Window Polling: 0s, 4s, 6s, 8s, 10s, 12s
    runVerificationPoll(); // Immediate 0s Check 1

    const timer1 = setTimeout(() => runVerificationPoll(), 4000); // 4s Grace Window Check 2
    const timer2 = setTimeout(() => runVerificationPoll(), 6000);
    const timer3 = setTimeout(() => runVerificationPoll(), 8000);
    const timer4 = setTimeout(() => runVerificationPoll(), 10000);
    const timer5 = setTimeout(() => runVerificationPoll(), 12000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
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

  // Continue Payment by reusing existing PaymentSession and Razorpay Order ID
  const handleContinuePayment = async () => {
    if (!activeSession?.orderId || isResuming) return;
    setIsResuming(true);

    try {
      const res = await resumePaymentSessionAction(activeSession.orderId);
      if (!res.success || !res.razorpay) {
        alert(res.error || 'Failed to resume payment session.');
        setIsResuming(false);
        return;
      }

      const { loadRazorpaySDKScript } = await import('@/hooks/useRazorpay');
      const loaded = await loadRazorpaySDKScript();
      if (!loaded) {
        alert('Failed to load Razorpay Checkout SDK script.');
        setIsResuming(false);
        return;
      }

      const rzpOptions = {
        key: res.razorpay.key,
        amount: res.razorpay.amount,
        currency: res.razorpay.currency,
        name: 'GODSMOVE',
        description: `Order #${res.order?.orderNumber || activeSession.orderNumber}`,
        order_id: res.razorpay.orderId,
        prefill: {
          email: res.order?.email || '',
        },
        theme: { color: '#0A0A0A' },
        handler: async (response: any) => {
          setModalState('VERIFYING');
          zeroAttemptsCountRef.current = 0;
          runVerificationPoll();
        },
        modal: {
          ondismiss: () => {
            setIsResuming(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Failed to launch payment checkout.');
    } finally {
      setIsResuming(false);
    }
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

        {modalState === 'NO_PAYMENT_ATTEMPT' && (
          <>
            <div className={styles.iconWrapper} style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.1)' }}>
              <RotateCcw size={32} />
            </div>
            <div className={styles.badge} style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.1)' }}>
              Payment Interrupted
            </div>
            <h3 className={styles.title}>Payment Not Started</h3>
            <p className={styles.description}>
              Your payment was interrupted before it reached our payment partner. No payment has been processed. You can safely continue your purchase.
            </p>
            {activeSession.orderNumber && (
              <div className={styles.orderDetails}>
                <span className={styles.orderLabel}>Order Reference</span>
                <span className={styles.orderValue}>#{activeSession.orderNumber}</span>
              </div>
            )}
            <button className={styles.actionButton} onClick={handleContinuePayment} disabled={isResuming}>
              {isResuming ? <Loader2 className={styles.spinner} size={16} /> : <RotateCcw size={16} />}
              Continue Payment
            </button>
            <button className={styles.secondaryButton} onClick={() => { handleDismiss(); router.push('/checkout'); }}>
              Edit Checkout
            </button>
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
