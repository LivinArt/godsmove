'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  canAddExclusiveToCart,
  canSetExclusiveQuantity,
  cartHasExclusiveProduct,
  EXCLUSIVE_CART_TOAST_MESSAGE,
  isExclusiveChannel,
} from '@/lib/cart-rules';
import { formatGA4Item, trackAddToCart, trackRemoveFromCart } from '@/lib/gtag-ecommerce';

export interface CartItem {
  product: any; // Prisma Product with images and variants
  size: string;
  quantity: number;
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
  addToCart: (product: any, size: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;

  // Instant Checkout Bypass
  instantCheckout: CartItem | null;
  setInstantCheckout: (item: CartItem | null) => void;

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

      addToCart: (product, size, quantity = 1) => {
        const { cart } = get();

        if (isExclusiveChannel(product.channel)) {
          if (
            !canAddExclusiveToCart({
              channel: product.channel,
              quantity,
              productId: product.id,
              cart,
            })
          ) {
            get().showExclusiveCartToast();
            return;
          }
          quantity = 1;
        }

        const existing = cart.find(
          (item) => item.product.id === product.id && item.size === size
        );

        if (existing) {
          if (isExclusiveChannel(product.channel)) {
            get().showExclusiveCartToast();
            return;
          }

          set({
            cart: cart.map((item) =>
              item.product.id === product.id && item.size === size
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { product, size, quantity }] });
        }

        set({ isCartOpen: true, cartOpenSource: 'quickAdd' });

        try {
          const gaItem = formatGA4Item(product, size, quantity);
          trackAddToCart(gaItem);
        } catch (err) {
          console.error('GA4 addToCart tracking error:', err);
        }
      },

      removeFromCart: (productId, size) => {
        const itemToRemove = get().cart.find(
          (item) => item.product?.id === productId && item.size === size
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
            (item) => !(item.product.id === productId && item.size === size)
          ),
        });
      },

      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, size);
          return;
        }

        const { cart } = get();
        const item = cart.find(i => i.product.id === productId && i.size === size);
        
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

      // Instant Checkout Bypass
      instantCheckout: null,
      setInstantCheckout: (item) => {
        if (!item) {
          set({ instantCheckout: null });
          return;
        }

        if (isExclusiveChannel(item.product?.channel)) {
          if (item.quantity > 1) {
            get().showExclusiveCartToast();
            return;
          }
          const { cart } = get();
          if (cartHasExclusiveProduct(cart, item.product.id)) {
            get().showExclusiveCartToast();
            return;
          }
          item = { ...item, quantity: 1 };
        }

        set({ instantCheckout: item });
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
      showExclusiveCartToast: () =>
        set({ toast: { title: EXCLUSIVE_CART_TOAST_MESSAGE, message: '', isOpen: true } }),
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
