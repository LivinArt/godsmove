'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ArrowLeft, Lock, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { isCartItemAvailable } from '@/lib/cart-rules';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/store/useStore';
import { formatGA4Item, trackViewCart, trackBeginCheckout } from '@/lib/gtag-ecommerce';
import { getEffectivePurchaseMode, isPreBookingActive } from '@/lib/launch-engine';
import { PurchaseMode } from '@/types/launch';
import { PreBookingTermsModal } from '@/components/prebooking/PreBookingModals';
import styles from './page.module.css';

export default function CartPage() {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, showExclusiveCartToast, cleanCartUnavailableItems, beginCartCheckout, syncCartLive } = useStore();
  const [isClient, setIsClient] = useState(false);
  const [editorialNotice, setEditorialNotice] = useState<string | null>(null);

  // CART mode: sync live catalogue on mount to validate availability.
  useEffect(() => {
    setIsClient(true);
    syncCartLive().then(() => cleanCartUnavailableItems());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cart.length > 0) {
      try {
        const gaItems = cart.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
        const subtotal = cart.reduce((acc, item) => {
          const variant = item.product.variants?.find((v: any) => v.size === item.size);
          return acc + (variant?.price ? Number(variant.price) : 0) * item.quantity;
        }, 0);
        trackViewCart(gaItems, subtotal);
      } catch (e) {
        // ignore
      }
    }
  }, [cart]);

  const total = cart.reduce((acc, item) => {
    const variant = item.product.variants?.find((v: any) => v.size === item.size);
    const price = variant?.price ? Number(variant.price) : 0;
    return acc + price * item.quantity;
  }, 0);

  const savings = cart.reduce((acc, item) => {
    const variant = item.product.variants?.find((v: any) => v.size === item.size);
    const price = variant?.price ? Number(variant.price) : 0;
    const comparePrice = variant?.comparePrice ? Number(variant.comparePrice) : price;
    if (comparePrice > price) {
      return acc + (comparePrice - price) * item.quantity;
    }
    return acc;
  }, 0);

  const handleCheckoutClick = () => {
    // 1. Sanity check availability before allowing route change
    const unavailableItems = cart.filter((item) => !isCartItemAvailable(item));
    if (unavailableItems.length > 0) {
      cleanCartUnavailableItems();
      setEditorialNotice('One or more items are no longer available and have been removed from your checkout.');
      return;
    }

    // 2. Track GA4
    try {
      const gaItems = cart.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
      trackBeginCheckout(gaItems, total);
    } catch (e) {
      // ignore
    }

    requireAuth('checkout', () => {
      beginCartCheckout();
      router.push('/checkout');
    }, { type: 'checkout', redirect: '/checkout' });
  };

  const [isPreBookingTermsOpen, setIsPreBookingTermsOpen] = useState(false);

  const hasPreBookingItems = cart.some(item => isPreBookingActive(item.product));
  const preBookingProduct = cart.find(item => isPreBookingActive(item.product))?.product;

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Your Collection</h1>
            {cart.length > 0 && (
              <button 
                type="button" 
                className={styles.clearBtn} 
                onClick={clearCart}
              >
                Clear Cart
              </button>
            )}
          </div>

          {editorialNotice && (
            <div className={styles.inlineEditorialNotice}>
              {editorialNotice}
            </div>
          )}

          {cart.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>Your collection is currently empty.</p>
              <Link href="/drops" className="btn btn-primary">
                Discover Drops
              </Link>
            </div>
          ) : (
            <div className={styles.content}>
              <div className={styles.items}>
                <div className={styles.tableHeader}>
                  <span>Product</span>
                  <span>Quantity</span>
                  <span>Total</span>
                </div>
                {cart.map((item) => {
                  const variant = item.product.variants?.find((v: any) => v.size === item.size);
                  const price = variant?.price ? Number(variant.price) : 0;
                  const comparePrice = variant?.comparePrice ? Number(variant.comparePrice) : price;
                  const hasDiscount = comparePrice > price;
                  const isAvailable = isCartItemAvailable(item);

                  return (
                    <div key={`${item.product.id}-${item.size}`} className={styles.item}>
                      <div className={styles.itemProduct}>
                        <div className={`${styles.itemImage} ${!isAvailable ? styles.itemUnavailableImage : ''}`}>
                          <Image
                            src={item.product.images[0]?.url || item.product.images[0]}
                            alt={item.product.name}
                            width={100}
                            height={125}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div className={styles.itemInfo}>
                          <Link href={`/product/${item.product.slug}`} className={styles.itemName}>
                            {item.product.name}
                          </Link>
                          {!isAvailable && (
                            <span className={styles.unavailableBadge}>NO LONGER AVAILABLE</span>
                          )}
                          <p className={styles.itemMeta}>{item.product.color || 'Default'} / {item.size}</p>
                          <div className={styles.itemPriceWrap}>
                            {hasDiscount && (
                              <span className={styles.itemComparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
                            )}
                            <span className={styles.itemPrice}>₹{price.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.itemQuantity}>
                        <div className={styles.quantity}>
                          <button 
                            onClick={() => isAvailable && updateQuantity(item.product.id, item.size, item.quantity - 1)}
                            disabled={!isAvailable}
                          >
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            onClick={() => isAvailable && updateQuantity(item.product.id, item.size, item.quantity + 1)}
                            disabled={!isAvailable}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      <div className={styles.itemTotal}>
                        <span>₹{(price * item.quantity).toLocaleString('en-IN')}</span>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.product.id, item.size)}
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.summary}>
                <h2 className={styles.summaryTitle}>Summary</h2>

                {/* Pre Booking Notice inside Summary */}
                {hasPreBookingItems && (
                  <div style={{
                    background: 'rgba(200, 164, 106, 0.08)',
                    border: '1px solid rgba(200, 164, 106, 0.3)',
                    borderRadius: '2px',
                    padding: '12px 14px',
                    marginBottom: '16px',
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

                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                {savings > 0 && (
                  <div className={`${styles.summaryRow} ${styles.summarySavings}`}>
                    <span>Total Savings</span>
                    <span>-₹{savings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span className={styles.summaryFree}>Calculated at checkout</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  id="cart-checkout"
                  style={{ width: '100%', padding: '18px 0', marginTop: 'var(--space-md)' }}
                  onClick={handleCheckoutClick}
                >
                  <Lock size={14} style={{ marginRight: '8px' }} /> Secure Checkout
                </button>
                
                <div className={styles.trustSignals}>
                  <div className={styles.trustSignal}>
                    <ShieldCheck size={16} />
                    <span>Secure Encrypted Payment</span>
                  </div>
                  <div className={styles.trustSignal}>
                    <Truck size={16} />
                    <span>Fast Pan-India Delivery</span>
                  </div>
                  <div className={styles.trustSignal}>
                    <RotateCcw size={16} />
                    <span>Hassle-Free Returns</span>
                  </div>
                </div>

                <Link href="/drops" className={styles.continueLink}>
                  <ArrowLeft size={12} />
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Pre Booking Terms Modal */}
      <PreBookingTermsModal
        isOpen={isPreBookingTermsOpen}
        onClose={() => setIsPreBookingTermsOpen(false)}
        product={preBookingProduct}
      />
    </>
  );
}
