/**
 * GODSMOVE — Payment Capability Layer
 * Single source of truth for payment method capabilities.
 *
 * Why this exists:
 *   Components must NOT hardcode paymentMethod === 'RAZORPAY' or === 'COD'.
 *   Instead they consume these helpers. Adding a new payment method (Stripe,
 *   PhonePe, Apple Pay) only requires updating the sets below — no component
 *   logic changes.
 *
 * Rules:
 *   - Every UI decision about payment behaviour MUST use these helpers.
 *   - No component may implement its own payment-method string comparisons.
 */

/** Payment methods that support real-time gateway verification and recovery. */
export const RECOVERABLE_PAYMENT_METHODS = new Set(['RAZORPAY', 'MIXED']);

/**
 * Payment methods where money is collected upfront from the customer
 * through a digital gateway (not on delivery).
 */
export const PREPAID_PAYMENT_METHODS = new Set(['RAZORPAY', 'WALLET', 'MIXED']);

/**
 * Payment methods where cash is collected physically on delivery.
 * No gateway session, no verification, no recovery flow applies.
 */
export const CASH_ON_DELIVERY_METHODS = new Set(['COD']);

// ─── Order-level capability helpers ───────────────────────────────────────────

type OrderLike = { paymentMethod?: string | null };

/**
 * True when the order uses a digital gateway that supports:
 *   • Payment Recovery Modal
 *   • Adaptive gateway verification / polling
 *   • Continue Payment (resume session)
 *   • Browser-refresh / browser-crash recovery
 */
export function supportsPaymentRecovery(order: OrderLike): boolean {
  return RECOVERABLE_PAYMENT_METHODS.has(order.paymentMethod ?? '');
}

/**
 * True when the order is a Cash on Delivery order.
 * COD orders have their own completely independent fulfilment lifecycle.
 */
export function isCODOrder(order: OrderLike): boolean {
  return CASH_ON_DELIVERY_METHODS.has(order.paymentMethod ?? '');
}

/**
 * True when money is collected upfront through a digital gateway.
 * False for COD where money is collected at the door.
 */
export function isPrepaidOrder(order: OrderLike): boolean {
  return PREPAID_PAYMENT_METHODS.has(order.paymentMethod ?? '');
}

/**
 * True when the "Continue Payment" CTA should be rendered.
 * Requires: recoverable payment method AND order is currently unpaid/pending.
 */
export function supportsContinuePayment(
  order: OrderLike & { paymentStatus?: string | null; status?: string | null }
): boolean {
  if (!supportsPaymentRecovery(order)) return false;
  const UNPAID_STATUSES = ['PENDING', 'VERIFYING', 'AWAITING_PAYMENT'];
  return (
    order.paymentStatus === 'UNPAID' &&
    UNPAID_STATUSES.includes(order.status ?? '')
  );
}

/**
 * True when the "Track Order" CTA should be rendered.
 *
 * COD:      Track Order appears from CONFIRMED onward (payment is always UNPAID
 *           until cash is physically collected — this is correct expected behaviour).
 * Prepaid:  Track Order appears only after paymentStatus === 'PAID'.
 */
export function supportsTrackOrder(
  order: OrderLike & { paymentStatus?: string | null; status?: string | null }
): boolean {
  const ACTIVE_FULFILMENT = [
    'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
  ];
  const isInFulfilment = ACTIVE_FULFILMENT.includes(order.status ?? '');

  if (isCODOrder(order)) {
    // COD: any active fulfilment status qualifies for Track Order.
    // Payment intentionally stays UNPAID until physically collected.
    return isInFulfilment;
  }

  // Prepaid: must be PAID AND in active fulfilment
  return order.paymentStatus === 'PAID' && isInFulfilment;
}
