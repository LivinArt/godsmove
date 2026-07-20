'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Loader2, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { isExclusiveChannel } from '@/lib/cart-rules';
import { useStore } from '@/store/useStore';
import { getMyAddresses } from '@/actions/address.actions';
import { getMyWallet, validateDiscount } from '@/actions/wallet.actions';
import { createOrder, confirmOrder } from '@/actions/order.actions';
import styles from './page.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, instantCheckout, getCartTotal, showExclusiveCartToast, showToast } = useStore();
  
  const checkoutItems = instantCheckout ? [instantCheckout] : cart;
  
  const subtotal = instantCheckout 
    ? Number(instantCheckout.product.variants?.find((v: any) => v.size === instantCheckout.size)?.price || 0) * instantCheckout.quantity
    : getCartTotal();

  // Authentication & Data States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [walletBalance, setWalletBalance] = useState(0);

  // Form Field States
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

  // Coupon & Credit States
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [useCredits, setUseCredits] = useState(false);

  // Processing & Payments Simulation States
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [simulatedPaymentStep, setSimulatedPaymentStep] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const addrList = await getMyAddresses();
        setAddresses(addrList);
        setIsLoggedIn(true);

        const w = await getMyWallet();
        setWalletBalance(Number(w.balance));

        // Auto-select default address if exists
        const defaultAddr = addrList.find((a: any) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          populateAddressFields(defaultAddr);
        } else if (addrList.length > 0) {
          setSelectedAddressId(addrList[0].id);
          populateAddressFields(addrList[0]);
        }
      } catch (err) {
        setIsLoggedIn(false);
      }
    }
    loadData();
  }, []);

  const populateAddressFields = (addr: any) => {
    setForm({
      firstName: addr.firstName || '',
      lastName: addr.lastName || '',
      email: addr.email || '',
      phone: addr.phone || '',
      address: addr.line1 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (addressId === 'new') {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
      });
    } else {
      const match = addresses.find((a: any) => a.id === addressId);
      if (match) {
        populateAddressFields(match);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle Coupon Apply
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponError(null);
    try {
      const res = await validateDiscount(couponCodeInput, subtotal);
      if (res.valid && res.discount) {
        setAppliedCoupon(res.discount.code);
        setDiscountAmount(Number(res.discount.discountAmount || 0));
        showToast('Coupon Applied', `Code ${res.discount.code} applied successfully.`);
      } else {
        setCouponError(res.error || 'Invalid coupon code');
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Error validating discount code');
    }
  };

  // Calculate pricing
  const subtotalAfterCoupon = Math.max(0, subtotal - discountAmount);
  const shipping = subtotalAfterCoupon > 1999 ? 0 : 149;
  const totalBeforeCredits = subtotalAfterCoupon + shipping;
  const walletCreditsToUse = useCredits ? Math.min(walletBalance, totalBeforeCredits) : 0;
  const finalPayable = Math.max(0, totalBeforeCredits - walletCreditsToUse);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Channel restrictions validation
    for (const item of checkoutItems) {
      if (isExclusiveChannel(item.product?.channel) && item.quantity > 1) {
        showExclusiveCartToast();
        return;
      }
    }

    const exclusiveCounts = new Map<string, number>();
    for (const item of checkoutItems) {
      if (!isExclusiveChannel(item.product?.channel)) continue;
      exclusiveCounts.set(
        item.product.id,
        (exclusiveCounts.get(item.product.id) ?? 0) + item.quantity
      );
    }
    for (const qty of exclusiveCounts.values()) {
      if (qty > 1) {
        showExclusiveCartToast();
        return;
      }
    }

    setIsSubmitLoading(true);
    try {
      // 1. Compile CreateOrderInput payload
      const orderItems = checkoutItems.map(item => {
        const variant = item.product.variants?.find((v: any) => v.size === item.size);
        if (!variant) throw new Error(`Size ${item.size} not found for ${item.product.name}`);
        return {
          variantId: variant.id,
          quantity: item.quantity,
        };
      });

      const shippingAddress = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        line1: form.address.trim(),
        line2: '',
        landmark: '',
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        label: 'Home',
      };

      // Set internal enum paymentMethod
      let actualPaymentMethod: 'RAZORPAY' | 'COD' | 'WALLET' | 'MIXED' = 'RAZORPAY';
      if (finalPayable === 0 && walletCreditsToUse > 0) {
        actualPaymentMethod = 'WALLET';
      } else if (paymentMethod === 'cod') {
        actualPaymentMethod = 'COD';
      } else if (walletCreditsToUse > 0) {
        actualPaymentMethod = 'MIXED';
      }

      // 2. Call createOrder server action
      const order = await createOrder({
        items: orderItems,
        shippingAddress,
        paymentMethod: actualPaymentMethod,
        couponCode: appliedCoupon || undefined,
        walletAmountToUse: walletCreditsToUse,
      });

      // 3. Complete checkout payment sequence
      if (actualPaymentMethod === 'COD' || actualPaymentMethod === 'WALLET') {
        // Instant success checkouts
        useStore.setState({ cart: [], instantCheckout: null });
        showToast('Order Confirmed', `Order #${order.orderNumber} placed successfully.`);
        router.push('/profile?tab=collection');
      } else {
        // Razorpay secure checkout simulation (Dev Bypass)
        setSimulatedPaymentStep('initiating');
        setTimeout(() => {
          setSimulatedPaymentStep('processing');
          setTimeout(async () => {
            try {
              // Call confirmOrder server action
              const payId = 'pay_mock_' + Math.random().toString(36).substring(7);
              const ordId = 'ord_mock_' + Math.random().toString(36).substring(7);
              await confirmOrder(order.id, payId, ordId);
              
              useStore.setState({ cart: [], instantCheckout: null });
              showToast('Order Confirmed', `Order #${order.orderNumber} placed successfully.`);
              router.push('/profile?tab=collection');
            } catch (err: any) {
              showToast('Payment Confirmation Error', err.message || 'Failed to confirm transaction.');
              setSimulatedPaymentStep(null);
              setIsSubmitLoading(false);
            }
          }, 1200);
        }, 800);
      }
    } catch (err: any) {
      showToast('Checkout Failed', err.message || 'An error occurred during order creation.');
      setIsSubmitLoading(false);
    }
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
      
      {simulatedPaymentStep && (
        <div className={styles.simulatedOverlay}>
          <div className={styles.simulatedModal}>
            <Loader2 className={styles.spinner} size={36} />
            <h3>Secure Gateway Simulation</h3>
            {simulatedPaymentStep === 'initiating' && <p>Initiating payment window...</p>}
            {simulatedPaymentStep === 'processing' && <p>Authorizing transaction amount of ₹{finalPayable.toLocaleString('en-IN')}...</p>}
          </div>
        </div>
      )}

      <main className={styles.page}>
        <div className="container">
          <Link href="/drops" className={styles.backLink}>
            <ArrowLeft size={14} />
            Continue discovery
          </Link>

          <h1 className={styles.title}>Checkout</h1>

          <form className={styles.layout} onSubmit={handleSubmit}>
            {/* Shipping Info */}
            <div className={styles.formSection}>
              {isLoggedIn && addresses.length > 0 && (
                <div className={styles.addressSelectorWrap}>
                  <p className={styles.addressSelectorLabel}>Ship To</p>
                  <div className={styles.addressCardGrid}>
                    {addresses.map((a: any) => (
                      <button
                        key={a.id}
                        type="button"
                        className={`${styles.addressCard} ${selectedAddressId === a.id ? styles.addressCardActive : ''}`}
                        onClick={() => handleAddressSelect(a.id)}
                        aria-pressed={selectedAddressId === a.id}
                      >
                        {a.isDefault && (
                          <span className={styles.addressDefaultBadge}>Default</span>
                        )}
                        <span className={styles.addressCardName}>
                          {a.firstName} {a.lastName}
                        </span>
                        {a.phone && (
                          <span className={styles.addressCardPhone}>{a.phone}</span>
                        )}
                        <span className={styles.addressCardDetails}>
                          {a.line1}{a.line2 ? `, ${a.line2}` : ''}
                          <br />
                          {a.city}, {a.state} — {a.pincode}
                        </span>
                        {selectedAddressId === a.id && (
                          <span className={styles.addressCardCheck}>
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`${styles.addressCard} ${styles.addressCardNew} ${selectedAddressId === 'new' ? styles.addressCardActive : ''}`}
                      onClick={() => handleAddressSelect('new')}
                      aria-pressed={selectedAddressId === 'new'}
                    >
                      <span className={styles.addressNewIcon}>+</span>
                      <span className={styles.addressCardName}>New Address</span>
                      <span className={styles.addressCardDetails}>Enter a new delivery address below</span>
                    </button>
                  </div>
                </div>
              )}

              <h2 className={styles.sectionTitle}>Delivery Information</h2>
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
                  <label htmlFor="email" className={styles.label}>Email Address</label>
                  <input id="email" name="email" type="email" required className={styles.input} value={form.email} onChange={handleChange} />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label htmlFor="phone" className={styles.label}>Mobile Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    pattern="[6-9]\d{9}"
                    title="Please enter a valid 10-digit Indian phone number starting with 6-9"
                    className={styles.input}
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <label htmlFor="address" className={styles.label}>Address Line 1</label>
                  <input id="address" name="address" type="text" required className={styles.input} placeholder="Flat/House no., Building, Street" value={form.address} onChange={handleChange} />
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
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    required
                    pattern="[1-9][0-9]{5}"
                    title="Please enter a valid 6-digit Indian pincode"
                    className={styles.input}
                    value={form.pincode}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Payment Option */}
              <h2 className={styles.sectionTitle} style={{ marginTop: 'var(--space-2xl)' }}>Payment Method</h2>
              <div className={styles.paymentOptions}>
                <label className={`${styles.paymentOption} ${paymentMethod === 'razorpay' ? styles.paymentActive : ''}`}>
                  <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                  <div>
                    <span className={styles.paymentName}>Secure Online Payment</span>
                    <span className={styles.paymentDesc}>UPI, Cards, Net Banking, Wallets</span>
                  </div>
                </label>
                <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.paymentActive : ''}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <div>
                    <span className={styles.paymentName}>Cash on Delivery</span>
                    <span className={styles.paymentDesc}>Verify order details and pay when you receive</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className={styles.sidebar}>
              <h2 className={styles.sectionTitle}>Summary</h2>
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

              {/* Promotional Discount Coupon Code apply form */}
              <div className={styles.couponBlock}>
                <div className={styles.couponForm}>
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className={styles.couponInput}
                  />
                  <button type="button" onClick={handleApplyCoupon} className="btn btn-secondary" style={{ padding: '0 16px', minHeight: 40 }}>
                    Apply
                  </button>
                </div>
                {couponError && <p className={styles.couponErrorText}>{couponError}</p>}
                {appliedCoupon && (
                  <p className={styles.couponSuccessText}>
                    <Check size={12} style={{ marginRight: 4 }} />
                    Code <strong>{appliedCoupon}</strong> applied (-₹{discountAmount.toLocaleString('en-IN')})
                  </p>
                )}
              </div>

              {/* Wallet Credits Usage Checkbox */}
              {isLoggedIn && walletBalance > 0 && (
                <div className={styles.creditCheckboxRow}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={useCredits}
                      onChange={(e) => setUseCredits(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span>Apply Credits (Balance: ₹{walletBalance.toLocaleString('en-IN')})</span>
                  </label>
                </div>
              )}

              <div className={styles.pricingRows}>
                <div className={styles.orderRow}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className={styles.orderRow} style={{ color: '#c8a46a' }}>
                    <span>Discount Code</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className={styles.orderRow}>
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                </div>
                {walletCreditsToUse > 0 && (
                  <div className={styles.orderRow} style={{ color: '#c8a46a' }}>
                    <span>Credits Applied</span>
                    <span>-₹{walletCreditsToUse.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className={`${styles.orderRow} ${styles.orderTotal}`}>
                  <span>Grand Total</span>
                  <span>₹{finalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitLoading}
                className={`btn btn-primary ${styles.placeOrder}`}
                id="place-order"
              >
                {isSubmitLoading ? (
                  <>
                    <Loader2 className={styles.btnSpinner} size={14} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={14} style={{ marginRight: 6 }} />
                    Place Order
                  </>
                )}
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
