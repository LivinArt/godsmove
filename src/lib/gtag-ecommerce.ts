/**
 * GA4 Enhanced Ecommerce Event Utility for GODSMOVE
 * Implements GA4 recommended ecommerce schema:
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

export interface GA4Item {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity?: number;
  index?: number;
  item_list_id?: string;
  item_list_name?: string;
}

export interface GA4EcommerceParams {
  currency?: string;
  value?: number;
  items?: GA4Item[];
  coupon?: string;
  shipping?: number;
  tax?: number;
  transaction_id?: string;
  shipping_tier?: string;
  payment_type?: string;
  item_list_id?: string;
  item_list_name?: string;
  [key: string]: any;
}

const DEFAULT_CURRENCY = 'INR';
const DEFAULT_BRAND = 'GODSMOVE';

/**
 * Core helper to safely dispatch GA4 events to window.gtag
 */
export function sendGA4Event(eventName: string, params?: GA4EcommerceParams) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  const payload: Record<string, any> = {
    currency: DEFAULT_CURRENCY,
    ...params,
  };

  if (Array.isArray(payload.items)) {
    payload.items = payload.items.map((item, idx) => ({
      item_id: String(item.item_id || ''),
      item_name: String(item.item_name || 'Product'),
      item_brand: item.item_brand || DEFAULT_BRAND,
      item_category: item.item_category || 'Streetwear',
      item_variant: item.item_variant || '',
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      ...(item.index !== undefined ? { index: item.index } : { index: idx }),
    }));
  }

  window.gtag('event', eventName, payload);
}

/**
 * Formats live product / cart data into standard GA4Item structure
 */
export function formatGA4Item(product: any, size?: string, quantity = 1, index?: number): GA4Item {
  const baseVariant = product?.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : Number(product?.price || 0);
  const categoryName = product?.category?.name || product?.collectionName || 'Streetwear';
  const variantLabel = size || baseVariant?.size || baseVariant?.color || 'Standard';

  return {
    item_id: String(product?.id || product?.productId || product?.slug || ''),
    item_name: String(product?.name || 'GODSMOVE Product'),
    item_brand: DEFAULT_BRAND,
    item_category: categoryName,
    item_variant: variantLabel,
    price,
    quantity,
    ...(index !== undefined ? { index } : {}),
  };
}

// 1. view_item_list
export function trackViewItemList(items: GA4Item[], listName = 'Product List', listId = 'product_list') {
  sendGA4Event('view_item_list', {
    item_list_id: listId,
    item_list_name: listName,
    items,
  });
}

// 2. select_item
export function trackSelectItem(item: GA4Item, listName = 'Product List', listId = 'product_list') {
  sendGA4Event('select_item', {
    item_list_id: listId,
    item_list_name: listName,
    items: [item],
  });
}

// 3. view_item
export function trackViewItem(item: GA4Item) {
  sendGA4Event('view_item', {
    value: item.price,
    items: [item],
  });
}

// 4. add_to_cart
export function trackAddToCart(item: GA4Item, value?: number) {
  const totalValue = value ?? (item.price * (item.quantity || 1));
  sendGA4Event('add_to_cart', {
    value: totalValue,
    items: [item],
  });
}

// 5. remove_from_cart
export function trackRemoveFromCart(item: GA4Item, value?: number) {
  const totalValue = value ?? (item.price * (item.quantity || 1));
  sendGA4Event('remove_from_cart', {
    value: totalValue,
    items: [item],
  });
}

// 6. view_cart
export function trackViewCart(items: GA4Item[], value: number) {
  sendGA4Event('view_cart', {
    value,
    items,
  });
}

// 7. begin_checkout
export function trackBeginCheckout(items: GA4Item[], value: number, coupon?: string) {
  sendGA4Event('begin_checkout', {
    value,
    items,
    ...(coupon ? { coupon } : {}),
  });
}

// 8. add_shipping_info
export function trackAddShippingInfo(items: GA4Item[], value: number, shippingTier = 'Standard Ground') {
  sendGA4Event('add_shipping_info', {
    value,
    shipping_tier: shippingTier,
    items,
  });
}

// 9. add_payment_info
export function trackAddPaymentInfo(items: GA4Item[], value: number, paymentType = 'Razorpay / UPI / Cards') {
  sendGA4Event('add_payment_info', {
    value,
    payment_type: paymentType,
    items,
  });
}

// 10. purchase
export function trackPurchase(transactionId: string, value: number, items: GA4Item[], shipping = 0, tax = 0, coupon?: string) {
  sendGA4Event('purchase', {
    transaction_id: transactionId,
    value,
    tax,
    shipping,
    items,
    ...(coupon ? { coupon } : {}),
  });
}

// 11. refund
export function trackRefund(transactionId: string, value?: number, items?: GA4Item[]) {
  sendGA4Event('refund', {
    transaction_id: transactionId,
    ...(value !== undefined ? { value } : {}),
    ...(items ? { items } : {}),
  });
}
