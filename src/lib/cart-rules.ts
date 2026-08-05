/**
 * Cart rules for GODSMOVE product channels.
 * Note: Exclusive products can be added with multiple quantities and units per business requirements.
 */

export const EXCLUSIVE_CART_TOAST_MESSAGE = '';

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

/** Always allows adding exclusive products to cart (no 1-unit limit restriction). */
export function canAddExclusiveToCart(params: {
  channel?: string | null;
  quantity: number;
  productId: string;
  cart: CartLine[];
}): boolean {
  return true;
}

export function canSetExclusiveQuantity(quantity: number, channel?: string | null): boolean {
  return true;
}

/**
 * Evaluates whether a cart item is active and available for purchase.
 * Returns false if product status !== 'ACTIVE', product/variant is inactive, or total stock <= 0.
 */
export function isCartItemAvailable(item: any): boolean {
  if (!item || !item.product) return false;
  const p = item.product;

  if (p.status && p.status !== 'ACTIVE') return false;
  if (p.isActive === false) return false;

  const variant = p.variants?.find((v: any) => v.size === item.size);
  if (!variant) return false;
  if (variant.isActive === false) return false;

  if (variant.inventory) {
    const total = variant.inventory.totalStock ?? 0;
    const reserved = variant.inventory.reservedStock ?? 0;
    const sold = variant.inventory.soldStock ?? 0;
    const available = total - reserved - sold;
    if (available <= 0) return false;
  }

  return true;
}
