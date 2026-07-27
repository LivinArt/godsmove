'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  ArrowLeft, 
  MapPin, 
  ShoppingBag, 
  Heart, 
  Wallet, 
  RotateCcw,
  LogOut,
  ChevronRight,
  Loader2,
  Trash2,
  Check,
  Download,
  AlertTriangle,
  ShieldCheck,
  Settings,
  X,
  Clock,
  CreditCard,
  Truck,
  Wrench,
  Sparkles,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  Pencil
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollReveal from '@/components/ScrollReveal';
import { getMyProfile, updateMyProfile } from '@/actions/profile.actions';
import { getMyAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/actions/address.actions';
import { getMyOrders, emailInvoice } from '@/actions/order.actions';
import { getMyReturns, createReturnRequest } from '@/actions/return.actions';
import { getMyWallet } from '@/actions/wallet.actions';
import { 
  getCustomerCareRequests, 
  submitCareRequest, 
  payCareRequestWithCredits, 
  getPurchasedProducts, 
  verifyProductCode,
  createCareRazorpayOrder,
  verifyCarePayment,
  getCareGstPercentage
} from '@/actions/care.actions';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import { resolveImageUrl, resolveOrderItemImageUrl } from '@/lib/image-resolver';
import { uploadImage } from '@/lib/supabase/storage';
import styles from './profile.module.css';

const GOLDEN_LOADING_MESSAGES = [
  "Preparing your private archive...",
  "Collecting your latest allocations...",
  "Retrieving your collection...",
  "Curating your profile...",
  "Loading your archive...",
  "Gathering your journey..."
];

function RenderSkeleton({ tab }: { tab: string }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % GOLDEN_LOADING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.goldenLoadingBanner}>
        <span className={styles.goldenPulseDot} />
        <span className={styles.goldenLoadingQuote}>{GOLDEN_LOADING_MESSAGES[msgIdx]}</span>
      </div>

      <div className={styles.skeleton} style={{ width: '220px', height: '24px', marginBottom: '8px' }} />
      <div className={styles.skeleton} style={{ width: '400px', height: '14px', marginBottom: '32px' }} />
      
      {tab === 'personal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div className={styles.skeleton} style={{ width: '80px', height: '12px', marginBottom: '8px' }} />
              <div className={styles.skeleton} style={{ height: '48px' }} />
            </div>
            <div>
              <div className={styles.skeleton} style={{ width: '80px', height: '12px', marginBottom: '8px' }} />
              <div className={styles.skeleton} style={{ height: '48px' }} />
            </div>
          </div>
          <div>
            <div className={styles.skeleton} style={{ width: '120px', height: '12px', marginBottom: '8px' }} />
            <div className={styles.skeleton} style={{ height: '48px' }} />
          </div>
          <div>
            <div className={styles.skeleton} style={{ width: '100px', height: '12px', marginBottom: '8px' }} />
            <div className={styles.skeleton} style={{ height: '48px' }} />
          </div>
          <div className={styles.skeleton} style={{ width: '140px', height: '48px', marginTop: '16px' }} />
        </div>
      )}

      {tab === 'addresses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.skeleton} style={{ height: '180px', padding: '24px' }}>
              <div style={{ opacity: 0.1, background: 'var(--text-primary)', height: '100%', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      )}

      {tab === 'collection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeleton} style={{ height: '110px' }} />
          ))}
        </div>
      )}

      {tab === 'returns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.skeleton} style={{ height: '140px' }} />
          ))}
        </div>
      )}

      {tab === 'wallet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className={styles.skeleton} style={{ height: '140px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeleton} style={{ height: '60px' }} />
            ))}
          </div>
        </div>
      )}

      {tab === 'passport' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.skeleton} style={{ height: '180px' }} />
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.skeleton} style={{ width: '80%', height: '24px' }} />
          <div className={styles.skeleton} style={{ width: '60%', height: '24px' }} />
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useStore();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'menu' | 'detail'>('menu');
  const [isLoading, setIsLoading] = useState(true);
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);

  // Data States
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [collection, setCollection] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);

  // Form States
  const [personalForm, setPersonalForm] = useState({ firstName: '', lastName: '', phone: '', dob: '' });
  const [personalLoading, setPersonalLoading] = useState(false);

  const [addressForm, setAddressForm] = useState({
    firstName: '', lastName: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', phone: '', label: 'Home'
  });
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Return Flow States
  const [returnFormOpen, setReturnFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState<any>(null);
  const [returnType, setReturnType] = useState<'RETURN_FOR_CREDIT' | 'EXCHANGE'>('RETURN_FOR_CREDIT');
  const [returnReason, setReturnReason] = useState('Size mismatch');
  const [returnComments, setReturnComments] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);

  // Accordion Toggle State
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Timeline & View Details Modals States
  const [trackOrderOpen, setTrackOrderOpen] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<any>(null);
  
  const [trackReturnOpen, setTrackReturnOpen] = useState(false);
  const [activeTrackingReturn, setActiveTrackingReturn] = useState<any>(null);

  const [viewReturnDetailsOpen, setViewReturnDetailsOpen] = useState(false);
  const [activeViewReturn, setActiveViewReturn] = useState<any>(null);

  // File Upload States
  const [evidencePhoto, setEvidencePhoto] = useState<File | null>(null);
  const [evidenceVideo, setEvidenceVideo] = useState<File | null>(null);

  // GODSMOVE Care States
  const [careRequests, setCareRequests] = useState<any[]>([]);
  const [careOnboardingIndex, setCareOnboardingIndex] = useState(0);
  const [careStep, setCareStep] = useState<number>(1);
  const [careProducts, setCareProducts] = useState<any[]>([]);
  const [selectedCareProduct, setSelectedCareProduct] = useState<any>(null);
  const [enteredProductCode, setEnteredProductCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [careCategory, setCareCategory] = useState('Torn');
  const [careDescription, setCareDescription] = useState('');
  const [submittingCare, setSubmittingCare] = useState(false);
  const [careFormOpen, setCareFormOpen] = useState(false);
  const [activeTrackingCare, setActiveTrackingCare] = useState<any>(null);
  const [trackCareOpen, setTrackCareOpen] = useState(false);
  const [useWalletCredits, setUseWalletCredits] = useState(false);
  const [payingRequestId, setPayingRequestId] = useState<string | null>(null);
  const [activeViewCare, setActiveViewCare] = useState<any | null>(null);
  const [viewCareDetailsOpen, setViewCareDetailsOpen] = useState(false);
  const [gstRate, setGstRate] = useState<number>(18);

  const toggleOrderAccordion = (orderId: string) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const parseCareNotes = (notesStr: string | null) => {
    if (!notesStr) {
      return { adminNotes: '', gstPercentage: 18, gstAmount: 0, subtotal: 0, logistics: null };
    }
    try {
      const parsed = JSON.parse(notesStr);
      if (parsed && typeof parsed === 'object') {
        return {
          adminNotes: parsed.adminNotes || '',
          gstPercentage: typeof parsed.gstPercentage === 'number' ? parsed.gstPercentage : 18,
          gstAmount: typeof parsed.gstAmount === 'number' ? parsed.gstAmount : 0,
          subtotal: typeof parsed.subtotal === 'number' ? parsed.subtotal : 0,
          logistics: parsed.logistics || null
        };
      }
    } catch (e) {
      // legacy fallback
    }
    return { adminNotes: notesStr, gstPercentage: 18, gstAmount: 0, subtotal: 0, logistics: null };
  };

  const getCareTimelineStages = (req: any) => {
    const stages = [
      { key: 'SUBMITTED', label: 'Request Submitted' },
      { key: 'APPROVED', label: 'Approved' },
      { key: 'PAYMENT_COMPLETED', label: 'Payment Completed' },
      { key: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled' },
      { key: 'COLLECTED', label: 'Collected' },
      { key: 'UNDER_CARE', label: 'Atelier Received' },
      { key: 'REPAIR_STARTED', label: 'Repair Started' },
      { key: 'REPAIR_COMPLETED', label: 'Repair Completed' },
      { key: 'QC', label: 'Quality Inspection' },
      { key: 'READY_TO_RETURN', label: 'Ready to Return' },
      { key: 'DISPATCHED', label: 'Dispatched' },
      { key: 'DELIVERED', label: 'Delivered' },
      { key: 'COMPLETED', label: 'Completed' }
    ];

    const currentStatus = req.status;
    const isRejected = currentStatus === 'REJECTED';

    let activeIndex = 0;
    if (currentStatus === 'SUBMITTED') activeIndex = 0;
    else if (currentStatus === 'APPROVED' || currentStatus === 'AWAITING_PAYMENT') activeIndex = 1;
    else if (currentStatus === 'PAYMENT_COMPLETED') activeIndex = 2;
    else if (currentStatus === 'PICKUP_SCHEDULED') activeIndex = 3;
    else if (currentStatus === 'COLLECTED') activeIndex = 4;
    else if (currentStatus === 'UNDER_CARE' || currentStatus === 'ATELIER_RECEIVED') activeIndex = 5;
    else if (currentStatus === 'REPAIR_STARTED') activeIndex = 6;
    else if (currentStatus === 'REPAIR_COMPLETED') activeIndex = 7;
    else if (currentStatus === 'QC') activeIndex = 8;
    else if (currentStatus === 'READY_TO_RETURN' || currentStatus === 'PACKED') activeIndex = 9;
    else if (currentStatus === 'DISPATCHED') activeIndex = 10;
    else if (currentStatus === 'DELIVERED') activeIndex = 11;
    else if (currentStatus === 'COMPLETED') activeIndex = 12;

    return stages.map((stage, idx) => {
      let state: 'completed' | 'current' | 'pending' = 'pending';
      if (idx < activeIndex) {
        state = 'completed';
      } else if (idx === activeIndex) {
        state = isRejected ? 'pending' : 'current';
      }
      return {
        ...stage,
        state,
        time: idx <= activeIndex ? 'Done' : ''
      };
    });
  };

  const handlePayCare = async (requestId: string, totalCharge: number) => {
    const creditsToUse = useWalletCredits ? Math.min(Number(wallet?.balance || 0), totalCharge) : 0;
    const remaining = totalCharge - creditsToUse;

    setPayingRequestId(requestId);
    try {
      if (remaining === 0) {
        const res = await verifyCarePayment({
          requestId,
          usedCredits: creditsToUse
        });
        if (res) {
          showToast('Payment Completed', 'Paid fully via Wallet credits.');
          const updated = await getCustomerCareRequests();
          setCareRequests(updated);
          const wall = await getMyWallet();
          setWallet(wall);
        }
      } else {
        const orderData = await createCareRazorpayOrder(requestId, creditsToUse);
        if (!orderData.id) {
          showToast('Payment Error', 'Failed to initialize Razorpay payment');
          return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded) {
          showToast('Payment Error', 'Failed to load Razorpay SDK');
          return;
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: orderData.amount,
          currency: 'INR',
          name: 'GODSMOVE Atelier Care',
          description: `Garment Restoration Service #${requestId.substring(0, 8).toUpperCase()}`,
          order_id: orderData.id,
          handler: async (response: any) => {
            try {
              await verifyCarePayment({
                requestId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                usedCredits: creditsToUse
              });
              showToast('Payment Completed', 'Restoration charges paid successfully.');
              const updated = await getCustomerCareRequests();
              setCareRequests(updated);
              const wall = await getMyWallet();
              setWallet(wall);
            } catch (err: any) {
              showToast('Payment Error', err.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '',
            email: profile?.email || '',
            contact: profile?.phone || '',
          },
          theme: {
            color: '#0A0A0A',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      showToast('Payment Error', err.message || 'Failed to complete payment');
    } finally {
      setPayingRequestId(null);
    }
  };

  const getOrderTimelineStages = (order: any) => {
    const stages = [
      { key: 'placed', label: 'Order Placed' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'packed', label: 'Packed' },
      { key: 'picked_up', label: 'Picked Up' },
      { key: 'in_transit', label: 'In Transit' },
      { key: 'out_for_delivery', label: 'Out For Delivery' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const status = order.status;
    const shipment = order.shipment || (order.shipments && order.shipments[0]) || (order.items && order.items[0]?.shipment);
    const events = shipment?.events || [];
    const hasEvent = (statusName: string) => events.some((e: any) => e.status === statusName);

    // Determine status index
    let activeIndex = 0; // placed
    if (status === 'PENDING') {
      activeIndex = 0;
    } else if (status === 'CONFIRMED') {
      activeIndex = 1;
    } else if (['PROCESSING', 'PACKED'].includes(status)) {
      activeIndex = 2; // Packed
    } else if (status === 'READY_FOR_PICKUP') {
      activeIndex = 3;
    } else if (status === 'SHIPPED' || hasEvent('PICKED_UP')) {
      activeIndex = 3; // Picked Up
    } else if (status === 'IN_TRANSIT' || hasEvent('IN_TRANSIT')) {
      activeIndex = 4; // In Transit
    } else if (hasEvent('OUT_FOR_DELIVERY')) {
      activeIndex = 5; // Out For Delivery
    } else if (['DELIVERED', 'COMPLETED'].includes(status)) {
      activeIndex = 6; // Delivered
    }

    return stages.map((stage, idx) => {
      let state: 'completed' | 'current' | 'pending' = 'pending';
      if (idx < activeIndex) {
        state = 'completed';
      } else if (idx === activeIndex) {
        if (activeIndex === 6 && ['DELIVERED', 'COMPLETED'].includes(status)) {
          state = 'completed';
        } else {
          state = 'current';
        }
      }
      
      // Look up timestamp for event if completed
      let timeStr = '';
      if (idx === 0) {
        timeStr = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else if (idx === 1 && status !== 'PENDING') {
        timeStr = 'Done';
      } else if (idx === 2 && ['PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status)) {
        timeStr = 'Done';
      } else if (idx === 3 && shipment?.shippedAt) {
        timeStr = new Date(shipment.shippedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else if (idx === 6 && shipment?.deliveredAt) {
        timeStr = new Date(shipment.deliveredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else {
        // Try finding matching event status
        const ev = events.find((e: any) => {
          if (idx === 3) return e.status === 'PICKED_UP';
          if (idx === 4) return e.status === 'IN_TRANSIT';
          if (idx === 5) return e.status === 'OUT_FOR_DELIVERY';
          if (idx === 6) return e.status === 'DELIVERED';
          return false;
        });
        if (ev) {
          timeStr = new Date(ev.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        }
      }

      return {
        ...stage,
        state,
        time: timeStr
      };
    });
  };

  const getReturnTimelineStages = (ret: any) => {
    const stages = [
      { key: 'requested', label: 'Return Requested' },
      { key: 'admin_review', label: 'Admin Review' },
      { key: 'approved', label: 'Approved' },
      { key: 'wallet_refund', label: 'Wallet Refund Issued' },
      { key: 'pickup_scheduled', label: 'Pickup Scheduled' },
      { key: 'collected', label: 'Collected' },
      { key: 'inspection', label: 'Inspection' },
      { key: 'refund_completed', label: 'Return Completed' }
    ];

    const status = ret.status; // PENDING, APPROVED, PICKUP_SCHEDULED, COLLECTED, RECEIVED, INSPECTION, REFUND_PROCESSED, COMPLETED, REJECTED
    const events = ret.events || [];

    let activeIndex = 0; // requested
    if (status === 'PENDING') {
      activeIndex = 1; // admin review
    } else if (status === 'APPROVED') {
      activeIndex = 2; // approved (awaiting refund)
    } else if (status === 'REFUND_PROCESSED') {
      activeIndex = 3; // refund processed (awaiting pickup scheduling)
    } else if (status === 'PICKUP_SCHEDULED') {
      activeIndex = 4; // pickup scheduled
    } else if (status === 'COLLECTED') {
      activeIndex = 5; // collected
    } else if (['RECEIVED', 'INSPECTION'].includes(status)) {
      activeIndex = 6; // inspection
    } else if (status === 'COMPLETED') {
      activeIndex = 7; // return completed
    }

    return stages.map((stage, idx) => {
      let state: 'completed' | 'current' | 'pending' = 'pending';
      if (idx < activeIndex) {
        state = 'completed';
      } else if (idx === activeIndex) {
        if (activeIndex === 7 && status === 'COMPLETED') {
          state = 'completed';
        } else {
          state = 'current';
        }
      }

      // Try finding timestamp from events
      const ev = events.find((e: any) => {
        if (idx === 0) return e.status === 'REQUESTED' || e.status === 'PENDING';
        if (idx === 1) return e.status === 'PENDING';
        if (idx === 2) return e.status === 'APPROVED';
        if (idx === 3) return e.status === 'REFUND_PROCESSED' || e.status === 'WALLET_CREDITED';
        if (idx === 4) return e.status === 'PICKUP_SCHEDULED';
        if (idx === 5) return e.status === 'COLLECTED';
        if (idx === 6) return e.status === 'RECEIVED' || e.status === 'INSPECTION';
        if (idx === 7) return e.status === 'COMPLETED';
        return false;
      });

      let timeStr = '';
      if (ev) {
        timeStr = new Date(ev.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else if (idx === 0) {
        timeStr = new Date(ret.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      }

      return {
        ...stage,
        state,
        time: timeStr
      };
    });
  };

  const supabase = createClient();

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/');
          return;
        }

        const [prof, addrs, orders, retRequests, w, cares, careProds, gstPercent] = await Promise.all([
          getMyProfile(),
          getMyAddresses(),
          getMyOrders(),
          getMyReturns(),
          getMyWallet(),
          getCustomerCareRequests(),
          getPurchasedProducts(),
          getCareGstPercentage()
        ]);

        setProfile(prof);
        const formattedDob = prof?.dob ? new Date(prof.dob).toISOString().split('T')[0] : '';
        setPersonalForm({
          firstName: prof?.firstName || '',
          lastName: prof?.lastName || '',
          phone: prof?.phone || '',
          dob: formattedDob
        });

        setAddresses(addrs);
        setCollection(orders);
        setReturns(retRequests);
        setWallet(w);
        setCareRequests(cares);
        setCareProducts(careProds);
        setGstRate(gstPercent);

        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        const mapped = (tabParam === 'collection' || tabParam === 'orders') ? 'collection' :
                       (tabParam === 'care' || tabParam === 'passport') ? 'passport' :
                       tabParam === 'personal' ? 'personal' :
                       tabParam === 'addresses' ? 'addresses' :
                       tabParam === 'returns' ? 'returns' :
                       tabParam === 'wallet' ? 'wallet' :
                       tabParam === 'settings' ? 'settings' : null;

        if (mapped) {
          setActiveTab(mapped);
          setMobileView('detail');
        } else {
          if (isMobile) {
            setActiveTab(null);
            setMobileView('menu');
          } else {
            setActiveTab('personal');
            setMobileView('detail');
          }
        }
      } catch (err: any) {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();

    const handlePopState = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (!tabParam) {
        if (isMobile) {
          setMobileView('menu');
          setActiveTab(null);
        } else {
          setActiveTab('personal');
          setMobileView('detail');
        }
      } else {
        const mapped = (tabParam === 'collection' || tabParam === 'orders') ? 'collection' :
                       (tabParam === 'care' || tabParam === 'passport') ? 'passport' :
                       tabParam === 'personal' ? 'personal' :
                       tabParam === 'addresses' ? 'addresses' :
                       tabParam === 'returns' ? 'returns' :
                       tabParam === 'wallet' ? 'wallet' :
                       tabParam === 'settings' ? 'settings' : 'personal';
        setActiveTab(mapped);
        setMobileView('detail');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setPersonalLoading(true);
    try {
      const updated = await updateMyProfile(personalForm);
      setProfile(updated);
      showToast('Profile Updated', 'Your profile details have been saved.');
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Failed to update profile.');
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    try {
      if (editingAddressId) {
        const updated = await updateAddress(editingAddressId, addressForm);
        setAddresses(addresses.map(a => a.id === editingAddressId ? updated : a));
        setEditingAddressId(null);
        setAddressFormOpen(false);
        setAddressForm({
          firstName: '', lastName: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', phone: '', label: 'Home'
        });
        showToast('Address Updated', 'Delivery address updated successfully.');
      } else {
        const newAddr = await createAddress(addressForm);
        setAddresses([newAddr, ...addresses.map(a => newAddr.isDefault ? { ...a, isDefault: false } : a)]);
        setAddressFormOpen(false);
        setAddressForm({
          firstName: '', lastName: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', phone: '', label: 'Home'
        });
        showToast('Address Added', 'Delivery address saved successfully.');
      }
    } catch (err: any) {
      showToast('Address Failed', err.message || 'Failed to save address.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
      showToast('Address Deleted', 'Saved address removed.');
    } catch (err: any) {
      showToast('Delete Failed', err.message || 'Failed to delete address.');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await setDefaultAddress(id);
      setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
      showToast('Default Updated', 'Default delivery address changed.');
    } catch (err: any) {
      showToast('Update Failed', err.message || 'Failed to update default address.');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Trigger Return/Exchange Workflow
  const handleOpenReturnForm = (order: any, item: any) => {
    setSelectedOrder(order);
    setSelectedOrderItem(item);
    setReturnType('RETURN_FOR_CREDIT');
    setReturnReason('Size mismatch');
    setReturnComments('');
    setReturnFormOpen(true);
  };

  const handleCancelReturnForm = () => {
    setReturnFormOpen(false);
    setSelectedOrder(null);
    setSelectedOrderItem(null);
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedOrderItem) return;

    setReturnLoading(true);
    try {
      const evidenceUrls: string[] = [];

      if (returnReason === 'Damaged Product') {
        if (evidencePhoto) {
          const photoUrl = await uploadImage(evidencePhoto);
          evidenceUrls.push(photoUrl);
        }
        if (evidenceVideo) {
          const videoUrl = await uploadImage(evidenceVideo);
          evidenceUrls.push(videoUrl);
        }
      }

      const retReq = await createReturnRequest({
        orderId: selectedOrder.id,
        type: returnType,
        reason: `${returnReason}: ${returnComments}`.trim(),
        evidenceUrls,
        items: [
          {
            orderItemId: selectedOrderItem.id,
            quantity: selectedOrderItem.quantity,
            reason: returnReason,
          }
        ]
      });

      // Update returnRequests list
      setReturns([retReq, ...returns]);
      
      // Update returnStatus locally on order item
      setCollection(collection.map(o => {
        if (o.id === selectedOrder.id) {
          return {
            ...o,
            items: o.items.map((i: any) => i.id === selectedOrderItem.id ? { ...i, returnStatus: 'PENDING' } : i)
          };
        }
        return o;
      }));

      setReturnFormOpen(false);
      setSelectedOrder(null);
      setSelectedOrderItem(null);
      setEvidencePhoto(null);
      setEvidenceVideo(null);
      setActiveTab('returns');
      showToast('Request Submitted', 'Your return request has been submitted for QC review.');
    } catch (err: any) {
      showToast('Submission Failed', err.message || 'Failed to submit return request.');
    } finally {
      setReturnLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      await emailInvoice(orderId);
      showToast('Invoice Sent', `Tax invoice for Order ${orderNumber} has been sent to your registered email address.`);
    } catch (err: any) {
      showToast('Invoice Request', `Tax invoice copy for ${orderNumber} queued for email delivery.`);
    }
  };

  const handleVerifyProductCode = async () => {
    if (!enteredProductCode.trim()) {
      setVerifyError('Please enter a product code.');
      return;
    }
    setVerifyingCode(true);
    setVerifyError('');
    try {
      const verified = await verifyProductCode(enteredProductCode);
      setSelectedCareProduct(verified);
      setCareStep(2);
      showToast('Code Verified', 'Product found in digital serial registry.');
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed. Code not found.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmitCare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCareProduct) return;
    setSubmittingCare(true);
    try {
      await submitCareRequest({
        orderItemId: selectedCareProduct.orderItemId,
        productCode: selectedCareProduct.productCode,
        category: careCategory,
        description: careDescription
      });
      // reload care requests
      const cares = await getCustomerCareRequests();
      setCareRequests(cares);
      setCareStep(3);
      showToast('Request Submitted', 'GODSMOVE Care request initiated successfully.');
    } catch (err: any) {
      showToast('Submission Failed', err.message || 'Failed to submit care request.');
    } finally {
      setSubmittingCare(false);
    }
  };

  const handlePayCareRequest = async (id: string) => {
    if (!confirm('Are you sure you want to pay for this care request using your wallet credits?')) return;
    try {
      await payCareRequestWithCredits(id);
      // reload care requests and wallet
      const [cares, w] = await Promise.all([
        getCustomerCareRequests(),
        getMyWallet()
      ]);
      setCareRequests(cares);
      setWallet(w);
      showToast('Payment Completed', 'Care charges settled successfully via store credits.');
    } catch (err: any) {
      showToast('Payment Failed', err.message || 'Wallet transaction failed.');
    }
  };

  const handleTabChange = (tab: string) => {
    const t = (tab || '').toLowerCase().trim();
    if (t === 'passport' || t === 'care') {
      setIsCareModalOpen(true);
      return;
    }

    const mapped = (t === 'collection' || t === 'orders') ? 'collection' :
                   (t === 'credits' || t === 'wallet') ? 'wallet' :
                   (t === 'profile' || t === 'personal') ? 'personal' :
                   (t === 'addresses') ? 'addresses' :
                   (t === 'returns') ? 'returns' :
                   (t === 'settings' || t === 'preferences') ? 'settings' : 'personal';

    setActiveTab(mapped);
    setMobileView('detail');
    setReturnFormOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/profile?tab=${mapped}`);
    }
  };

  const getStatusClass = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') return styles.statusPaid;
    if (s === 'UNPAID') return styles.statusUnpaid;
    if (['REFUNDED', 'WALLET_CREDITED', 'REFUND_PROCESSED'].includes(s)) return styles.statusRefunded;
    if (['CANCELLED', 'REJECTED'].includes(s)) return styles.statusCancelled;
    if (['DELIVERED', 'COMPLETED'].includes(s)) return styles.statusDeliveredOutline;
    if (['PENDING', 'REQUESTED'].includes(s)) return styles.statusPending;
    if (['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'APPROVED', 'PICKUP_SCHEDULED'].includes(s)) return styles.statusProcessing;
    return styles.statusDefault;
  };

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <ScrollReveal>
              <h1 className="h1">Your Dashboard</h1>
              <p className={styles.subtitle}>Manage your profile, collections, and credits.</p>
            </ScrollReveal>
          </div>

          {/* Sidebar Navigation */}
          {(() => {
            const currentTab = (activeTab === 'orders' || activeTab === 'collection') ? 'collection' :
                               (activeTab === 'credits' || activeTab === 'wallet') ? 'wallet' :
                               (activeTab === 'profile' || activeTab === 'personal') ? 'personal' :
                               (activeTab === 'addresses') ? 'addresses' :
                               (activeTab === 'returns') ? 'returns' :
                               (activeTab === 'settings' || activeTab === 'preferences') ? 'settings' :
                               (activeTab || 'personal');

            return (
              <div className={styles.dashboard}>
                {/* Sidebar Navigation — Desktop always visible; Mobile shows as list when in 'menu' view */}
                <div className={`${styles.sidebar} ${mobileView === 'detail' ? styles.mobileMenuHidden : ''}`}>

                  {/* ── MOBILE TILE DASHBOARD (8 tiles, 2×4 grid) ── */}
                  <div className={styles.mobileTileGrid}>
                    <button className={styles.mobileTile} onClick={() => handleTabChange('personal')} id="profile-tile-profile">
                      <div className={styles.mobileTileIcon}><User size={22} /></div>
                      <span className={styles.mobileTileLabel}>Your Profile</span>
                    </button>
                    <button className={styles.mobileTile} onClick={() => handleTabChange('collection')} id="profile-tile-collection">
                      <div className={styles.mobileTileIcon}><ShoppingBag size={22} /></div>
                      <span className={styles.mobileTileLabel}>Collection</span>
                    </button>
                    <button className={styles.mobileTile} onClick={() => handleTabChange('addresses')} id="profile-tile-addresses">
                      <div className={styles.mobileTileIcon}><MapPin size={22} /></div>
                      <span className={styles.mobileTileLabel}>Addresses</span>
                    </button>
                    <button className={styles.mobileTile} onClick={() => handleTabChange('returns')} id="profile-tile-returns">
                      <div className={styles.mobileTileIcon}><RotateCcw size={22} /></div>
                      <span className={styles.mobileTileLabel}>Returns</span>
                    </button>
                    <button className={styles.mobileTile} onClick={() => handleTabChange('wallet')} id="profile-tile-wallet">
                      <div className={styles.mobileTileIcon}><Wallet size={22} /></div>
                      <span className={styles.mobileTileLabel}>Credits</span>
                    </button>
                    <button className={styles.mobileTile} onClick={() => handleTabChange('passport')} id="profile-tile-care">
                      <div className={styles.mobileTileIcon}><ShieldCheck size={22} /></div>
                      <span className={styles.mobileTileLabel}>GM Care</span>
                    </button>
                    <button className={styles.mobileTile} onClick={() => handleTabChange('settings')} id="profile-tile-settings">
                      <div className={styles.mobileTileIcon}><Settings size={22} /></div>
                      <span className={styles.mobileTileLabel}>Settings</span>
                    </button>
                    <button className={`${styles.mobileTile} ${styles.mobileTileLogout}`} onClick={handleLogout} id="profile-tile-logout">
                      <div className={styles.mobileTileIcon}><LogOut size={22} /></div>
                      <span className={styles.mobileTileLabel}>Logout</span>
                    </button>
                  </div>

                  {/* ── DESKTOP SIDEBAR NAV LIST ── */}
                  <nav className={`${styles.nav} ${styles.desktopOnlyNav}`}>
                    <button
                      className={`${styles.navItem} ${currentTab === 'personal' ? styles.active : ''}`}
                      onClick={() => handleTabChange('personal')}
                    >
                      <User size={18} />
                      <span>Your Profile</span>
                      <ChevronRight size={16} className={styles.navChevron} />
                    </button>
                    
                    <button
                      className={`${styles.navItem} ${currentTab === 'addresses' ? styles.active : ''}`}
                      onClick={() => handleTabChange('addresses')}
                    >
                      <MapPin size={18} />
                      <span>Addresses</span>
                      <ChevronRight size={16} className={styles.navChevron} />
                    </button>

                    <button
                      className={`${styles.navItem} ${currentTab === 'collection' ? styles.active : ''}`}
                      onClick={() => handleTabChange('collection')}
                    >
                      <ShoppingBag size={18} />
                      <span>Your Collection</span>
                      <ChevronRight size={16} className={styles.navChevron} />
                    </button>

                    <button
                      className={`${styles.navItem} ${currentTab === 'returns' ? styles.active : ''}`}
                      onClick={() => handleTabChange('returns')}
                    >
                      <RotateCcw size={18} />
                      <span>Returns & Exchanges</span>
                      <ChevronRight size={16} className={styles.navChevron} />
                    </button>

                    <button
                      className={`${styles.navItem} ${currentTab === 'wallet' ? styles.active : ''}`}
                      onClick={() => handleTabChange('wallet')}
                    >
                      <Wallet size={18} />
                      <span>GODSMOVE Credits</span>
                      <ChevronRight size={16} className={styles.navChevron} />
                    </button>

                    <button
                      className={styles.navItem}
                      onClick={() => handleTabChange('passport')}
                    >
                      <ShieldCheck size={18} />
                      <span>GODSMOVE Care</span>
                      <ChevronRight size={16} className={styles.navChevron} />
                    </button>

                    <button
                      className={`${styles.navItem} ${currentTab === 'settings' ? styles.active : ''}`}
                      onClick={() => handleTabChange('settings')}
                    >
                      <Settings size={18} />
                      <span>Preferences</span>
                      <ChevronRight size={16} className={styles.navChevron} />
                    </button>

                    <div className={styles.navDivider} />

                    <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={handleLogout}>
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </nav>
                </div>

                {/* Content Panel */}
                <div className={`${styles.content} ${mobileView === 'menu' ? styles.mobileDetailHidden : ''}`}>
                  {/* Mobile Back — editorial gold text link */}
                  {mobileView === 'detail' && (
                    <div className={styles.mobileBackHeader}>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileView('menu');
                          setActiveTab(null);
                          if (typeof window !== 'undefined') {
                            window.history.pushState(null, '', '/profile');
                          }
                        }}
                        className={styles.mobileBackButton}
                      >
                        ← Back to Dashboard
                      </button>
                    </div>
                  )}
                  {isLoading ? (
                    <RenderSkeleton tab={currentTab} />
                  ) : (
                    <>
                      {/* Tab 1: Personal Details */}
                      {currentTab === 'personal' && (
                <div className={styles.panel}>
                  <h2 className="h3">Your Profile</h2>
                  <p className={styles.panelDesc}>Update your personal profile details.</p>
                  
                  <form onSubmit={handleUpdateProfile} className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>First Name</label>
                      <input
                        type="text"
                        required
                        className={styles.input}
                        value={personalForm.firstName}
                        onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Last Name</label>
                      <input
                        type="text"
                        required
                        className={styles.input}
                        value={personalForm.lastName}
                        onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Email Address</label>
                      <input type="email" value={profile?.email || ''} className={styles.input} readOnly style={{ opacity: 0.65, cursor: 'not-allowed' }} />
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        required
                        pattern="[6-9]\d{9}"
                        className={styles.input}
                        placeholder="10-digit mobile"
                        value={personalForm.phone}
                        onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                      />
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        className={styles.input}
                        value={personalForm.dob}
                        onChange={(e) => setPersonalForm({ ...personalForm, dob: e.target.value })}
                      />
                    </div>
                    
                    <button type="submit" disabled={personalLoading} className="btn btn-primary" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-md)' }}>
                      {personalLoading ? <Loader2 className={styles.btnSpinner} size={14} /> : null}
                      Save Changes
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Saved Addresses */}
              {!returnFormOpen && currentTab === 'addresses' && (
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2 className="h3">Addresses</h2>
                      <p className={styles.panelDesc}>Manage saved shipping details for instant checkouts.</p>
                    </div>
                    <button className="btn btn-secondary" onClick={() => setAddressFormOpen(!addressFormOpen)}>
                      {addressFormOpen ? 'Cancel' : 'Add New'}
                    </button>
                  </div>

                  {addressFormOpen && (
                    <form onSubmit={handleCreateAddress} className={`${styles.formGrid} ${styles.addressForm}`}>
                      <div className={styles.formGroup}>
                        <label>First Name</label>
                        <input type="text" required className={styles.input} value={addressForm.firstName} onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input type="text" required className={styles.input} value={addressForm.lastName} onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })} />
                      </div>
                      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label>Address Line 1</label>
                        <input type="text" required className={styles.input} value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>City</label>
                        <input type="text" required className={styles.input} value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>State</label>
                        <input type="text" required className={styles.input} value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Pincode</label>
                        <input type="text" required pattern="[1-9][0-9]{5}" className={styles.input} value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Mobile Number</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-medium)', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.03)', overflow: 'hidden' }}>
                          <span style={{ padding: '0 10px', fontSize: '12px', fontWeight: 600, color: '#c8a46a', background: 'rgba(200, 164, 106, 0.08)', minHeight: '48px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>
                            🇮🇳 +91
                          </span>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            style={{ border: 'none', background: 'transparent', padding: '0 10px', minHeight: '48px', flex: 1, outline: 'none', color: 'var(--text-primary)', fontSize: '14px' }}
                            placeholder="10-digit mobile"
                            value={addressForm.phone}
                            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Address Type</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
                          {['Home', 'Office', 'Other'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setAddressForm({ ...addressForm, label: type })}
                              style={{
                                padding: '12px 8px',
                                minHeight: '52px',
                                border: addressForm.label === type ? '1.5px solid #c8a46a' : '1px solid var(--border-medium)',
                                background: addressForm.label === type ? 'rgba(200, 164, 106, 0.06)' : 'transparent',
                                color: addressForm.label === type ? '#c8a46a' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                fontFamily: 'var(--font-heading)',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <span style={{ fontSize: '16px' }}>
                                {type === 'Office' ? '🏢' : type === 'Other' ? '📍' : '🏠'}
                              </span>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <button type="submit" disabled={addressLoading} className="btn btn-primary" style={{ gridColumn: '1 / -1', marginTop: 'var(--space-md)' }}>
                        {addressLoading ? <Loader2 className={styles.btnSpinner} size={14} /> : null}
                        Save Address
                      </button>
                    </form>
                  )}

                  {!addressFormOpen && addresses.length === 0 && (
                    <div className={styles.emptyState}>
                      <MapPin size={48} className={styles.emptyIcon} />
                      <h3 className="h3">No addresses saved.</h3>
                      <p className={styles.emptyText}>Add an address for faster checkout.</p>
                    </div>
                  )}

                  {!addressFormOpen && addresses.length > 0 && (
                    <div className={styles.addressList}>
                      {addresses.map((a: any) => (
                        <div key={a.id} className={`${styles.addressCard} ${a.isDefault ? styles.addressDefault : ''}`}>
                          <div className={styles.addressHeader}>
                            <span className={styles.addressLabel}>{a.label}</span>
                            {a.isDefault ? <span className={styles.defaultBadge}>Default</span> : null}
                          </div>
                          <p className={styles.addressName}>{a.firstName} {a.lastName}</p>
                          <p className={styles.addressDetails}>{a.line1}, {a.city}, {a.state} - {a.pincode}</p>
                          <p className={styles.addressPhone}>Phone: {a.phone}</p>
                          
                          <div className={styles.addressActions}>
                            <button
                              onClick={() => {
                                setEditingAddressId(a.id);
                                setAddressForm({
                                  firstName: a.firstName || '',
                                  lastName: a.lastName || '',
                                  line1: a.line1 || '',
                                  line2: a.line2 || '',
                                  landmark: a.landmark || '',
                                  city: a.city || '',
                                  state: a.state || '',
                                  pincode: a.pincode || '',
                                  phone: (a.phone || '').replace(/\D/g, '').slice(0, 10),
                                  label: a.label || 'Home',
                                });
                                setAddressFormOpen(true);
                              }}
                              className={styles.actionLink}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                            {!a.isDefault && (
                              <button onClick={() => handleSetDefaultAddress(a.id)} className={styles.actionLink}>
                                Set Default
                              </button>
                            )}
                            <button onClick={() => handleDeleteAddress(a.id)} className={styles.deleteLink} aria-label="Delete address">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Your Collection (Luxury Order Archive) */}
              {currentTab === 'collection' && (
                <div className={styles.panel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <h2 className="h3">Your Orders</h2>
                      <p className={styles.panelDesc}>Complete archival ledger of your orders, shipments, and article lifecycles.</p>
                    </div>
                    <span className={styles.taglineBadge}>Order Archive</span>
                  </div>

                  {collection.length === 0 ? (
                    <div className={styles.emptyState}>
                      <ShoppingBag size={48} className={styles.emptyIcon} />
                      <h3 className="h3">Your collection is empty.</h3>
                      <p className={styles.emptyText}>When you acquire a piece, it will appear in this archive.</p>
                      <Link href="/drops" className="btn btn-primary">Browse Drops</Link>
                    </div>
                  ) : (
                    <div className={styles.ordersList}>
                      {collection.map((order: any) => {
                        const isExpanded = !!expandedOrders[order.id];
                        const totalQuantity = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
                        
                        return (
                          <div key={order.id} className={styles.orderCard}>
                            {/* Unexpanded Primary Row */}
                            <div className={styles.orderCardMainRow}>
                              <div className={styles.orderMetaCol}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <span className={styles.orderNum}>#{order.orderNumber}</span>
                                  <span className={styles.itemCountBadge}>{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}</span>
                                </div>
                                <span className={styles.orderDate}>
                                  Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>

                              <div className={styles.orderStatusCol}>
                                <span className={`${styles.orderStatus} ${getStatusClass(order.paymentStatus)}`}>
                                  {order.paymentStatus === 'PAID' && order.total === 0 ? 'PAID (CREDITS)' : order.paymentStatus}
                                </span>
                                <span className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                                  {order.status.replace(/_/g, ' ')}
                                </span>
                              </div>

                              <div className={styles.orderTotalCol}>
                                <span className={styles.orderTotalVal}>₹{Number(order.total).toLocaleString('en-IN')}</span>
                              </div>

                              {/* Unexpanded Primary Actions */}
                              <div className={styles.orderActionsCol}>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                                  className={styles.invoiceBtn}
                                  title="Download Invoice"
                                >
                                  <Download size={14} />
                                  Invoice
                                </button>

                                {['DELIVERED', 'COMPLETED'].includes(order.status) ? (
                                  <span className={styles.deliveredPill}>
                                    ✓ Delivered
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTrackingOrder(order);
                                      setTrackOrderOpen(true);
                                    }}
                                    className={styles.trackOrderBtn}
                                  >
                                    Track Order
                                  </button>
                                )}

                                {/* Luxury Disclosure Toggle Microinteraction */}
                                <button
                                  type="button"
                                  onClick={() => toggleOrderAccordion(order.id)}
                                  className={styles.disclosureBtn}
                                >
                                  <span>{isExpanded ? 'Hide Details' : 'View Articles'}</span>
                                  <span className={`${styles.disclosureIndicator} ${isExpanded ? styles.disclosureExpanded : ''}`}>▶</span>
                                </button>
                              </div>
                            </div>

                            {/* Expanded Articles View */}
                            {isExpanded && (
                              <div className={styles.expandedArticlesWrap}>
                                <div className={styles.orderBody}>
                                  {order.items.map((item: any) => {
                                    const itemThumb = resolveOrderItemImageUrl(item);
                                    const isEligibleForReturn = (order.status === 'DELIVERED' || order.status === 'COMPLETED') && !item.returnStatus;
                                    
                                    return (
                                      <div key={item.id} className={styles.orderArticleRow}>
                                        <div className={styles.articleThumb}>
                                          <img 
                                            src={itemThumb} 
                                            alt={item.productName} 
                                            width={56} 
                                            height={70} 
                                            style={{ objectFit: 'cover', borderRadius: '4px' }} 
                                          />
                                        </div>
                                        <div className={styles.articleDetails}>
                                          <span className={styles.articleTitle}>{item.productName}</span>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '2px 0 4px' }}>
                                            <span style={{ fontSize: '10px', color: '#c8a46a', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                                              {item.collectionName || 'GODSMOVE Archive'}
                                            </span>
                                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-muted)' }}>
                                              GM-ART-{item.id.toUpperCase().slice(-8)}
                                            </span>
                                          </div>
                                          <span className={styles.articleMeta}>
                                            Variant: {item.color ? `${item.color} / ` : ''}{item.size} • Qty: {item.quantity}
                                          </span>
                                          <span className={styles.articleMeta} style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            ₹{Number(item.price).toLocaleString('en-IN')} × {item.quantity} = ₹{Number(item.total).toLocaleString('en-IN')}
                                          </span>
                                        </div>
                                        <div className={styles.articleActions}>
                                          {isEligibleForReturn && (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenReturnForm(order, item)}
                                              className={styles.itemReturnBtn}
                                            >
                                              Return Item
                                            </button>
                                          )}
                                          {item.returnStatus && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const matchingReturn = returns.find((r: any) => 
                                                  r.items?.some((ri: any) => ri.orderItemId === item.id)
                                                );
                                                if (matchingReturn) {
                                                  handleTabChange('returns');
                                                  setActiveTrackingReturn(matchingReturn);
                                                  setTrackReturnOpen(true);
                                                } else {
                                                  handleTabChange('returns');
                                                }
                                              }}
                                              className={styles.articleStatusBadgeBtn}
                                            >
                                              {item.returnStatus === 'COMPLETED' ? '✓ Return Complete' : `Return: ${item.returnStatus.replace(/_/g, ' ')}`}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Returns & Exchanges ledger */}
              {currentTab === 'returns' && (
                <div className={styles.panel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <h2 className="h3">Returns & Exchanges</h2>
                      <p className={styles.panelDesc}>Track your reverse logistics, quality controls, and refund credits.</p>
                    </div>
                    <span className={styles.taglineBadge}>Reverse Logistics</span>
                  </div>

                  {returns.length === 0 ? (
                    <div className={styles.emptyState}>
                      <RotateCcw size={48} className={styles.emptyIcon} />
                      <h3 className="h3">No active requests.</h3>
                      <p className={styles.emptyText}>If you need to submit a return, start by selecting a piece from Your Collection.</p>
                    </div>
                  ) : (
                    <div className={styles.returnsList}>
                      {returns.map((ret: any) => {
                        const firstReturnItem = ret.items?.[0];
                        const orderItem = firstReturnItem?.orderItem || 
                                          collection.flatMap(o => o.items).find(i => i.id === firstReturnItem?.orderItemId);
                        const itemThumb = resolveOrderItemImageUrl(orderItem);
                        const orderNumber = ret.order?.orderNumber || orderItem?.orderNumber || 'Reference';

                        return (
                          <div key={ret.id} className={styles.returnCard}>
                            <div className={styles.returnCardHeader}>
                              <div>
                                <span className={styles.returnType}>{ret.type?.replace(/_/g, ' ')}</span>
                                <span className={styles.returnDate}>Requested on {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <span className={`${styles.orderStatus} ${getStatusClass(ret.status)}`}>
                                {ret.status}
                              </span>
                            </div>

                            <div className={styles.returnCardBody}>
                              <div className={styles.returnCardThumb}>
                                <img 
                                  src={itemThumb} 
                                  alt={orderItem?.productName || 'Product'} 
                                  className={styles.returnCardImg}
                                />
                              </div>
                              <div className={styles.returnCardInfo}>
                                <span className={styles.returnCardTitle}>{orderItem?.productName || `Order Ref: #${orderNumber}`}</span>
                                <span className={styles.returnCardMeta}>Reason: {ret.reason?.split(':')[0]}</span>
                                {ret.creditAmount && (
                                  <span className={styles.returnCardRefund}>Refund issued: ₹{Number(ret.creditAmount).toLocaleString('en-IN')}</span>
                                )}
                              </div>
                              <div className={styles.returnCardActions}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTrackingReturn(ret);
                                    setTrackReturnOpen(true);
                                  }}
                                  className={styles.itemReturnBtn}
                                  style={{ border: '1px solid #c8a46a', color: '#c8a46a', background: 'transparent' }}
                                >
                                  Track Return
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveViewReturn(ret);
                                    setViewReturnDetailsOpen(true);
                                  }}
                                  className={styles.itemReturnBtn}
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Store Credits (Wallet) */}
              {!returnFormOpen && currentTab === 'wallet' && (
                <div className={styles.panel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <h2 className="h3">GODSMOVE Credits</h2>
                      <p className={styles.panelDesc}>Digital luxury wallet balance and credit ledger.</p>
                    </div>
                    <span className={styles.taglineBadge}>Instant Credit</span>
                  </div>

                  {/* Digital Wallet Card */}
                  <div className={styles.walletCard} style={{ background: 'linear-gradient(135deg, #111111 0%, #1a1a1a 100%)', border: '1px solid rgba(200, 164, 106, 0.3)', padding: '28px', borderRadius: '12px', marginBottom: '32px' }}>
                    <span className="caption" style={{ color: '#c8a46a', letterSpacing: '0.15em', fontSize: '10px', textTransform: 'uppercase' }}>Available GODSMOVE Balance</span>
                    <h2 className="display" style={{ margin: '12px 0', color: '#FAF8F5', fontSize: '36px', fontWeight: 700 }}>
                      ₹{wallet ? Number(wallet.balance).toLocaleString('en-IN') : '0.00'}
                    </h2>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', margin: 0 }}>
                      Applied automatically at checkout to reduce payable totals. Zero expiration.
                    </p>
                  </div>

                  <div className={styles.transactions}>
                    <h3 className="h4" style={{ marginBottom: 16 }}>Transaction Ledger</h3>
                    {!wallet || !wallet.transactions || wallet.transactions.length === 0 ? (
                      <p className={styles.panelDesc}>No recent credit transactions found.</p>
                    ) : (
                      <div className={styles.txnList}>
                        {wallet.transactions.map((tx: any) => (
                          <div key={tx.id} className={styles.txnRow}>
                            <div>
                              <span className={styles.txnType}>{tx.type?.replace(/_/g, ' ')}</span>
                              <span className={styles.txnDate}>{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              {tx.description && <p className={styles.txnDesc}>{tx.description}</p>}
                            </div>
                            <span className={`${styles.txnAmt} ${tx.amount > 0 ? styles.txnPositive : styles.txnNegative}`}>
                              {tx.amount > 0 ? '+' : ''}₹{Number(tx.amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 6: GODSMOVE Care */}
              {!returnFormOpen && activeTab === 'passport' && (
                <div className={styles.panel} style={{ position: 'relative' }}>
                  <style>{`
                    @keyframes careLuxuryIn {
                      from { opacity: 0; transform: translateY(20px); }
                      to { opacity: 1; transform: translateY(0); }
                    }
                    .care-soon-panel { animation: careLuxuryIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                  `}</style>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
                    <div>
                      <h2 className="h3" style={{ letterSpacing: '0.05em' }}>Atelier Care Program</h2>
                      <p className={styles.panelDesc}>Editorial garment restoration services and archival lifecycle register.</p>
                    </div>
                    <span className={styles.taglineBadge} style={{ background: 'rgba(200, 164, 106, 0.08)', color: '#c8a46a', border: '1px solid rgba(200, 164, 106, 0.15)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Atelier Certified
                    </span>
                  </div>
                  <div className="care-soon-panel" style={{ position: 'relative', background: 'linear-gradient(160deg, rgba(20, 18, 14, 0.96) 0%, rgba(8, 8, 8, 1) 100%)', border: '1px solid rgba(200, 164, 106, 0.2)', padding: '72px 48px 64px', textAlign: 'center', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 45% at 50% 30%, rgba(200, 164, 106, 0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ width: '32px', height: '1px', background: '#c8a46a', margin: '0 auto 40px', opacity: 0.7 }} />
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(200, 164, 106, 0.75)', display: 'block', marginBottom: '32px' }}>
                      GODSMOVE CARE PROGRAM
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 200, letterSpacing: '-0.03em', color: '#FAF8F5', lineHeight: 1.05, margin: '0 0 28px' }}>
                      Your garments deserve<br />a lifetime of service.
                    </h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.9, color: 'rgba(255, 255, 255, 0.48)', maxWidth: '460px', margin: '0 auto 20px', letterSpacing: '0.02em' }}>
                      The Atelier Care Program is a dedicated lifecycle service for every GODSMOVE piece — offering professional restoration, structural repair, and garment preservation by our master craftsmen.
                    </p>
                    <p style={{ fontSize: '13px', lineHeight: 1.85, color: 'rgba(255, 255, 255, 0.32)', maxWidth: '400px', margin: '0 auto 48px', letterSpacing: '0.015em' }}>
                      From hand-stitched repairs to archival reblocking and surface restoration, every service is conducted with the same precision as the original garment production.
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 28px', border: '1px solid rgba(200, 164, 106, 0.25)', background: 'rgba(200, 164, 106, 0.04)', marginBottom: '40px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c8a46a', boxShadow: '0 0 10px rgba(200, 164, 106, 0.8)', display: 'inline-block' }} />
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a46a' }}>
                        Launching Soon
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '24px', maxWidth: '560px', margin: '0 auto', textAlign: 'left' }}>
                      {[
                        { label: 'Doorstep Collection', desc: 'White-glove courier pickup' },
                        { label: 'Atelier Restoration', desc: 'Master craftsmanship repair' },
                        { label: 'QC Inspection', desc: 'Structural integrity verify' },
                        { label: 'Archival Delivery', desc: 'Returned to your wardrobe' },
                      ].map((item) => (
                        <div key={item.label} style={{ borderLeft: '2px solid rgba(200, 164, 106, 0.2)', paddingLeft: '16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(200, 164, 106, 0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>
                            {item.label}
                          </span>
                          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)', lineHeight: 1.5 }}>
                            {item.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ width: '32px', height: '1px', background: 'rgba(200, 164, 106, 0.2)', margin: '48px auto 0' }} />
                  </div>
                </div>
              )}

              {/* Tab 7: Preferences (Settings) */}
              {currentTab === 'settings' && (
                <div className={styles.panel}>
                  <h2 className="h3">System Preferences</h2>
                  <p className={styles.panelDesc}>Configure communication and ledger preferences.</p>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked style={{ marginRight: 8 }} />
                        <span>Receive limited drops and catalog launch notifications</span>
                      </label>
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" defaultChecked style={{ marginRight: 8 }} />
                        <span>Require email verification when transferring digital passports</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ==========================================
            MODAL 1: RETURN FLOW FORM OVERLAY
            ========================================== */}
        {returnFormOpen && selectedOrder && selectedOrderItem && (
          <div className={styles.modalOverlay} onClick={handleCancelReturnForm}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalCloseBtn} onClick={handleCancelReturnForm} aria-label="Close modal">
                <X size={20} />
              </button>
              <h2 className={styles.modalTitle}>Request Return / Exchange</h2>
              <p className={styles.modalSubtitle}>For item from Order #{selectedOrder.orderNumber}</p>
              
              <div className={styles.returnItemCard}>
                <div className={styles.returnItemInfo}>
                  <span className={styles.returnItemName}>{selectedOrderItem.productName}</span>
                  <span className={styles.returnItemMeta}>Size: {selectedOrderItem.size} | Qty: {selectedOrderItem.quantity}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitReturn} className={styles.formGrid}>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label style={{ marginBottom: '12px', display: 'block' }}>Request Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setReturnType('RETURN_FOR_CREDIT')}
                      style={{
                        padding: '14px 16px',
                        border: returnType === 'RETURN_FOR_CREDIT' ? '1.5px solid #c8a46a' : '1px solid var(--border-medium)',
                        background: returnType === 'RETURN_FOR_CREDIT' ? 'rgba(200, 164, 106, 0.06)' : 'transparent',
                        color: returnType === 'RETURN_FOR_CREDIT' ? '#c8a46a' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '4px',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>↩</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Return</span>
                      <span style={{ fontSize: '11px', opacity: 0.7, fontWeight: 400 }}>Receive store credits</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReturnType('EXCHANGE')}
                      style={{
                        padding: '14px 16px',
                        border: returnType === 'EXCHANGE' ? '1.5px solid #c8a46a' : '1px solid var(--border-medium)',
                        background: returnType === 'EXCHANGE' ? 'rgba(200, 164, 106, 0.06)' : 'transparent',
                        color: returnType === 'EXCHANGE' ? '#c8a46a' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '4px',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>⇄</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Exchange</span>
                      <span style={{ fontSize: '11px', opacity: 0.7, fontWeight: 400 }}>Different size</span>
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Primary Reason</label>
                  <select
                    className={styles.selectInput}
                    value={returnReason}
                    onChange={(e) => {
                      setReturnReason(e.target.value);
                      if (e.target.value !== 'Damaged Product') {
                        setEvidencePhoto(null);
                        setEvidenceVideo(null);
                      }
                    }}
                  >
                    <option value="Fit & Size Issue">Fit & Size Issue</option>
                    <option value="I Want To Buy Something Else">I Want To Buy Something Else</option>
                    <option value="Damaged Product">Damaged Product</option>
                  </select>
                </div>

                {/* Damaged Product Evidence uploads */}
                {returnReason === 'Damaged Product' && (
                  <>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Photo Evidence</label>
                      <div className={styles.fileUploadGroup} onClick={() => document.getElementById('photo-upload')?.click()}>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className={styles.fileUploadInput}
                          onChange={(e) => setEvidencePhoto(e.target.files?.[0] || null)}
                        />
                        <div className={styles.fileUploadLabel}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click to upload photo of damage</span>
                          {evidencePhoto && <span className={styles.fileSelectedName}>{evidencePhoto.name}</span>}
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Video Evidence</label>
                      <div className={styles.fileUploadGroup} onClick={() => document.getElementById('video-upload')?.click()}>
                        <input
                          id="video-upload"
                          type="file"
                          accept="video/*"
                          className={styles.fileUploadInput}
                          onChange={(e) => setEvidenceVideo(e.target.files?.[0] || null)}
                        />
                        <div className={styles.fileUploadLabel}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click to upload video of damage</span>
                          {evidenceVideo && <span className={styles.fileSelectedName}>{evidenceVideo.name}</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>{returnReason === 'Damaged Product' ? 'Damage Description' : 'Additional Comments'}</label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    placeholder={returnReason === 'Damaged Product' ? "Describe the physical damage or defect in detail..." : "Provide details about fit, issue, or exchange sizing preferences..."}
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.buttonRow} style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                  <button type="submit" disabled={returnLoading} className="btn btn-primary" style={{ flex: 1 }}>
                    {returnLoading ? <Loader2 className={styles.btnSpinner} size={14} /> : null}
                    Submit Request
                  </button>
                  <button type="button" onClick={handleCancelReturnForm} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==========================================
            MODAL 2: TRACK ORDER DELIVERY TIMELINE
            ========================================== */}
        {trackOrderOpen && activeTrackingOrder && (
          <div className={styles.modalOverlay} onClick={() => { setTrackOrderOpen(false); setActiveTrackingOrder(null); }}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalCloseBtn} onClick={() => { setTrackOrderOpen(false); setActiveTrackingOrder(null); }} aria-label="Close modal">
                <X size={20} />
              </button>
              <h2 className={styles.modalTitle}>Delivery Status</h2>
              <p className={styles.modalSubtitle}>Order Reference: #{activeTrackingOrder.orderNumber}</p>
              
              <div className={styles.verticalTimeline}>
                {getOrderTimelineStages(activeTrackingOrder).map((stage) => (
                  <div 
                    key={stage.key} 
                    className={`${styles.timelineEvent} ${
                      stage.state === 'completed' 
                        ? styles.timelineCompleted 
                        : stage.state === 'current' 
                          ? styles.timelineCurrent 
                          : styles.timelinePending
                    }`}
                  >
                    <div className={styles.timelineEventDot} />
                    <div className={styles.timelineEventContent}>
                      <span className={styles.timelineEventTitle}>{stage.label}</span>
                      {stage.time && <span className={styles.timelineEventTime}>{stage.time}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {activeTrackingOrder.shipment && activeTrackingOrder.shipment.trackingNumber && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Carrier: <strong>{activeTrackingOrder.shipment.carrier}</strong>
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Tracking Number: <strong>{activeTrackingOrder.shipment.trackingNumber}</strong>
                  </p>
                </div>
              )}
              
              <div className={styles.buttonRow} style={{ marginTop: 24 }}>
                <button 
                  type="button" 
                  onClick={() => { setTrackOrderOpen(false); setActiveTrackingOrder(null); }} 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODAL 3: TRACK RETURN STATUS TIMELINE
            ========================================== */}
        {trackReturnOpen && activeTrackingReturn && (
          <div className={styles.modalOverlay} onClick={() => { setTrackReturnOpen(false); setActiveTrackingReturn(null); }}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalCloseBtn} onClick={() => { setTrackReturnOpen(false); setActiveTrackingReturn(null); }} aria-label="Close modal">
                <X size={20} />
              </button>
              <h2 className={styles.modalTitle}>Return Status Timeline</h2>
              <p className={styles.modalSubtitle}>Return Request Reference: #{activeTrackingReturn.id.substring(0, 8).toUpperCase()}</p>
              
              <div className={styles.verticalTimeline}>
                {getReturnTimelineStages(activeTrackingReturn).map((stage) => (
                  <div 
                    key={stage.key} 
                    className={`${styles.timelineEvent} ${
                      stage.state === 'completed' 
                        ? styles.timelineCompleted 
                        : stage.state === 'current' 
                          ? styles.timelineCurrent 
                          : styles.timelinePending
                    }`}
                  >
                    <div className={styles.timelineEventDot} />
                    <div className={styles.timelineEventContent}>
                      <span className={styles.timelineEventTitle}>{stage.label}</span>
                      {stage.time && <span className={styles.timelineEventTime}>{stage.time}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {activeTrackingReturn.reverseShipment && activeTrackingReturn.reverseShipment.trackingNumber && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Carrier: <strong>{activeTrackingReturn.reverseShipment.carrier}</strong>
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Reverse AWB: <strong>{activeTrackingReturn.reverseShipment.trackingNumber}</strong>
                  </p>
                </div>
              )}
              
              <div className={styles.buttonRow} style={{ marginTop: 24 }}>
                <button 
                  type="button" 
                  onClick={() => { setTrackReturnOpen(false); setActiveTrackingReturn(null); }} 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODAL 4: VIEW RETURN REQUEST DETAILS
            ========================================== */}
        {viewReturnDetailsOpen && activeViewReturn && (
          <div className={styles.modalOverlay} onClick={() => { setViewReturnDetailsOpen(false); setActiveViewReturn(null); }}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalCloseBtn} onClick={() => { setViewReturnDetailsOpen(false); setActiveViewReturn(null); }} aria-label="Close modal">
                <X size={20} />
              </button>
              <h2 className={styles.modalTitle}>Return Details</h2>
              <p className={styles.modalSubtitle}>Request Reference: #{activeViewReturn.id.substring(0, 8).toUpperCase()}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block' }}>Type</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{activeViewReturn.type?.replace(/_/g, ' ')}</span>
                </div>
                
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block' }}>Reason & Comments</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{activeViewReturn.reason}</span>
                </div>

                {activeViewReturn.evidenceUrls && activeViewReturn.evidenceUrls.length > 0 && (
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Evidence Media</span>
                    <div className={styles.evidenceList}>
                      {activeViewReturn.evidenceUrls.map((url: string, index: number) => {
                        const resolvedUrl = resolveImageUrl(url);
                        const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)/) || url.includes('/video/');
                        if (isVideo) {
                          return (
                            <video 
                              key={index} 
                              src={resolvedUrl} 
                              controls 
                              className={styles.evidenceVideoPreview} 
                            />
                          );
                        }
                        return (
                          <img 
                            key={index} 
                            src={resolvedUrl} 
                            alt={`Evidence ${index + 1}`} 
                            className={styles.evidencePreview} 
                            onClick={() => window.open(resolvedUrl, '_blank')}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeViewReturn.adminNotes && (
                  <div style={{ backgroundColor: 'rgba(200, 164, 106, 0.05)', border: '1px solid rgba(200, 164, 106, 0.15)', padding: '12px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c8a46a', display: 'block', fontWeight: 600 }}>Atelier Remarks</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginTop: '4px', display: 'block' }}>{activeViewReturn.adminNotes}</span>
                  </div>
                )}
              </div>
              
              <div className={styles.buttonRow} style={{ marginTop: 24 }}>
                <button 
                  type="button" 
                  onClick={() => { setViewReturnDetailsOpen(false); setActiveViewReturn(null); }} 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODAL 5: VIEW CARE REQUEST DETAILS
            ========================================== */}
        {viewCareDetailsOpen && activeViewCare && (
          <div className={styles.modalOverlay} onClick={() => { setViewCareDetailsOpen(false); setActiveViewCare(null); }}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%', background: '#0a0a0a', border: '1px solid rgba(200, 164, 106, 0.25)', borderRadius: '16px', padding: '32px', color: '#FAF8F5' }}>
              <button className={styles.modalCloseBtn} onClick={() => { setViewCareDetailsOpen(false); setActiveViewCare(null); }} aria-label="Close modal">
                <X size={20} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(200,164,106,0.1)', color: '#c8a46a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={20} />
                </div>
                <div>
                  <h2 className={styles.modalTitle} style={{ margin: 0, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atelier Care Record</h2>
                  <p className={styles.modalSubtitle} style={{ margin: '2px 0 0', fontSize: '11px', fontFamily: 'monospace', color: '#c8a46a' }}>Reference ID: {activeViewCare.id.toUpperCase()}</p>
                </div>
              </div>

              {(() => {
                const notes = parseCareNotes(activeViewCare.additionalNotes);
                const stages = getCareTimelineStages(activeViewCare);
                const currentStatus = activeViewCare.status;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Item Summary */}
                    <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {activeViewCare.imageUrl ? (
                        <img 
                          src={resolveImageUrl(activeViewCare.imageUrl)} 
                          alt={activeViewCare.productName} 
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} 
                        />
                      ) : (
                        <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Wrench size={20} color="rgba(255,255,255,0.2)" />
                        </div>
                      )}
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#FAF8F5' }}>{activeViewCare.productName}</h4>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#c8a46a', display: 'block' }}>Code: {activeViewCare.productCode}</span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', display: 'block', marginTop: '2px' }}>Category: {activeViewCare.category}</span>
                      </div>
                    </div>

                    {/* Diagnostics & Atelier response */}
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>Diagnostic Description</span>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.6 }}>{activeViewCare.description}</p>
                      
                      {notes.adminNotes && (
                        <div style={{ marginTop: '16px', background: 'rgba(200,164,106,0.03)', border: '1px solid rgba(200, 164, 106, 0.15)', padding: '16px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c8a46a', display: 'block', fontWeight: 600, marginBottom: '6px' }}>Atelier Specialist Notes</span>
                          <p style={{ fontSize: '13px', color: '#FAF8F5', margin: 0, lineHeight: 1.6 }}>{notes.adminNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Logistics parameters */}
                    {notes.logistics && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '12px' }}>Logistics Reverse Tracking</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                          <div>
                            <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>Logistics Partner:</span>
                            <strong style={{ color: '#FAF8F5' }}>{notes.logistics.partner || 'Delhivery'}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>AWB Tracking ID:</span>
                            <strong style={{ color: '#FAF8F5', fontFamily: 'monospace' }}>{notes.logistics.trackingNumber || 'Pending'}</strong>
                          </div>
                          {notes.logistics.pickupDate && (
                            <div>
                              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>Pickup Date:</span>
                              <strong style={{ color: '#FAF8F5' }}>{new Date(notes.logistics.pickupDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong>
                            </div>
                          )}
                          {notes.logistics.estimatedDelivery && (
                            <div>
                              <span style={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>Est. Delivery:</span>
                              <strong style={{ color: '#c8a46a' }}>{new Date(notes.logistics.estimatedDelivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timeline History */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '16px' }}>Detailed Service Milestones</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '8px' }}>
                        {stages.map((st, idx) => {
                          const done = st.state === 'completed';
                          const current = st.state === 'current';
                          return (
                            <div key={st.key} style={{ display: 'flex', gap: '16px', alignItems: 'center', opacity: (done || current) ? 1 : 0.35 }}>
                              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: done ? '#c8a46a' : current ? '#FAF8F5' : 'rgba(255,255,255,0.15)', border: current ? '2px solid #c8a46a' : 'none', zIndex: 2 }} />
                                {idx < stages.length - 1 && (
                                  <div style={{ width: '2px', position: 'absolute', top: '10px', bottom: '-22px', background: done ? '#c8a46a' : 'rgba(255,255,255,0.1)', zIndex: 1 }} />
                                )}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, fontSize: '13px' }}>
                                <span style={{ fontWeight: current ? 600 : 400, color: current ? '#c8a46a' : '#FAF8F5' }}>{st.label}</span>
                                {done && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Completed</span>}
                                {current && <span style={{ fontSize: '11px', color: '#c8a46a', fontWeight: 600 }}>Active</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                {activeViewCare.paymentStatus === 'PAID' && (
                  <a
                    href={`/api/invoice/care/${activeViewCare.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.itemReturnBtn}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#FAF8F5', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '13px', textDecoration: 'none', textAlign: 'center', padding: '12px' }}
                  >
                    <Download size={14} />
                    <span>Print Invoice</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => { setViewCareDetailsOpen(false); setActiveViewCare(null); }}
                  className={styles.itemReturnBtn}
                  style={{ flex: 1, background: '#FAF8F5', color: '#0a0a0a', border: 'none', padding: '12px' }}
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── GODSMOVE CARE LAUNCHING SOON MODAL (Requirement 7) ── */}
        {isCareModalOpen && (
          <div 
            className={styles.careModalOverlay}
            onClick={() => setIsCareModalOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setIsCareModalOpen(false); }}
            tabIndex={0}
          >
            <div 
              className={styles.careModalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button" 
                onClick={() => setIsCareModalOpen(false)} 
                className={styles.careModalCloseBtn}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className={styles.careModalBody}>
                <div className={styles.careModalGoldRule} />
                
                <p className={styles.careModalLeadText}>
                  We care deeply about every piece in your collection.
                </p>

                <h2 className={styles.careModalHeadline}>
                  GODSMOVE CARE
                </h2>

                <span className={styles.careModalBadge}>
                  Launching Soon.
                </span>

                <div className={styles.careModalGoldRule} style={{ marginTop: '24px', marginBottom: 0 }} />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
