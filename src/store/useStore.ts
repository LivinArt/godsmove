'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  canAddExclusiveToCart,
  canSetExclusiveQuantity,
  cartHasExclusiveProduct,
  EXCLUSIVE_CART_TOAST_MESSAGE,
  isExclusiveChannel,
  isCartItemAvailable,
} from '@/lib/cart-rules';
import { formatGA4Item, trackAddToCart, trackRemoveFromCart } from '@/lib/gtag-ecommerce';
import { refreshCartProducts } from '@/actions/product.actions';
import { isPreBookingActive } from '@/lib/launch-engine-core';

export interface CartItem {
  product: any; // Prisma Product with images and variants
  size: string;
  color?: string;
  quantity: number;
}

/**
 * Explicit checkout pipeline mode.
 * INSTANT = Buy Now flow — single product, bypasses cart.
 * CART    = Cart checkout flow — reads shopping cart, ignores instant session.
 */
export type CheckoutMode = 'CART' | 'INSTANT';

/**
 * Ephemeral session created atomically on every Buy Now click.
 * Retained as a full product snapshot for this release.
 * TECH DEBT: Future architecture iteration should store only
 * { productId, variantId, size, quantity } and resolve live
 * product data from the catalogue at checkout render time.
 */
export interface InstantCheckoutSession {
  sessionId: string;     // crypto.randomUUID() — unique per click
  product: any;          // Deep copy of product with variants
  size: string;
  color?: string;
  quantity: number;
  orderType?: string;    // 'REGULAR' | 'PRE_BOOKING'
  createdAt: number;     // Date.now()
}

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  tagline?: string | null;
  shortDesc?: string | null;
  images: string[];
  price: number;
  comparePrice?: number | null;
  defaultVariantId?: string;
  addedAt: string;
};

interface StoreState {
  // Cart
  cart: CartItem[];
  addToCart: (product: any, size: string, quantity?: number, color?: string) => void;
  removeFromCart: (productId: string, size: string, color?: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number, color?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  cleanCartUnavailableItems: () => number;
  syncCartWithCatalogue: (productMap: Record<string, any>) => void;
  syncCartLive: () => Promise<void>;

  // Checkout Pipeline — explicit mode, no implicit fallback
  checkoutMode: CheckoutMode | null;
  instantCheckoutSession: InstantCheckoutSession | null;
  /**
   * Buy Now: atomically writes INSTANT mode + fresh session in one set() call.
   * Always overwrites any previous session. No pre-clear required.
   */
  beginInstantCheckout: (params: { product: any; size: string; quantity: number; color?: string; orderType?: string }) => void;
  /**
   * Cart Checkout: atomically sets CART mode and clears any instant session.
   */
  beginCartCheckout: () => void;
  /**
   * Resets both checkoutMode and instantCheckoutSession to null.
   * Called on: successful order, checkout unmount, back navigation.
   */
  clearCheckoutSession: () => void;

  // Wishlist
  wishlist: WishlistItem[];
  toggleWishlist: (product: Partial<WishlistItem> | any) => void;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  setWishlist: (items: WishlistItem[]) => void;

  // Toast
  toast: { title: string; message: string; isOpen: boolean } | null;
  showToast: (title: string, message: string) => void;
  showExclusiveCartToast: () => void;
  hideToast: () => void;

  // UI State
  isCartOpen: boolean;
  cartOpenSource: 'quickAdd' | 'manual';
  setCartOpen: (open: boolean, source?: 'quickAdd' | 'manual') => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isNewsletterOpen: boolean;
  setNewsletterOpen: (open: boolean) => void;

  // Compare System
  compare: any[];
  toggleCompare: (product: any) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Cart
      cart: [],

      addToCart: (product, size, quantity = 1, color?: string) => {
        if (isPreBookingActive(product)) {
          get().showToast('Pre-Booking Product', 'Pre-booking products cannot be added to the bag. Click PRE-BOOK NOW for direct checkout.');
          return;
        }
        const { cart } = get();

        const existing = cart.find(
          (item) => item.product.id === product.id && item.size === size && (color ? item.color === color : true)
        );

        if (existing) {
          set({
            cart: cart.map((item) =>
              item.product.id === product.id && item.size === size && (color ? item.color === color : true)
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { product, size, color, quantity }] });
        }

        set({ isCartOpen: true, cartOpenSource: 'quickAdd' });

        try {
          const gaItem = formatGA4Item(product, size, quantity);
          trackAddToCart(gaItem);
        } catch (err) {
          console.error('GA4 addToCart tracking error:', err);
        }
      },

      removeFromCart: (productId, size, color?: string) => {
        const itemToRemove = get().cart.find(
          (item) => item.product?.id === productId && item.size === size && (color ? item.color === color : true)
        );

        if (itemToRemove?.product) {
          try {
            const gaItem = formatGA4Item(itemToRemove.product, itemToRemove.size, itemToRemove.quantity);
            trackRemoveFromCart(gaItem);
          } catch (err) {
            console.error('GA4 removeFromCart tracking error:', err);
          }
        }

        set({
          cart: get().cart.filter(
            (item) => !(item.product.id === productId && item.size === size && (color ? item.color === color : true))
          ),
        });
      },

      updateQuantity: (productId, size, quantity, color?: string) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, size, color);
          return;
        }

        const { cart } = get();
        const item = cart.find(i => i.product.id === productId && i.size === size && (color ? i.color === color : true));
        
        if (item?.product && !canSetExclusiveQuantity(quantity, item.product.channel)) {
          get().showExclusiveCartToast();
          return;
        }

        set({
          cart: get().cart.map((item) =>
            item.product.id === productId && item.size === size
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        return get().cart.reduce((total, item) => {
          const variant = item.product.variants?.find((v: any) => v.size === item.size);
          const price = variant?.price ? Number(variant.price) : 0;
          return total + price * item.quantity;
        }, 0);
      },

      getCartCount: () => {
        return get().cart.reduce((count, item) => count + item.quantity, 0);
      },

      cleanCartUnavailableItems: () => {
        const currentCart = get().cart;
        const validCart = currentCart.filter((item) => isCartItemAvailable(item));
        const removedCount = currentCart.length - validCart.length;
        if (removedCount > 0) {
          set({ cart: validCart });
        }
        return removedCount;
      },

      syncCartWithCatalogue: (productMap: Record<string, any>) => {
        const currentCart = get().cart;
        if (!currentCart || currentCart.length === 0) return;

        const updatedCart = currentCart.map((item) => {
          const liveProduct = productMap[item.product?.id];
          if (!liveProduct) {
            // Product was deleted from database or archived/not returned
            return {
              ...item,
              product: {
                ...item.product,
                status: 'ARCHIVED',
                isActive: false,
              },
            };
          }
          // Product exists live in DB, update with live snapshot
          return {
            ...item,
            product: liveProduct,
          };
        });

        set({ cart: updatedCart });
      },

      syncCartLive: async () => {
        const currentCart = get().cart;
        if (!currentCart || currentCart.length === 0) return;
        const productIds = Array.from(new Set(currentCart.map((i) => i.product?.id).filter(Boolean)));
        if (productIds.length === 0) return;

        try {
          const productMap = await refreshCartProducts(productIds);
          get().syncCartWithCatalogue(productMap);
        } catch (err) {
          console.error('Failed to synchronize cart with live product catalogue:', err);
        }
      },

      // ──────────────────────────────────────────────────────────────
      // Checkout Pipeline Architecture
      // Two completely isolated pipelines: INSTANT (Buy Now) and CART.
      // checkoutMode is the single source of truth — never inferred.
      // Both fields are ephemeral: NOT persisted to localStorage.
      // ──────────────────────────────────────────────────────────────
      checkoutMode: null,
      instantCheckoutSession: null,

      beginInstantCheckout: ({ product, size, quantity, color, orderType }) => {
        // Enforce quantity=1 for exclusive channel products.
        const effectiveQuantity = isExclusiveChannel(product?.channel) ? 1 : quantity;

        // Single atomic set — writes mode + session simultaneously.
        // No pre-clear. No two-step. No React batching dependency.
        // Every Buy Now click generates a new sessionId, making it
        // impossible for any previous session to survive.
        set({
          checkoutMode: 'INSTANT',
          instantCheckoutSession: {
            sessionId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
            product: { ...product },
            size,
            color,
            quantity: effectiveQuantity,
            orderType: orderType || 'REGULAR',
            createdAt: Date.now(),
          },
        });
      },

      beginCartCheckout: () => {
        // Atomically set CART mode and clear any stale instant session.
        // Cart data is read directly from the cart[] array at checkout.
        set({ checkoutMode: 'CART', instantCheckoutSession: null });
      },

      clearCheckoutSession: () => {
        // Complete reset: called on order success, unmount, back navigation.
        set({ checkoutMode: null, instantCheckoutSession: null });
      },

      // Wishlist
      wishlist: [],

      toggleWishlist: (productInput) => {
        const { wishlist } = get();
        const productId = productInput.id || productInput.productId;
        
        if (wishlist.some(item => item.productId === productId)) {
          set({ wishlist: wishlist.filter((item) => item.productId !== productId) });
        } else {
          // Extract lightweight fields to prevent huge localStorage and stale data
          const baseVariant = productInput.variants?.[0];
          const price = baseVariant?.price ? Number(baseVariant.price) : 0;
          const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : null;
          const images = productInput.images?.map((img: any) => img.url) || [];

          const newItem: WishlistItem = {
            productId,
            slug: productInput.slug || '',
            name: productInput.name || '',
            tagline: productInput.drop?.name || productInput.tagline || null,
            shortDesc: productInput.description || null,
            images,
            price,
            comparePrice,
            defaultVariantId: baseVariant?.id,
            addedAt: new Date().toISOString(),
          };

          set({ wishlist: [...wishlist, newItem] });
        }
      },

      isInWishlist: (productId) => {
        return get().wishlist.some((item) => item.productId === productId);
      },

      removeFromWishlist: (productId) => {
        set({ wishlist: get().wishlist.filter((item) => item.productId !== productId) });
      },

      clearWishlist: () => set({ wishlist: [] }),
      
      setWishlist: (items) => set({ wishlist: items }),

      // Toast
      toast: null,
      showToast: (title, message) => set({ toast: { title, message, isOpen: true } }),
      showExclusiveCartToast: () => {},
      hideToast: () => set((state) => ({ toast: state.toast ? { ...state.toast, isOpen: false } : null })),

      // UI
      isCartOpen: false,
      cartOpenSource: 'manual',
      setCartOpen: (open, source = 'manual') => set({ isCartOpen: open, cartOpenSource: source }),
      isMobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      isNewsletterOpen: false,
      setNewsletterOpen: (open) => set({ isNewsletterOpen: open }),

      // Compare System
      compare: [],
      toggleCompare: (product) => {
        const { compare } = get();
        const exists = compare.some((p) => p.id === product.id);
        if (exists) {
          set({ compare: compare.filter((p) => p.id !== product.id) });
        } else {
          if (compare.length >= 3) {
            get().showToast('Comparison Limit', 'You can compare up to 3 products at a time.');
            return;
          }
          set({ compare: [...compare, product] });
        }
      },
      isInCompare: (productId) => {
        return get().compare.some((p) => p.id === productId);
      },
      clearCompare: () => set({ compare: [] }),
    }),
    {
      name: 'godsmove-store',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          // If migrating from v1 where wishlist was string[], clear it to prevent hydration issues
          persistedState.wishlist = [];
        }
        if (persistedState.cart) {
          persistedState.cart = persistedState.cart.map((item: any) => {
            if (item.product && isExclusiveChannel(item.product.channel) && item.quantity > 1) {
              return { ...item, quantity: 1 };
            }
            return item;
          });
        }
        return persistedState;
      },
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        compare: state.compare,
      }),
    }
  )
);
