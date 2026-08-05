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
import styles from './page.module.css';

export default function CartPage() {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, showExclusiveCartToast, cleanCartUnavailableItems, beginCartCheckout, syncCartLive } = useStore();
  const [isClient, setIsClient] = useState(false);
  const [editorialNotice, setEditorialNotice] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    syncCartLive();
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
    const removedCount = cleanCartUnavailableItems();
    if (removedCount > 0) {
      setEditorialNotice('One or more items are no longer available and have been removed from your checkout.');
    }

    const activeCart = useStore.getState().cart;
    if (activeCart.length === 0) {
      return;
    }

    try {
      const gaItems = activeCart.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
      trackBeginCheckout(gaItems, total);
    } catch (e) {
      // ignore
    }

    requireAuth('checkout', () => {
      beginCartCheckout();
      router.push('/checkout');
    }, { type: 'checkout' });
  };

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        <div className="container">
          <h1 className={`h1 ${styles.title}`}>Cart</h1>

          {editorialNotice && (
            <div className={styles.inlineEditorialNotice}>
              {editorialNotice}
            </div>
          )}

          {cart.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>Your reserved selections are no longer available.</p>
              <Link href="/drops" className="btn btn-primary">
                Continue Discovery →
              </Link>
            </div>
          ) : (
            <div className={styles.layout}>
              <div className={styles.items}>
                <div className={styles.itemsHeader}>
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
    </>
  );
}
