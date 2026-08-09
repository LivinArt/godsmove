import {
  LaunchState,
  PurchaseMode,
  ExpectedDispatch,
  PreBookingOfferType,
  CountdownState,
} from '@/types/launch';

export enum PreBookingLifecycleState {
  AWAITING_LAUNCH = 'AWAITING_LAUNCH',
  RELEASED = 'RELEASED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

/**
 * Authoritative Pre-Booking Order Lifecycle State Evaluator.
 * Determines the current presentation/fulfillment lifecycle phase of a pre-booking order.
 */
export function getPreBookingLifecycleState(order: any): PreBookingLifecycleState {
  if (!order) return PreBookingLifecycleState.AWAITING_LAUNCH;

  // 1. Payment Failure / Cancellation assertion
  const isFailed = ['FAILED', 'CANCELLED'].includes(order.status) || order.paymentStatus === 'FAILED';
  if (isFailed) {
    return PreBookingLifecycleState.PAYMENT_FAILED;
  }

  // 2. Fulfillment Status assertions
  const orderStatus = String(order.status || '').toUpperCase();
  const fulfillmentStatus = String(order.fulfillmentStatus || '').toUpperCase();

  if (['DELIVERED', 'COMPLETED'].includes(orderStatus) || fulfillmentStatus === 'DELIVERED') {
    return PreBookingLifecycleState.DELIVERED;
  }

  if (['SHIPPED', 'OUT_FOR_DELIVERY'].includes(orderStatus) || fulfillmentStatus === 'SHIPPED') {
    return PreBookingLifecycleState.SHIPPED;
  }

  // 3. Product Merchandising & Launch Date assertions
  const firstItem = order.items?.[0];
  const product = firstItem?.variant?.product || firstItem?.product;

  // If Admin has unticked "Open Pre Booking" (isPreBooking === false)
  const isPreBookingClosedByAdmin = Boolean(product && product.isPreBooking === false);

  // If launch date/time has passed
  const launchDate = order.preBookingLaunchDate || product?.launchDateTime;
  const isLaunchTimePassed = launchDate ? new Date() >= new Date(launchDate) : false;

  // If order processing/fulfillment has commenced
  const isFulfillmentStarted = ['PROCESSING', 'PACKED'].includes(orderStatus) || (fulfillmentStatus && fulfillmentStatus !== 'UNFULFILLED');

  if (isPreBookingClosedByAdmin || isLaunchTimePassed || isFulfillmentStarted) {
    return PreBookingLifecycleState.RELEASED;
  }

  return PreBookingLifecycleState.AWAITING_LAUNCH;
}

/**
 * Evaluates the current lifecycle state of a product.
 * Centralized source of truth for storefront, admin, checkout, and profile.
 */
export function getProductLaunchState(product: any): LaunchState {
  if (!product) return LaunchState.DRAFT;

  const status = String(product.status || '').toUpperCase();
  if (status === 'DRAFT') return LaunchState.DRAFT;
  if (status === 'ARCHIVED') return LaunchState.ARCHIVED;

  // Evaluate total stock across variants
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const totalStockSum = variants.reduce((sum: number, v: any) => {
    const inv = v.inventory;
    return sum + (inv ? Math.max(0, inv.totalStock - inv.soldStock) : 0);
  }, 0);

  const isPreBookingEnabled = Boolean(product.isPreBooking);

  if (isPreBookingEnabled) {
    const now = new Date();
    const launchTime = product.launchDateTime ? new Date(product.launchDateTime) : null;
    const openTime = product.preBookingOpenDateTime ? new Date(product.preBookingOpenDateTime) : null;

    // Check if pre-booking opening window has arrived (or is open immediately)
    const isOpeningValid = !openTime || now >= openTime;

    // Pre-booking is active before official launch date/time
    if (launchTime && now < launchTime && isOpeningValid) {
      const maxLimit = product.maxPreBooking != null ? Number(product.maxPreBooking) : null;
      const currentBooked = Number(product.currentPreBookings || 0);

      if (maxLimit != null && maxLimit > 0 && currentBooked >= maxLimit) {
        return LaunchState.SOLD_OUT;
      }
      return LaunchState.PRE_BOOKING;
    }
  }

  if (totalStockSum <= 0 && status === 'SOLD_OUT') {
    return LaunchState.SOLD_OUT;
  }

  return LaunchState.LIVE;
}

/**
 * Determines how a product can currently be purchased.
 * Consumed by all storefront CTAs (BUY NOW, PRE BOOK NOW, SOLD OUT, COMING SOON).
 */
export function getPurchaseMode(product: any): PurchaseMode {
  const state = getProductLaunchState(product);

  switch (state) {
    case LaunchState.PRE_BOOKING:
      return PurchaseMode.PRE_BOOK;
    case LaunchState.LIVE:
      return PurchaseMode.BUY_NOW;
    case LaunchState.SOLD_OUT:
      return PurchaseMode.SOLD_OUT;
    case LaunchState.DRAFT:
    case LaunchState.ARCHIVED:
    default:
      return PurchaseMode.COMING_SOON;
  }
}

/**
 * Alias for getPurchaseMode for backward compatibility.
 */
export function getEffectivePurchaseMode(product: any): PurchaseMode {
  return getPurchaseMode(product);
}

/**
 * Calculates effective pre-booking promotional price, savings, and display text.
 */
export function getPreBookingOfferDetails(product: any, variantBasePrice: number) {
  if (!product || !product.isPreBooking || !product.hasPreBookingOffer) {
    return {
      isOfferActive: false,
      effectivePrice: variantBasePrice,
      originalPrice: variantBasePrice,
      savingsAmount: 0,
      savingsBadgeText: null,
    };
  }

  const offerType = String(product.preBookingOfferType || 'PERCENTAGE').toUpperCase();
  const offerVal = Number(product.preBookingOfferValue || 0);

  if (offerVal <= 0) {
    return {
      isOfferActive: false,
      effectivePrice: variantBasePrice,
      originalPrice: variantBasePrice,
      savingsAmount: 0,
      savingsBadgeText: null,
    };
  }

  let savingsAmount = 0;

  if (offerType === PreBookingOfferType.PERCENTAGE) {
    savingsAmount = Math.round((variantBasePrice * offerVal) / 100);
  } else {
    savingsAmount = Math.round(offerVal);
  }

  // Ensure savings don't exceed base price
  savingsAmount = Math.min(savingsAmount, variantBasePrice);
  const effectivePrice = Math.max(0, variantBasePrice - savingsAmount);

  const badgeText = offerType === PreBookingOfferType.PERCENTAGE
    ? `${offerVal}% PRE-BOOK DISCOUNT`
    : `₹${offerVal} PRE-BOOK DISCOUNT`;

  return {
    isOfferActive: true,
    effectivePrice,
    originalPrice: variantBasePrice,
    savingsAmount,
    savingsBadgeText: badgeText,
  };
}

/**
 * Calculates remaining countdown time until pre-booking launch date.
 */
export function getPreBookingCountdown(launchDateTime: string | Date | null | undefined): CountdownState {
  if (!launchDateTime) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isCompleted: true,
      totalSecondsRemaining: 0,
    };
  }

  const target = new Date(launchDateTime).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isCompleted: true,
      totalSecondsRemaining: 0,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isCompleted: false,
    totalSecondsRemaining: totalSeconds,
  };
}

/**
 * Human-readable expected dispatch text formatter.
 */
export function formatExpectedDispatchText(expectedDispatchKey?: string | null, customText?: string | null): string {
  if (!expectedDispatchKey) return 'Immediately After Launch';

  const key = String(expectedDispatchKey).toUpperCase();

  switch (key) {
    case ExpectedDispatch.IMMEDIATELY:
      return 'Immediately After Launch';
    case ExpectedDispatch.WITHIN_24H:
      return 'Within 24 Hours of Launch';
    case ExpectedDispatch.WITHIN_3D:
      return 'Within 3 Days of Launch';
    case ExpectedDispatch.WITHIN_7D:
      return 'Within 7 Days of Launch';
    case ExpectedDispatch.CUSTOM:
      return customText && customText.trim() !== '' ? customText.trim() : 'Custom Dispatch Window';
    default:
      return expectedDispatchKey;
  }
}
