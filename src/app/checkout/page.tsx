'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useStore } from '@/store/useStore';
import styles from './page.module.css';

export default function CheckoutPage() {
  const { cart, instantCheckout, getCartTotal } = useStore();
  
  const checkoutItems = instantCheckout ? [instantCheckout] : cart;
  
  const total = instantCheckout 
    ? Number(instantCheckout.product.variants?.find((v: any) => v.size === instantCheckout.size)?.price || 0) * instantCheckout.quantity
    : getCartTotal();
    
  const shipping = total > 1999 ? 0 : 149;
  const grandTotal = total + shipping;

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Razorpay integration would trigger here
    alert('Checkout flow would initiate Razorpay here. This is a frontend demo.');
  };

  if (checkoutItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <div className="container">
            <div className={styles.empty}>
              <p>Your cart is empty.</p>
              <Link href="/drops" className="btn btn-primary">Shop Now</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className="container">
          <Link href="/cart" className={styles.backLink}>
            <ArrowLeft size={14} />
            Back to Cart
          </Link>

          <h1 className={styles.title}>Checkout</h1>

          <form className={styles.layout} onSubmit={handleSubmit}>
            {/* Shipping Info */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Shipping</h2>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="firstName" className={styles.label}>First Name</label>
                  <input id="firstName" name="firstName" type="text" required className={styles.input} value={form.firstName} onChange={handleChange} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="lastName" className={styles.label}>Last Name</label>
                  <input id="lastName" name="lastName" type="text" required className={styles.input} value={form.lastName} onChange={handleChange} />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label htmlFor="email" className={styles.label}>Email</label>
                  <input id="email" name="email" type="email" required className={styles.input} value={form.email} onChange={handleChange} />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label htmlFor="phone" className={styles.label}>Phone</label>
                  <input id="phone" name="phone" type="tel" required className={styles.input} placeholder="+91" value={form.phone} onChange={handleChange} />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label htmlFor="address" className={styles.label}>Address</label>
                  <input id="address" name="address" type="text" required className={styles.input} value={form.address} onChange={handleChange} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="city" className={styles.label}>City</label>
                  <input id="city" name="city" type="text" required className={styles.input} value={form.city} onChange={handleChange} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="state" className={styles.label}>State</label>
                  <input id="state" name="state" type="text" required className={styles.input} value={form.state} onChange={handleChange} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="pincode" className={styles.label}>Pincode</label>
                  <input id="pincode" name="pincode" type="text" required className={styles.input} value={form.pincode} onChange={handleChange} />
                </div>
              </div>

              {/* Payment Method */}
              <h2 className={styles.sectionTitle} style={{ marginTop: 'var(--space-2xl)' }}>Payment</h2>
              <div className={styles.paymentOptions}>
                <label className={`${styles.paymentOption} ${paymentMethod === 'razorpay' ? styles.paymentActive : ''}`}>
                  <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                  <div>
                    <span className={styles.paymentName}>Razorpay</span>
                    <span className={styles.paymentDesc}>UPI, Cards, Net Banking, Wallets</span>
                  </div>
                </label>
                <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.paymentActive : ''}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <div>
                    <span className={styles.paymentName}>Cash on Delivery</span>
                    <span className={styles.paymentDesc}>Pay when you receive</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Summary */}
            <div className={styles.sidebar}>
              <h2 className={styles.sectionTitle}>Order Summary</h2>
              <div className={styles.orderItems}>
                {checkoutItems.map((item) => {
                  const variant = item.product.variants?.find((v: any) => v.size === item.size);
                  const itemPrice = variant?.price ? Number(variant.price) : 0;
                  return (
                    <div key={`${item.product.id}-${item.size}`} className={styles.orderItem}>
                      <div className={styles.orderItemImage}>
                        <Image src={item.product.images?.[0]?.url || '/placeholder.png'} alt={item.product.name} width={60} height={75} style={{ objectFit: 'cover' }} />
                        <span className={styles.orderItemQty}>{item.quantity}</span>
                      </div>
                      <div className={styles.orderItemInfo}>
                        <span className={styles.orderItemName}>{item.product.name}</span>
                        <span className={styles.orderItemMeta}>{variant?.color || 'Standard'} / {item.size}</span>
                      </div>
                      <span className={styles.orderItemPrice}>₹{(itemPrice * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
              <div className={styles.orderRow}>
                <span>Subtotal</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div className={styles.orderRow}>
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
              <div className={`${styles.orderRow} ${styles.orderTotal}`}>
                <span>Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <button type="submit" className={`btn btn-primary ${styles.placeOrder}`} id="place-order">
                <Lock size={14} />
                Place Order
              </button>
              <p className={styles.secureNote}>
                <Lock size={10} />
                Secure checkout powered by Razorpay
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
