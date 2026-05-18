/**
 * Cart rules for GODSMOVE product channels.
 * EXCLUSIVE_UNLOCK and EXCLUSIVE_RACK: max 1 unit per product per order/cart.
 */

export const EXCLUSIVE_CART_TOAST_MESSAGE =
  'Only one piece can be bought from exclusive products.';

export function isExclusiveChannel(
  channel?: string | null
): channel is 'EXCLUSIVE_UNLOCK' | 'EXCLUSIVE_RACK' {
  return channel === 'EXCLUSIVE_UNLOCK' || channel === 'EXCLUSIVE_RACK';
}

type CartLine = {
  product: { id: string; channel?: string | null };
  size: string;
  quantity: number;
};

export function cartHasExclusiveProduct(cart: CartLine[], productId: string): boolean {
  return cart.some((item) => item.product.id === productId);
}

/** Returns false when the action must be blocked for exclusive products. */
export function canAddExclusiveToCart(params: {
  channel?: string | null;
  quantity: number;
  productId: string;
  cart: CartLine[];
}): boolean {
  if (!isExclusiveChannel(params.channel)) return true;
  if (params.quantity > 1) return false;
  if (cartHasExclusiveProduct(params.cart, params.productId)) return false;
  return true;
}

export function canSetExclusiveQuantity(quantity: number, channel?: string | null): boolean {
  if (!isExclusiveChannel(channel)) return true;
  return quantity <= 1;
}
