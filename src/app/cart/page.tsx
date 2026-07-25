'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ArrowLeft, Lock, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { isExclusiveChannel } from '@/lib/cart-rules';
import { useStore } from '@/store/useStore';
import { formatGA4Item, trackViewCart, trackBeginCheckout } from '@/lib/gtag-ecommerce';
import styles from './page.module.css';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, showExclusiveCartToast } = useStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
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

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        <div className="container">
          <h1 className={`h1 ${styles.title}`}>Cart</h1>

          {cart.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>Your cart is empty.</p>
              <Link href="/drops" className="btn btn-primary">
                Continue Shopping
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

                  return (
                    <div key={`${item.product.id}-${item.size}`} className={styles.item}>
                      <div className={styles.itemProduct}>
                        <div className={styles.itemImage}>
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
                          <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}>
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            onClick={() => {
                              if (isExclusiveChannel(item.product.channel) && item.quantity >= 1) {
                                showExclusiveCartToast();
                              } else {
                                updateQuantity(item.product.id, item.size, item.quantity + 1);
                              }
                            }}
                            disabled={isExclusiveChannel(item.product.channel) && item.quantity >= 1}
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
                
                <Link
                  href="/checkout"
                  className="btn btn-primary"
                  id="cart-checkout"
                  style={{ width: '100%', padding: '18px 0', marginTop: 'var(--space-md)' }}
                  onClick={() => {
                    try {
                      const gaItems = cart.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
                      trackBeginCheckout(gaItems, total);
                    } catch (e) {
                      // ignore
                    }
                  }}
                >
                  <Lock size={14} style={{ marginRight: '8px' }} /> Secure Checkout
                </Link>
                
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
