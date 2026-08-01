'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, RefreshCw, ShieldCheck, Clock, CheckCircle2, ShoppingBag, Download, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { getOrderPaymentStatus, confirmOrder, cancelAndRestoreOrder } from '@/actions/order.actions';
import { getCheckoutSessionToken, clearCheckoutSessionToken } from '@/lib/checkout-session';
import { loadRazorpaySDKScript } from '@/hooks/useRazorpay';
import { useStore } from '@/store/useStore';
import styles from './page.module.css';

interface PaymentRecoveryClientProps {
  initialOrderId?: string;
}

export default function PaymentRecoveryClient({ initialOrderId }: PaymentRecoveryClientProps) {
  const router = useRouter();
  const { showToast } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [gatewayState, setGatewayState] = useState<string>('created');
  const [error, setError] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  
  const [pollCount, setPollCount] = useState(0);
  const isRetryingRef = useRef(false);
  const isExpiredHandledRef = useRef(false);

  const resolvePaymentStatus = useCallback(async (orderIdToFetch: string) => {
    setResolving(true);
    setError(null);
    try {
      // Active Gateway Resolution: Razorpay REST API is the Single Source of Truth
      const res = await getOrderPaymentStatus(orderIdToFetch);
      if (!res.success || !res.order) {
        setError(res.error || 'Unable to locate active checkout session.');
        setLoading(false);
        setResolving(false);
        return;
      }

      const fetchedOrder = res.order;
      setOrder(fetchedOrder);
      setGatewayState(res.gatewayState || (fetchedOrder.paymentStatus === 'PAID' ? 'captured' : 'created'));

      if (fetchedOrder.status === 'CONFIRMED' || fetchedOrder.paymentStatus === 'PAID') {
        clearCheckoutSessionToken();
      } else {
        const createdTimeMs = new Date(fetchedOrder.createdAt).getTime();
        const expiresTimeMs = createdTimeMs + 30 * 60 * 1000;
        const remainingMs = expiresTimeMs - Date.now();
        const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
        setTimeLeftSeconds(remainingSec);
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred while resolving payment status.');
      setLoading(false);
    } finally {
      setResolving(false);
    }
  }, []);

  useEffect(() => {
    const targetOrderId = initialOrderId || getCheckoutSessionToken();
    if (!targetOrderId) {
      router.replace('/drops');
      return;
    }

    resolvePaymentStatus(targetOrderId);
  }, [initialOrderId, resolvePaymentStatus, router]);

  // 12-Second Active Polling Effect (Every 2s for max 6 attempts = 12s)
  useEffect(() => {
    if (!order?.id) return;
    if (['created', 'attempted', 'authorized', 'processing', 'pending'].includes(gatewayState) && pollCount < 6) {
      const timer = setInterval(() => {
        setPollCount((prev) => prev + 1);
        resolvePaymentStatus(order.id);
      }, 2000);

      return () => clearInterval(timer);
    }
  }, [order?.id, gatewayState, pollCount, resolvePaymentStatus]);

  // Server-synchronized Reservation Countdown Timer
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  // Auto-Expiration Handler when Timer reaches 00:00
  const handleAutoExpiration = useCallback(async () => {
    if (isExpiredHandledRef.current || !order) return;
    if (order.status === 'CONFIRMED' || order.paymentStatus === 'PAID') return;
    
    isExpiredHandledRef.current = true;
    setIsRestoring(true);

    try {
      const res = await cancelAndRestoreOrder(order.id);
      if (res.success && Array.isArray(res.items)) {
        useStore.setState({ cart: res.items });
      }
      clearCheckoutSessionToken();
      showToast('Reservation Expired', 'Your reservation expired. Your cart has been restored.');
      router.push('/checkout');
    } catch (err) {
      clearCheckoutSessionToken();
      router.push('/checkout');
    }
  }, [order, router, showToast]);

  useEffect(() => {
    if (timeLeftSeconds === 0 && order && !isExpiredHandledRef.current) {
      handleAutoExpiration();
    }
  }, [timeLeftSeconds, order, handleAutoExpiration]);

  // Retry Payment via Smart Order Reuse Strategy
  const handleRetryPayment = async () => {
    if (!order || isRetryingRef.current) return;
    isRetryingRef.current = true;
    setIsRetrying(true);

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total,
          currency: 'INR',
          dbOrderId: order.id
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to initialize payment gateway.');
      }

      const sdkLoaded = await loadRazorpaySDKScript();
      if (!sdkLoaded) {
        throw new Error('Failed to load Razorpay Checkout SDK script.');
      }

      const rzpOptions = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'GODSMOVE',
        description: `Order #${order.orderNumber}`,
        order_id: orderData.orderId,
        prefill: {
          name: order.shippingAddress?.firstName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim() : '',
          email: order.shippingAddress?.email || '',
          contact: order.shippingAddress?.phone || '',
        },
        theme: {
          color: '#0A0A0A',
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const confirmRes = await confirmOrder(
              order.id,
              response.razorpay_payment_id,
              response.razorpay_order_id
            );
            if (!confirmRes.success) {
              throw new Error(confirmRes.error || 'Failed to confirm transaction.');
            }

            clearCheckoutSessionToken();
            setOrder((prev: any) => ({ ...prev, status: 'CONFIRMED', paymentStatus: 'PAID' }));
            setGatewayState('captured');
            showToast('Payment Successful', `Order #${order.orderNumber} confirmed!`);
          } catch (confirmErr: any) {
            showToast('Payment Error', confirmErr.message || 'Failed to confirm transaction.');
            isRetryingRef.current = false;
            setIsRetrying(false);
          }
        },
        modal: {
          ondismiss: () => {
            isRetryingRef.current = false;
            setIsRetrying(false);
            showToast('Payment Window Closed', 'You can retry payment or return to edit your checkout.');
          },
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
    } catch (err: any) {
      showToast('Payment Error', err.message || 'Failed to re-open payment window.');
      isRetryingRef.current = false;
      setIsRetrying(false);
    }
  };

  // Full Return to Checkout with Complete Cart & Session Restoration
  const handleReturnToCheckout = async () => {
    if (!order) {
      router.push('/checkout');
      return;
    }
    setIsRestoring(true);

    try {
      const res = await cancelAndRestoreOrder(order.id);
      if (res.success && Array.isArray(res.items)) {
        useStore.setState({ cart: res.items });
      }
      clearCheckoutSessionToken();
      showToast('Cart Restored', 'Your items have been restored to your checkout.');
      router.push('/checkout');
    } catch (err) {
      clearCheckoutSessionToken();
      router.push('/checkout');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatTimer = (seconds: number | null) => {
    if (seconds === null) return '30:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ── STATE 1: PAYMENT PROCESSING / VERIFYING AMBIENT LOADER ────────────────────
  if (loading || resolving) {
    return (
      <div className={styles.container}>
        <div className={styles.brandHeader}>
          <span className={styles.brandTitle}>GODSMOVE</span>
        </div>
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <h2 className={styles.loadingTitle}>Verifying Your Payment...</h2>
          <p className={styles.loadingSub}>Please wait while we confirm your payment securely with our banking partner.</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.container}>
        <div className={styles.brandHeader}>
          <span className={styles.brandTitle}>GODSMOVE</span>
        </div>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Checkout Updated</h1>
            <p className={styles.description}>
              {error || 'No active checkout session found.'}
            </p>
          </div>
          <div className={styles.actionGroup}>
            <button
              onClick={() => router.push('/drops')}
              className={`btn btn-primary ${styles.retryBtn}`}
            >
              Explore Drops
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STATE 2: LUXURY PURCHASE SUCCESS EXPERIENCE (RAZORPAY CAPTURED / PAID) ─────
  if (order.status === 'CONFIRMED' || order.paymentStatus === 'PAID' || gatewayState === 'captured') {
    return (
      <div className={styles.container}>
        <div className={styles.brandHeader}>
          <span className={styles.brandTitle}>GODSMOVE</span>
          <div className={styles.brandBadge} style={{ color: '#c8a46a' }}>
            <CheckCircle2 size={12} style={{ marginRight: 6 }} />
            Payment Confirmed
          </div>
        </div>

        <div className={styles.card} style={{ borderColor: 'rgba(200, 164, 106, 0.4)' }}>
          <div className={styles.header}>
            <div className={styles.statusBadge} style={{ background: 'rgba(200, 164, 106, 0.15)', borderColor: '#c8a46a' }}>
              <CheckCircle2 size={14} style={{ marginRight: 6, color: '#c8a46a' }} />
              ORDER CONFIRMED
            </div>
            <h1 className={styles.title} style={{ fontSize: '22px', letterSpacing: '0.12em' }}>Welcome to the Archive</h1>
            <p className={styles.description}>
              Your allocation for Order <strong style={{ color: '#ffffff' }}>#{order.orderNumber}</strong> has been secured. Your tax invoice has been generated and dispatched to your email.
            </p>
          </div>

          <div className={styles.orderSummaryBox}>
            <div className={styles.summaryHeader}>
              <span>Order Summary</span>
              <span>Total Paid: ₹{order.total.toLocaleString('en-IN')}</span>
            </div>

            <div className={styles.itemList}>
              {order.items.map((item: any) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemThumb}>
                    {item.image ? (
                      <Image src={item.image} alt={item.productName} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className={styles.thumbPlaceholder} />
                    )}
                  </div>
                  <div className={styles.itemMeta}>
                    <div className={styles.itemName}>{item.productName}</div>
                    <div className={styles.itemDetails}>
                      Size: {item.size} {item.color ? `| ${item.color}` : ''} | Qty: {item.quantity}
                    </div>
                  </div>
                  <div className={styles.itemPrice}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actionGroup}>
            <button
              onClick={() => router.push('/profile')}
              className={`btn btn-primary ${styles.retryBtn}`}
            >
              <Package size={14} style={{ marginRight: 8 }} />
              View My Collection
            </button>

            <button
              onClick={() => router.push('/drops')}
              className={styles.secondaryBtn}
            >
              <ShoppingBag size={14} style={{ marginRight: 8 }} />
              Explore Drops
            </button>

            <button
              onClick={() => router.push('/')}
              className={styles.secondaryBtn}
            >
              Continue Shopping
            </button>
          </div>

          <div className={styles.securityFooter}>
            <ShieldCheck size={11} style={{ marginRight: 6 }} />
            <span>GODSMOVE ARCHIVAL COLLECTION • ALL RIGHTS RESERVED</span>
          </div>
        </div>
      </div>
    );
  }

  // ── STATE 3 (RECOVERY): TEMPORARY UI RECOVERY MODAL FOR PENDING RAZORPAY VERIFICATION ──
  if (gatewayState === 'authorized' || gatewayState === 'processing' || gatewayState === 'pending') {
    const isStillPolling = pollCount < 6;
    return (
      <div className={styles.container}>
        <div className={styles.brandHeader}>
          <span className={styles.brandTitle}>GODSMOVE</span>
          <div className={styles.brandBadge} style={{ color: '#c8a46a' }}>
            <AlertCircle size={12} style={{ marginRight: 6 }} />
            Payment Verification
          </div>
        </div>

        <div className={styles.card} style={{ borderColor: 'rgba(200, 164, 106, 0.3)' }}>
          <div className={styles.header}>
            <div className={styles.statusBadge} style={{ background: 'rgba(200, 164, 106, 0.12)', color: '#c8a46a' }}>
              <Clock size={13} style={{ marginRight: 6 }} />
              {isStillPolling ? 'VERIFYING PAYMENT' : 'VERIFICATION IN PROGRESS'}
            </div>
            <h1 className={styles.title} style={{ fontSize: '20px' }}>
              {isStillPolling ? 'Verifying your payment' : "We're still confirming your payment"}
            </h1>
            <p className={styles.description} style={{ marginBottom: '16px', lineHeight: 1.7 }}>
              {isStillPolling
                ? "We're securely confirming your payment with our banking partner. Please don't make another payment. This usually takes a few seconds."
                : "If your bank has debited the amount, your order will update automatically. You'll receive an email as soon as verification completes."}
            </p>
          </div>

          <div className={styles.actionGroup}>
            <button
              onClick={() => router.push('/drops')}
              className={`btn btn-primary ${styles.retryBtn}`}
            >
              Continue Browsing
            </button>

            <button
              onClick={() => router.push('/profile?tab=collection')}
              className={styles.secondaryBtn}
            >
              <Package size={14} style={{ marginRight: 8 }} />
              View Orders
            </button>
          </div>

          <div className={styles.securityFooter}>
            <ShieldCheck size={11} style={{ marginRight: 6 }} />
            <span>Encrypted Out-of-Band Verification Active</span>
          </div>
        </div>
      </div>
    );
  }

  // ── STATE 3: RETRY PAYMENT / FAILED VIEW (RAZORPAY FAILED / CREATED) ──────────
  return (
    <div className={styles.container}>
      <div className={styles.brandHeader}>
        <span className={styles.brandTitle}>GODSMOVE</span>
        <div className={styles.brandBadge}>
          <ShieldCheck size={12} style={{ marginRight: 6 }} />
          Encrypted Checkout
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.timerBox}>
          <div className={styles.timerLabel}>
            <Clock size={13} style={{ marginRight: 6 }} />
            RESERVED FOR
          </div>
          <div className={styles.timerDigits}>{formatTimer(timeLeftSeconds)}</div>
          <div className={styles.timerSub}>Minutes : Seconds</div>
        </div>

        <div className={styles.header}>
          <div className={styles.statusBadge}>
            <AlertCircle size={13} style={{ marginRight: 6 }} />
            Payment Uncompleted
          </div>
          <h1 className={styles.title}>Payment Wasn't Completed</h1>
          <p className={styles.description}>
            No money has been captured for <strong style={{ color: '#fff' }}>#{order.orderNumber}</strong>. You can retry payment below or edit your checkout items.
          </p>
        </div>

        <div className={styles.orderSummaryBox}>
          <div className={styles.summaryHeader}>
            <span>Reserved Allocation</span>
            <span>Total: ₹{order.total.toLocaleString('en-IN')}</span>
          </div>

          <div className={styles.itemList}>
            {order.items.map((item: any) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemThumb}>
                  {item.image ? (
                    <Image src={item.image} alt={item.productName} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className={styles.thumbPlaceholder} />
                  )}
                </div>
                <div className={styles.itemMeta}>
                  <div className={styles.itemName}>{item.productName}</div>
                  <div className={styles.itemDetails}>
                    Size: {item.size} {item.color ? `| ${item.color}` : ''} | Qty: {item.quantity}
                  </div>
                </div>
                <div className={styles.itemPrice}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {order.shippingAddress && (
            <div className={styles.addressBox}>
              <div className={styles.addressLabel}>Shipping Destination</div>
              <div className={styles.addressText}>
                {order.shippingAddress.firstName} {order.shippingAddress.lastName} — {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </div>
            </div>
          )}
        </div>

        <div className={styles.actionGroup}>
          <button
            onClick={handleRetryPayment}
            disabled={isRetrying || isRestoring}
            className={`btn btn-primary ${styles.retryBtn}`}
          >
            {isRetrying ? (
              <>
                <RefreshCw size={14} className={styles.spinIcon} style={{ marginRight: 8 }} />
                Launching Gateway...
              </>
            ) : (
              <>
                <Lock size={14} style={{ marginRight: 8 }} />
                Complete Your Purchase (₹{order.total.toLocaleString('en-IN')})
              </>
            )}
          </button>

          <button
            onClick={handleReturnToCheckout}
            disabled={isRetrying || isRestoring}
            className={styles.secondaryBtn}
          >
            {isRestoring ? 'Restoring Cart...' : '← Edit Checkout'}
          </button>
        </div>

        <div className={styles.securityFooter}>
          <Lock size={11} style={{ marginRight: 6 }} />
          <span>Secured by Razorpay • 256-Bit SSL Encryption</span>
        </div>
      </div>
    </div>
  );
}
