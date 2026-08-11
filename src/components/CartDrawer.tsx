'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { resolveProductImages } from '@/lib/image-resolver';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { formatGA4Item, trackViewCart, trackBeginCheckout } from '@/lib/gtag-ecommerce';
import { isCartItemAvailable } from '@/lib/cart-rules';
import { getEffectivePurchaseMode } from '@/lib/launch-engine';
import { PurchaseMode } from '@/types/launch';
import { PreBookingTermsModal } from '@/components/prebooking/PreBookingModals';
import styles from './CartDrawer.module.css';

const RESERVATION_MESSAGES = [
  "We've reserved this piece for you.",
  "Your selected piece has been secured.",
  "Reserved in your collection.",
  "This piece is now held for you.",
];

export default function CartDrawer() {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const { cart, isCartOpen, cartOpenSource, setCartOpen, updateQuantity, removeFromCart, getCartTotal, beginCartCheckout, cleanCartUnavailableItems, syncCartLive } = useStore();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [reservationMsg, setReservationMsg] = useState('');
  const [showReservation, setShowReservation] = useState(false);
  const [editorialNotice, setEditorialNotice] = useState<string | null>(null);
  const [isPreBookingTermsOpen, setIsPreBookingTermsOpen] = useState(false);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reservationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lock body scroll + trackViewCart when open + synchronize live database product catalogue
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      syncCartLive();
      if (cart.length > 0) {
        try {
          const gaItems = cart.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
          const total = getCartTotal();
          trackViewCart(gaItems, total);
        } catch (e) {
          // ignore
        }
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  // Keyboard close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setCartOpen]);

  // Show reservation message + auto-close ONLY when opened via Quick Add
  useEffect(() => {
    if (isCartOpen && cart.length > 0 && cartOpenSource === 'quickAdd') {
      const msg = RESERVATION_MESSAGES[Math.floor(Math.random() * RESERVATION_MESSAGES.length)];
      setReservationMsg(msg);
      setShowReservation(true);

      // Hide message after 1.8s
      reservationTimer.current = setTimeout(() => {
        setShowReservation(false);
      }, 1800);

      // Auto-close drawer after 2.2s
      autoCloseTimer.current = setTimeout(() => {
        setCartOpen(false);
      }, 2200);
    }

    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      if (reservationTimer.current) clearTimeout(reservationTimer.current);
    };
  }, [isCartOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // If user interacts (hovers), cancel auto-close
  const cancelAutoClose = () => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    if (reservationTimer.current) {
      clearTimeout(reservationTimer.current);
      reservationTimer.current = null;
    }
    setShowReservation(false);
  };

  const total = getCartTotal();
  const hasUnavailableItems = cart.some(item => !isCartItemAvailable(item));

  const hasPreBookingItems = cart.some(item => Boolean(item.product?.isPreBooking) || getEffectivePurchaseMode(item.product) === PurchaseMode.PRE_BOOK);
  const preBookingProduct = cart.find(item => Boolean(item.product?.isPreBooking) || getEffectivePurchaseMode(item.product) === PurchaseMode.PRE_BOOK)?.product;

  return (
    <>
      <div
        ref={overlayRef}
        className={`${styles.overlay} ${isCartOpen ? styles.open : ''}`}
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />
      <div
        className={`${styles.drawer} ${isCartOpen ? styles.open : ''}`}
        role="dialog"
        aria-label="Shopping cart"
        id="cart-drawer"
        onMouseEnter={cancelAutoClose}
        onTouchStart={cancelAutoClose}
      >
        {/* Personalized Reservation Message */}
        <div className={`${styles.reservationBanner} ${showReservation ? styles.reservationVisible : ''}`}>
          <span>{reservationMsg}</span>
        </div>

        <div className={styles.header}>
          <h2 className={styles.title}>Your Collection</h2>
          <span className={styles.count}>{cart.length} {cart.length === 1 ? 'piece' : 'pieces'}</span>
          <button
            className={styles.closeBtn}
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {editorialNotice && (
            <div className={styles.inlineEditorialNotice}>
              {editorialNotice}
            </div>
          )}

          {cart.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>Your reserved selections are no longer available.</p>
              <Link
                href="/drops"
                className="btn btn-primary"
                onClick={() => setCartOpen(false)}
              >
                Continue Discovery →
              </Link>
            </div>
          ) : (
            <div className={styles.items}>
              {cart.map((item) => {
                const variant = item.product.variants?.find((v: any) => v.size === item.size);
                const price = variant?.price ? Number(variant.price) : 0;
                const color = variant?.color || 'Standard';
                const isAvailable = isCartItemAvailable(item);

                const { frontImage } = resolveProductImages(item.product);

                return (
                  <div key={`${item.product.id}-${item.size}`} className={styles.item}>
                    <div className={`${styles.itemImage} ${!isAvailable ? styles.itemUnavailableImage : ''}`}>
                      <Image
                        src={frontImage}
                        alt={item.product.name}
                        width={80}
                        height={100}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemTop}>
                        <div>
                          <h3 className={styles.itemName}>{item.product.name}</h3>
                          {!isAvailable && (
                            <span className={styles.unavailableBadge}>NO LONGER AVAILABLE</span>
                          )}
                        </div>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.product.id, item.size)}
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className={styles.itemMeta}>
                        {color} / {item.size}
                      </p>
                      <div className={styles.itemBottom}>
                        <div className={styles.quantity}>
                          <button
                            onClick={() => isAvailable && updateQuantity(item.product.id, item.size, item.quantity - 1)}
                            disabled={!isAvailable}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => isAvailable && updateQuantity(item.product.id, item.size, item.quantity + 1)}
                            disabled={!isAvailable}
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className={styles.itemPrice}>
                          ₹{(price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            {/* Pre-Booking Editorial Notice & Terms Modal Trigger */}
            {hasPreBookingItems && (
              <div style={{
                background: 'rgba(200, 164, 106, 0.08)',
                border: '1px solid rgba(200, 164, 106, 0.3)',
                borderRadius: '2px',
                padding: '12px 14px',
                marginBottom: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: '#c8a46a',
                  }} />
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c8a46a' }}>
                    PRE-BOOKING ALLOCATION
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5, margin: 0 }}>
                  This item is currently in Pre Booking. It will be dispatched according to the official launch schedule and will not ship together with immediately available products.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPreBookingTermsOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c8a46a',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    marginTop: '2px',
                  }}
                >
                  Pre Booking Terms & Conditions →
                </button>
              </div>
            )}

            <div className={styles.subtotal}>
              <span>Subtotal</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <p className={styles.shipping}>Shipping calculated at checkout</p>
            <button
              type="button"
              className={`btn btn-primary ${styles.checkoutBtn}`}
              onClick={() => {
                const removedCount = cleanCartUnavailableItems();
                if (removedCount > 0) {
                  setEditorialNotice('Some reserved pieces are no longer available and were removed from your checkout.');
                }
                const activeCart = useStore.getState().cart;
                if (activeCart.length === 0) {
                  return;
                }
                try {
                  const gaItems = activeCart.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
                  const currentTotal = getCartTotal();
                  trackBeginCheckout(gaItems, currentTotal);
                } catch (e) {
                  // ignore
                }
                requireAuth('checkout', () => {
                  beginCartCheckout();
                  setCartOpen(false);
                  router.push('/checkout');
                }, { type: 'checkout', redirect: '/checkout' });
              }}
            >
              Checkout
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Pre Booking Terms Modal */}
      <PreBookingTermsModal
        isOpen={isPreBookingTermsOpen}
        onClose={() => setIsPreBookingTermsOpen(false)}
        product={preBookingProduct}
      />
    </>
  );
}
