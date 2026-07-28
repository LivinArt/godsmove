'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Loader2, Check, X, Pencil } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { isExclusiveChannel } from '@/lib/cart-rules';
import { useStore } from '@/store/useStore';
import { getMyAddresses, createAddress, updateAddress } from '@/actions/address.actions';
import { getMyWallet, validateDiscount, getAvailableDiscounts } from '@/actions/wallet.actions';
import { getMyProfile } from '@/actions/profile.actions';
import { createOrder, confirmOrder } from '@/actions/order.actions';
import { resolveProductImages } from '@/lib/image-resolver';
import { formatGA4Item, trackAddShippingInfo, trackAddPaymentInfo, trackPurchase } from '@/lib/gtag-ecommerce';
import styles from './page.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, instantCheckout, getCartTotal, showExclusiveCartToast, showToast, setCartOpen } = useStore();
  
  const checkoutItems = instantCheckout ? [instantCheckout] : cart;
  
  const subtotal = instantCheckout 
    ? Number(instantCheckout.product.variants?.find((v: any) => v.size === instantCheckout.size)?.price || 0) * instantCheckout.quantity
    : getCartTotal();

  // Authentication & Data States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [saveAddress, setSaveAddress] = useState(true);
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
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [bestCouponDetected, setBestCouponDetected] = useState<any>(null);

  // Load active discounts and auto-apply best fit
  useEffect(() => {
    async function loadDiscounts() {
      try {
        const list = await getAvailableDiscounts();
        setAvailableCoupons(list);

        let bestAmt = 0;
        let bestCode: string | null = null;
        let bestObj: any = null;

        for (const item of list) {
          const minVal = item.minimumOrderValue ? Number(item.minimumOrderValue) : 0;
          if (subtotal < minVal) continue;

          let amt = 0;
          if (item.type === 'PERCENTAGE') {
            amt = (subtotal * Number(item.value)) / 100;
            if (item.maximumDiscount) {
              amt = Math.min(amt, Number(item.maximumDiscount));
            }
          } else if (item.type === 'FIXED_AMOUNT') {
            amt = Math.min(Number(item.value), subtotal);
          }

          if (amt > bestAmt) {
            bestAmt = amt;
            bestCode = item.code;
            bestObj = item;
          }
        }

        if (bestCode && bestAmt > 0 && !useCredits) {
          setAppliedCoupon(bestCode);
          setDiscountAmount(bestAmt);
          setBestCouponDetected(bestObj);
        }
      } catch (err) {
        console.error('Failed to load active discounts:', err);
      }
    }
    
    if (!useCredits) {
      loadDiscounts();
    }
  }, [subtotal, useCredits]);

  // Processing & Payments Simulation States
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [simulatedPaymentStep, setSimulatedPaymentStep] = useState<string | null>(null);

  // Order Success Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [phoneWarning, setPhoneWarning] = useState(false);
  const [editingCheckoutAddressId, setEditingCheckoutAddressId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      let userProf: any = null;
      try {
        userProf = await getMyProfile();
        if (userProf) {
          setProfile(userProf);
          setIsLoggedIn(true);
          if (userProf.email) {
            setForm((prev) => ({ ...prev, email: userProf.email }));
          }
        }
      } catch (err) {}

      try {
        const addrList = await getMyAddresses();
        if (Array.isArray(addrList)) {
          setAddresses(addrList);
          setIsLoggedIn(true);
          const defaultAddr = addrList.find((a: any) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            const userEmail = userProf?.email || '';
            setForm({
              firstName: defaultAddr.firstName || '',
              lastName: defaultAddr.lastName || '',
              email: userEmail,
              phone: (defaultAddr.phone || '').replace(/\D/g, '').slice(-10),
              address: defaultAddr.line1 || '',
              city: defaultAddr.city || '',
              state: defaultAddr.state || '',
              pincode: defaultAddr.pincode || '',
            });
          } else if (addrList.length > 0) {
            setSelectedAddressId(addrList[0].id);
            const userEmail = userProf?.email || '';
            setForm({
              firstName: addrList[0].firstName || '',
              lastName: addrList[0].lastName || '',
              email: userEmail,
              phone: (addrList[0].phone || '').replace(/\D/g, '').slice(-10),
              address: addrList[0].line1 || '',
              city: addrList[0].city || '',
              state: addrList[0].state || '',
              pincode: addrList[0].pincode || '',
            });
          }
        }
      } catch (err) {
        // Address load error
      }

      try {
        const w = await getMyWallet();
        if (w && w.balance !== undefined) {
          setWalletBalance(Number(w.balance));
          setIsLoggedIn(true);
        }
      } catch (err) {
        // Wallet load error
      }
    }
    loadData();
  }, []);

  const populateAddressFields = (addr: any) => {
    const defaultEmail = profile?.email || form.email || '';
    setForm({
      firstName: addr.firstName || '',
      lastName: addr.lastName || '',
      email: defaultEmail,
      phone: (addr.phone || '').replace(/\D/g, '').slice(-10),
      address: addr.line1 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const defaultEmail = profile?.email || form.email || '';
    if (addressId === 'new') {
      setForm({
        firstName: '',
        lastName: '',
        email: defaultEmail,
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

  // Handle Coupon Apply (Mutual Exclusivity Enforced)
  const handleApplyCoupon = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;

    setCouponError(null);
    try {
      const res = await validateDiscount(codeToApply, subtotal);
      if (res.valid && res.discount) {
        setAppliedCoupon(res.discount.code);
        setDiscountAmount(Number(res.discount.discountAmount || 0));
        setUseCredits(false); // Disable credits when applying coupon
        setCouponError(null);
        showToast('Coupon Applied', `Code ${res.discount.code} applied successfully.`);
        setIsDiscountModalOpen(false);
      } else {
        setCouponError(res.error || 'Invalid coupon code');
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Error validating discount code');
    }
  };

  const handleToggleCredits = (checked: boolean) => {
    if (walletBalance === 0) return;
    setUseCredits(checked);
    if (checked) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setBestCouponDetected(null);
    }
  };

  // Mobile Step Wizard State (1: Address, 2: Summary/GST, 3: Payment)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  // Calculate pricing (MRP Inclusive GST Model - No separate GST added)
  const subtotalAfterCoupon = Math.max(0, subtotal - discountAmount);
  const shipping = subtotalAfterCoupon > 1999 ? 0 : 149;
  const totalBeforeCredits = subtotalAfterCoupon + shipping;
  const walletCreditsToUse = useCredits ? Math.min(walletBalance, totalBeforeCredits) : 0;
  const finalPayable = Math.max(0, totalBeforeCredits - walletCreditsToUse);

  const handleStep1Submit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      showToast('Missing Details', 'Please fill out all address and contact fields to proceed.');
      return;
    }
    if (editingCheckoutAddressId) {
      try {
        const updated = await updateAddress(editingCheckoutAddressId, {
          firstName: form.firstName,
          lastName: form.lastName,
          line1: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          phone: form.phone,
        });
        setAddresses(addresses.map(a => a.id === editingCheckoutAddressId ? updated : a));
        setEditingCheckoutAddressId(null);
        showToast('Address Saved', 'Address updated successfully.');
      } catch (err: any) {
        // Continue
      }
    }
    try {
      const gaItems = checkoutItems.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
      trackAddShippingInfo(gaItems, finalPayable);
    } catch (e) {
      // ignore
    }
    setMobileStep(2);
  };

  const handleFinalPlaceOrder = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    await processOrderSubmission();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    await processOrderSubmission();
  };

  const processOrderSubmission = async () => {

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

      // Dispatch GA4 add_payment_info
      try {
        const gaItems = checkoutItems.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
        trackAddPaymentInfo(gaItems, finalPayable, actualPaymentMethod);
      } catch (e) {
        // ignore
      }

      // 2. Call createOrder server action
      const orderRes = await createOrder({
        items: orderItems,
        shippingAddress,
        paymentMethod: actualPaymentMethod,
        couponCode: appliedCoupon || undefined,
        walletAmountToUse: walletCreditsToUse,
      });

      if (!orderRes.success || !orderRes.order) {
        showToast('Checkout Failed', orderRes.error || 'An error occurred during order creation.');
        setIsSubmitLoading(false);
        return;
      }

      const order = orderRes.order;

      // Save address for future orders if checked and using new address
      if (isLoggedIn && saveAddress && selectedAddressId === 'new') {
        try {
          const newAddr = await createAddress({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            line1: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
            phone: form.phone.trim(),
            isDefault: addresses.length === 0,
            label: 'Home',
          });
          if (newAddr) {
            setAddresses((prev) => [...prev, newAddr]);
          }
        } catch (addrErr) {
          console.error('Failed to save address for future orders:', addrErr);
        }
      }

      // 3. Complete checkout payment sequence
      if (actualPaymentMethod === 'COD' || actualPaymentMethod === 'WALLET') {
        try {
          const gaItems = checkoutItems.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
          trackPurchase(order.orderNumber || order.id, finalPayable, gaItems, 0, 0, appliedCoupon || undefined);
        } catch (e) {
          // ignore
        }
        // Instant success checkouts: Set success state first, then clear cart
        setConfirmedOrderNumber(order.orderNumber);
        setShowSuccessModal(true);
        setIsSubmitLoading(false);
        if (instantCheckout) {
          useStore.setState({ instantCheckout: null });
        } else {
          useStore.setState({ cart: [] });
        }
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
              const confirmRes = await confirmOrder(order.id, payId, ordId);
              if (!confirmRes.success) {
                throw new Error(confirmRes.error || 'Failed to confirm transaction.');
              }

              try {
                const gaItems = checkoutItems.map((item, idx) => formatGA4Item(item.product, item.size, item.quantity, idx));
                trackPurchase(order.orderNumber || order.id, finalPayable, gaItems, 0, 0, appliedCoupon || undefined);
              } catch (e) {
                // ignore
              }
              
              setConfirmedOrderNumber(order.orderNumber);
              setShowSuccessModal(true);
              setIsSubmitLoading(false);
              setSimulatedPaymentStep(null);
              if (instantCheckout) {
                useStore.setState({ instantCheckout: null });
              } else {
                useStore.setState({ cart: [] });
              }
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

  if (checkoutItems.length === 0 && !showSuccessModal) {
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

      {/* ── Order Success Modal ── */}
      {showSuccessModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(5, 5, 5, 0.88)',
            backdropFilter: 'blur(18px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            animation: 'successFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes successFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes successSlideUp {
              from { opacity: 0; transform: translateY(32px); }
              to { opacity: 1; transform: translateY(0); }
            }
          ` }} />
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(200, 164, 106, 0.25)',
              maxWidth: '520px',
              width: '100%',
              padding: '56px 48px',
              textAlign: 'center',
              position: 'relative',
              animation: 'successSlideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
            }}
          >
            {/* Top gold rule */}
            <div style={{ width: '40px', height: '1px', background: '#c8a46a', margin: '0 auto 32px' }} />

            {/* Brand mark */}
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: '#c8a46a',
              display: 'block',
              marginBottom: '32px',
            }}>
              GODSMOVE
            </span>

            {/* Editorial headline */}
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              color: '#FAF8F5',
              margin: '0 0 20px',
              lineHeight: 1.1,
            }}>
              Another piece has been<br />allocated to your collection.
            </h2>

            {/* Editorial paragraph */}
            <p style={{
              fontSize: '13px',
              lineHeight: 1.85,
              color: 'rgba(255, 255, 255, 0.5)',
              maxWidth: '380px',
              margin: '0 auto 12px',
              letterSpacing: '0.015em',
            }}>
              This garment has now been reserved under your archive. Every piece becomes part of a carefully curated collection designed to age with you.
            </p>

            {/* Order ref */}
            {confirmedOrderNumber && (
              <p style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(200, 164, 106, 0.6)', textTransform: 'uppercase', marginBottom: '40px' }}>
                Archive Reference — #{confirmedOrderNumber}
              </p>
            )}

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '340px', margin: '0 auto' }}>
              {cart && cart.length > 0 ? (
                <>
                  <button
                    onClick={() => { setShowSuccessModal(false); router.push('/drops'); }}
                    style={{
                      padding: '16px 32px',
                      background: '#c8a46a',
                      color: '#0a0a0a',
                      border: 'none',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#d4b07a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#c8a46a')}
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      setCartOpen(true, 'manual');
                      router.push('/drops');
                    }}
                    style={{
                      padding: '15px 32px',
                      background: 'transparent',
                      color: '#FAF8F5',
                      border: '1px solid #c8a46a',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Review My Bag ({cart.length})
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setShowSuccessModal(false); router.push('/drops'); }}
                    style={{
                      padding: '16px 32px',
                      background: '#c8a46a',
                      color: '#0a0a0a',
                      border: 'none',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#d4b07a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#c8a46a')}
                  >
                    Explore Drops
                  </button>
                  <button
                    onClick={() => { setShowSuccessModal(false); router.push('/profile?tab=collection'); }}
                    style={{
                      padding: '15px 32px',
                      background: 'transparent',
                      color: 'rgba(255, 255, 255, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Your Collection
                  </button>
                </>
              )}
            </div>

            {/* Bottom gold rule */}
            <div style={{ width: '40px', height: '1px', background: 'rgba(200, 164, 106, 0.3)', margin: '40px auto 0' }} />
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

          {/* Mobile 2-Step Wizard Header */}
          <div className={styles.mobileWizardHeader}>
            <button
              type="button"
              className={`${styles.mobileStepTab} ${mobileStep === 1 ? styles.mobileStepTabActive : ''}`}
              onClick={() => setMobileStep(1)}
            >
              <span className={styles.stepNum}>1</span>
              <span>Address</span>
            </button>
            <div className={styles.stepConnector} />
            <button
              type="button"
              className={`${styles.mobileStepTab} ${mobileStep === 2 ? styles.mobileStepTabActive : ''}`}
              onClick={handleStep1Submit}
            >
              <span className={styles.stepNum}>2</span>
              <span>Summary & Payment</span>
            </button>
          </div>

          <form className={styles.layout} onSubmit={handleSubmit}>
            {/* Shipping Info & Address Section (Mobile Step 1) */}
            <div className={`${styles.formSection} ${mobileStep !== 1 ? styles.mobileStepHidden : ''}`}>
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
                        {/* Address type badge + selected indicator row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
                            textTransform: 'uppercase', fontFamily: 'var(--font-heading)',
                            color: selectedAddressId === a.id ? '#c8a46a' : 'var(--text-muted)',
                            border: selectedAddressId === a.id ? '1px solid rgba(200,164,106,0.3)' : '1px solid var(--border-subtle)',
                            padding: '2px 7px',
                            transition: 'all 0.25s ease',
                          }}>
                            {a.label === 'Office' ? '🏢' : a.label === 'Other' ? '📍' : '🏠'} {a.label || 'Home'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAddressId(a.id);
                                setEditingCheckoutAddressId(a.id);
                                setForm({
                                  firstName: a.firstName || '',
                                  lastName: a.lastName || '',
                                  email: profile?.email || form.email || '',
                                  phone: (a.phone || '').replace(/\D/g, '').slice(0, 10),
                                  address: a.line1 || '',
                                  city: a.city || '',
                                  state: a.state || '',
                                  pincode: a.pincode || '',
                                });
                                showToast('Editing Address', `Updating details for ${a.firstName}'s address.`);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#c8a46a',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                opacity: 0.8,
                                transition: 'opacity 0.2s ease',
                              }}
                              title="Edit Address"
                            >
                              <Pencil size={12} />
                            </button>
                            {selectedAddressId === a.id && (
                              <span className={styles.addressCardCheck} />
                            )}
                          </div>
                        </div>
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

              {/* Task 6: Smart Saved Address vs New Address Form */}
              {isLoggedIn && addresses.length > 0 && selectedAddressId !== 'new' ? (
                <>
                  <h2 className={styles.sectionTitle}>Contact & Delivery Updates</h2>
                  <div className={styles.formGrid}>
                    <div className={`${styles.field} ${styles.fieldFull}`}>
                      <label htmlFor="phone" className={styles.label}>Communication Mobile Number</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        pattern="[6-9]\d{9}"
                        title="Please enter a valid 10-digit Indian phone number starting with 6-9"
                        className={styles.input}
                        placeholder="10-digit mobile number for delivery updates"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  {/* Hidden inputs to preserve form payload when saved address is active */}
                  <input type="hidden" name="firstName" value={form.firstName} />
                  <input type="hidden" name="lastName" value={form.lastName} />
                  <input type="hidden" name="email" value={form.email} />
                  <input type="hidden" name="address" value={form.address} />
                  <input type="hidden" name="city" value={form.city} />
                  <input type="hidden" name="state" value={form.state} />
                  <input type="hidden" name="pincode" value={form.pincode} />
                </>
              ) : (
                <>
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
                      {phoneWarning && (
                        <div className={styles.softPhoneWarning}>
                          <span>⚠️ Please enter a valid 10-digit mobile number</span>
                        </div>
                      )}
                      <div className={styles.phoneInputWrap}>
                        <span className={styles.phoneCountryBadge}>🇮🇳 +91</span>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          maxLength={10}
                          className={styles.phoneInput}
                          placeholder="10-digit mobile number"
                          value={form.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setForm({ ...form, phone: val });
                            if (val.length === 10) setPhoneWarning(false);
                          }}
                          onBlur={() => {
                            if (form.phone && form.phone.length !== 10) {
                              setPhoneWarning(true);
                            } else {
                              setPhoneWarning(false);
                            }
                          }}
                        />
                      </div>
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
                    {isLoggedIn && (
                      <div className={`${styles.field} ${styles.fieldFull}`} style={{ marginTop: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#000000' }}>
                          <input
                            type="checkbox"
                            checked={saveAddress}
                            onChange={(e) => setSaveAddress(e.target.checked)}
                            style={{ accentColor: '#c8a46a', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span>Save this address for future orders</span>
                        </label>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Step 1 Mobile Navigation CTA */}
              <div className={styles.mobileStepCtaWrap}>
                <button
                  type="button"
                  onClick={handleStep1Submit}
                  className={styles.mobileWizardNextBtn}
                >
                  Continue to Summary & Payment →
                </button>
              </div>

              {/* Payment Option (Mobile Step 2 / Desktop always visible) */}
              <div className={`${styles.paymentSectionWrap} ${mobileStep !== 2 && mobileStep !== 3 ? styles.mobileStepHidden : ''}`}>
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
            </div>

            {/* Order Summary Sidebar (Mobile Step 2 & 3 / Desktop always visible) */}
            <div className={`${styles.sidebar} ${mobileStep === 1 ? styles.mobileStepHidden : ''}`}>
              <h2 className={styles.sectionTitle}>
                {mobileStep === 3 ? 'Final Confirmation' : 'Summary'}
              </h2>

              <div className={styles.orderItems}>
                {checkoutItems.map((item) => {
                  const variant = item.product.variants?.find((v: any) => v.size === item.size);
                  const itemPrice = variant?.price ? Number(variant.price) : 0;
                  const { frontImage } = resolveProductImages(item.product);
                  return (
                    <div key={`${item.product.id}-${item.size}`} className={styles.orderItem}>
                      <div className={styles.orderItemImage}>
                        <Image src={frontImage} alt={item.product.name} width={60} height={75} style={{ objectFit: 'cover' }} />
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

              {/* Promotional Discount Coupon Section */}
              <div className={styles.couponBlock}>
                <div className={styles.couponOfferDisplay}>
                  <div className={styles.offerStatusHeader}>
                    {appliedCoupon ? (
                      <>
                        <span className={styles.bestOfferAppliedLabel}>Best Offer Applied</span>
                        <div className={styles.appliedCodeRow}>
                          <span className={styles.appliedCodeBadge}>{appliedCoupon}</span>
                          <span className={styles.appliedCodeSavings}>Saved ₹{discountAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setDiscountAmount(0);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            marginTop: '6px',
                            fontSize: '11px',
                            color: '#000000',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 500,
                            letterSpacing: '0.04em',
                            display: 'inline-block'
                          }}
                        >
                          ✕ Remove Coupon
                        </button>
                      </>
                    ) : (
                      <span className={styles.bestOfferAvailableLabel}>Best Available Offer</span>
                    )}
                  </div>
                  <button 
                    type="button" 
                    className={styles.checkOffersLink} 
                    onClick={() => setIsDiscountModalOpen(true)}
                  >
                    Check Discounts & Offers
                  </button>
                </div>
              </div>

              {/* Wallet Credits Usage Checkbox - Always visible for logged-in users */}
              {isLoggedIn && (
                <div className={styles.creditCheckboxRow}>
                  <label className={`${styles.checkboxLabel} ${walletBalance === 0 ? styles.checkboxLabelDisabled : ''}`}>
                    <input
                      type="checkbox"
                      checked={useCredits && walletBalance > 0}
                      disabled={walletBalance === 0}
                      onChange={(e) => handleToggleCredits(e.target.checked)}
                      className={styles.checkboxInput}
                    />
                    <span>
                      Apply GODSMOVE Credits{' '}
                      <strong style={{ fontWeight: 600, color: walletBalance > 0 ? '#c8a46a' : 'var(--text-muted)' }}>
                        (Available Balance: ₹{walletBalance.toLocaleString('en-IN')})
                      </strong>
                    </span>
                  </label>

                  {walletBalance === 0 && (
                    <p className={styles.noCreditsNote}>
                      Your wallet currently has no GODSMOVE Credits.
                    </p>
                  )}

                  {useCredits && walletBalance > 0 && walletCreditsToUse > 0 && (
                    <div className={styles.inlineCreditsConfirmation}>
                      ✓ GODSMOVE Credits have been successfully applied.
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method Selection (Zero Pay notice if finalPayable === 0) */}
              <div className={`${styles.mobileStep2PaymentSection} ${finalPayable === 0 ? styles.zeroPayFaded : ''}`}>
                <p className={styles.paymentSectionLabel}>Select Payment Method</p>
                <div className={styles.paymentOptions}>
                  <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.paymentActive : ''}`}>
                    <input type="radio" name="mobileStep2Payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} disabled={finalPayable === 0} />
                    <div>
                      <span className={styles.paymentName}>Cash On Delivery</span>
                      <span className={styles.paymentDesc}>Pay when you receive your order</span>
                    </div>
                  </label>
                  <label className={`${styles.paymentOption} ${paymentMethod === 'razorpay' ? styles.paymentActive : ''}`}>
                    <input type="radio" name="mobileStep2Payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} disabled={finalPayable === 0} />
                    <div>
                      <span className={styles.paymentName}>Pay via Razorpay</span>
                      <span className={styles.paymentDesc}>UPI, Credit/Debit Cards, NetBanking</span>
                    </div>
                  </label>
                </div>
              </div>

              {finalPayable === 0 && (
                <div className={styles.zeroPayNotice}>
                  ✓ Your order is fully covered. No payment required.
                </div>
              )}

              <div className={styles.pricingRows}>
                <div className={styles.orderRow}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '-8px', marginBottom: '8px', letterSpacing: '0.04em', fontFamily: 'var(--font-heading)' }}>
                  Price inclusive of GST
                </div>
                {discountAmount > 0 && (
                  <div className={styles.orderRow} style={{ color: '#c8a46a' }}>
                    <span>Discount</span>
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

              {/* Submit / Place Order Button (Mobile Step 2 or Desktop) */}
              <div className={`${styles.placeOrderBtnWrap} ${mobileStep === 1 ? styles.mobileStepHidden : ''}`}>
                <button
                  type="button"
                  onClick={handleFinalPlaceOrder}
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
                      Place Order {finalPayable === 0 ? '(₹0 - Covered)' : `(₹${finalPayable.toLocaleString('en-IN')})`}
                    </>
                  )}
                </button>
                <div className={styles.mobileStep2CtaWrap} style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileStep(1);
                      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={styles.mobileWizardBackBtn}
                  >
                    ← Back to Address
                  </button>
                </div>
                <p className={styles.secureNote}>
                  <Lock size={10} />
                  Secure checkout powered by Razorpay
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>

      {isDiscountModalOpen && (
        <div className={styles.discountModalOverlay} onClick={() => setIsDiscountModalOpen(false)}>
          <div className={styles.discountModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.discountModalClose} onClick={() => setIsDiscountModalOpen(false)} aria-label="Close modal">
              <X size={20} />
            </button>
            <h3 className={styles.discountModalTitle}>Discounts & Offers</h3>
            <p className={styles.discountModalSub}>Select or enter a coupon code below</p>

            {/* Manual input */}
            <div className={styles.modalManualCouponGroup}>
              <input 
                type="text" 
                placeholder="Enter Coupon Code" 
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
                className={styles.modalCouponInput}
              />
              <button 
                type="button" 
                onClick={() => handleApplyCoupon(couponCodeInput)}
                className="btn btn-secondary"
                style={{ padding: '0 20px', minHeight: 40 }}
              >
                Apply
              </button>
            </div>
            {couponError && <p className={styles.modalCouponErrorText}>{couponError}</p>}

            {/* Available Coupon Cards list */}
            <div className={styles.couponCardsList}>
              <span className={styles.modalListLabel}>Available Offers</span>
              {availableCoupons.length === 0 ? (
                <p className={styles.noCouponsMsg}>No coupon offers currently active.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {availableCoupons.map((coupon) => {
                    const minOrder = coupon.minimumOrderValue ? Number(coupon.minimumOrderValue) : 0;
                    const isEligible = subtotal >= minOrder;
                    const isActive = appliedCoupon === coupon.code;
                    
                    let savings = 0;
                    if (coupon.type === 'PERCENTAGE') {
                      savings = (subtotal * Number(coupon.value)) / 100;
                      if (coupon.maximumDiscount) {
                        savings = Math.min(savings, Number(coupon.maximumDiscount));
                      }
                    } else if (coupon.type === 'FIXED_AMOUNT') {
                      savings = Math.min(Number(coupon.value), subtotal);
                    }

                    return (
                      <div 
                        key={coupon.id} 
                        className={`${styles.couponCard} ${isActive ? styles.couponCardActive : ''} ${!isEligible ? styles.couponCardIneligible : ''}`}
                      >
                        <div className={styles.couponCardHeader}>
                          <span className={styles.couponCardCode}>{coupon.code}</span>
                          {isActive && <span className={styles.couponAppliedBadge}>Applied</span>}
                        </div>
                        <p className={styles.couponCardDesc}>{coupon.description || 'Exclusive promotional discount code.'}</p>
                        
                        <div className={styles.couponCardFooter}>
                          {isEligible ? (
                            <>
                              <span className={styles.couponCardSavings}>Saves ₹{savings.toLocaleString('en-IN')}</span>
                              {!isActive && (
                                <button 
                                  type="button" 
                                  className={styles.couponApplyBtn}
                                  onClick={() => handleApplyCoupon(coupon.code)}
                                >
                                  Apply Offer
                                </button>
                              )}
                            </>
                          ) : (
                            <span className={styles.couponCardSpendMore}>
                              Spend ₹{(minOrder - subtotal).toLocaleString('en-IN')} more to unlock
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
