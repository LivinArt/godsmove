'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';

export interface UseCommerceActionsOptions {
  product: any;
  selectedSize?: string | null;
  quantity?: number;
  onRequireSize?: () => void;
  onSuccessMessage?: (msg: string) => void;
}

export function useCommerceActions({
  product,
  selectedSize = 'M',
  quantity = 1,
  onRequireSize,
  onSuccessMessage,
}: UseCommerceActionsOptions) {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const { 
    addToCart, 
    beginInstantCheckout,
    toggleWishlist, 
    isInWishlist, 
    toggleCompare, 
    isInCompare 
  } = useStore();

  const isWishlisted = isInWishlist(product?.id);
  const isCompared = isInCompare(product?.id);

  // 1. BUY NOW — Explicit INSTANT pipeline (bypasses shopping cart entirely)
  const handleBuyNow = () => {
    if (!selectedSize) {
      if (onRequireSize) onRequireSize();
      return;
    }
    requireAuth(
      'checkout',
      () => {
        beginInstantCheckout({ product, size: selectedSize, quantity });
        router.push('/checkout');
      },
      { type: 'checkout', product, size: selectedSize, quantity, returnUrl: '/checkout' }
    );
  };

  // 2. QUICK ADD / CART — Guest Allowed (No Login Required)
  const handleAddToCart = () => {
    if (!selectedSize) {
      if (onRequireSize) onRequireSize();
      return;
    }
    addToCart(product, selectedSize, quantity);
    if (onSuccessMessage) {
      onSuccessMessage('Added to Bag');
    }
  };

  // 3. WISHLIST — Toggle Wishlist
  const handleWishlist = () => {
    requireAuth(
      'wishlist',
      () => {
        const currentlyWishlisted = isInWishlist(product.id);
        toggleWishlist(product);
        if (onSuccessMessage) {
          onSuccessMessage(currentlyWishlisted ? 'Removed from Wishlist' : 'Moved to your Wishlist');
        }
      },
      { type: 'wishlist', product }
    );
  };

  // 4. COMPARE — Public (No Auth Required)
  const handleCompare = () => {
    const currentlyInCompare = isInCompare(product.id);
    toggleCompare(product);
    if (onSuccessMessage) {
      onSuccessMessage(currentlyInCompare ? 'Removed from Compare' : 'Added to Compare');
    }
  };

  return {
    handleBuyNow,
    handleAddToCart,
    handleWishlist,
    handleCompare,
    isWishlisted,
    isCompared,
  };
}
