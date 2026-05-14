'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/store/useStore';
import styles from './page.module.css';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useStore();
  const total = getCartTotal();

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
              <Link href="/shop" className="btn btn-primary">
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
                {cart.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className={styles.item}>
                    <div className={styles.itemProduct}>
                      <div className={styles.itemImage}>
                        <Image
                          src={item.product.images[0]}
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
                        <p className={styles.itemMeta}>{item.product.color} / {item.size}</p>
                        <p className={styles.itemPrice}>₹{item.product.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className={styles.itemQuantity}>
                      <div className={styles.quantity}>
                        <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}>
                          <Minus size={12} />
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className={styles.itemTotal}>
                      <span>₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.summary}>
                <h2 className={styles.summaryTitle}>Summary</h2>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span className={styles.summaryFree}>Calculated at checkout</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                <Link href="/checkout" className="btn btn-primary" id="cart-checkout">
                  Proceed to Checkout
                  <ArrowRight size={14} />
                </Link>
                <Link href="/shop" className={styles.continueLink}>
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
