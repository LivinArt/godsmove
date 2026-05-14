'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { cart, isCartOpen, setCartOpen, updateQuantity, removeFromCart, getCartTotal, setInstantCheckout } = useStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setCartOpen]);

  const total = getCartTotal();

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
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Cart</h2>
          <span className={styles.count}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
          <button
            className={styles.closeBtn}
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {cart.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>Nothing here yet.</p>
              <Link
                href="/shop"
                className="btn btn-primary"
                onClick={() => setCartOpen(false)}
              >
                Browse collection
              </Link>
            </div>
          ) : (
            <div className={styles.items}>
              {cart.map((item) => {
                const variant = item.product.variants?.find((v: any) => v.size === item.size);
                const price = variant?.price ? Number(variant.price) : 0;
                const color = variant?.color || 'Standard';

                return (
                  <div key={`${item.product.id}-${item.size}`} className={styles.item}>
                    <div className={styles.itemImage}>
                      <Image
                        src={item.product.images?.[0]?.url || '/placeholder.png'}
                        alt={item.product.name}
                        width={80}
                        height={100}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemTop}>
                        <h3 className={styles.itemName}>{item.product.name}</h3>
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
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
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
            <div className={styles.subtotal}>
              <span>Subtotal</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <p className={styles.shipping}>Shipping calculated at checkout</p>
            <Link
              href="/checkout"
              className={`btn btn-primary ${styles.checkoutBtn}`}
              onClick={() => {
                setInstantCheckout(null); // Ensure cart checkout doesn't bypass
                setCartOpen(false);
              }}
            >
              Checkout
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
