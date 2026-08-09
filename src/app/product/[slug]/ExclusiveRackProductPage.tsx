'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductStorytelling from '@/components/ProductStorytelling';
import {
  Heart,
  ShoppingBag,
  ArrowLeftRight,
  Share2,
  ChevronDown,
  Award,
  User,
  Ruler,
  ShieldCheck,
  Package,
  Minus,
  Plus,
  Tag,
  Rocket,
  Crown,
  Eye,
  Ticket,
  Diamond,
  Gift,
  Trophy,
  Users,
  Archive,
  Clock,
  Sparkles,
  Layers,
  Scissors,
  Brush
} from 'lucide-react';
import SizeChartModal, { type SizeChartEntry } from '@/components/SizeChartModal';
import RecentlyViewed from '@/components/RecentlyViewed';
import MobileQuickAddSheet from '@/components/MobileQuickAddSheet';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import { formatGA4Item, trackViewItem } from '@/lib/gtag-ecommerce';
import {
  getEffectivePurchaseMode,
  getPreBookingOfferDetails,
  useSynchronizedCountdown,
  formatExpectedDispatchText,
} from '@/lib/launch-engine';
import { PurchaseMode } from '@/types/launch';
import { PreBookingBenefitsModal, PreBookingTermsModal } from '@/components/prebooking/PreBookingModals';
import styles from './ExclusiveRackProductPage.module.css';

interface ExclusiveRackProductPageProps {
  product: any;
  availableSizes: { label: string; available: boolean }[];
  coverImage?: string | null;
  profile?: any;
}

export default function ExclusiveRackProductPage({
  product,
  availableSizes,
  coverImage,
  profile,
}: ExclusiveRackProductPageProps) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copiedShare, setCopiedShare] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileSheetAction, setMobileSheetAction] = useState<'add' | 'buy'>('add');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isBenefitsModalOpen, setIsBenefitsModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Proportional Continuous Reel Scroll Progress (0 to totalImages - 1)
  const [reelProgress, setReelProgress] = useState(0);
  const reelProgressRef = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile CTA visibility (IntersectionObserver-driven)
  const [showMobileCta, setShowMobileCta] = useState(false);
  // Mobile scroll hint (disappears after gallery interaction)
  const [showScrollHint, setShowScrollHint] = useState(true);
  // Ref to product detail section for IntersectionObserver
  const productDetailRef = useRef<HTMLDivElement>(null);

  // 100% DYNAMIC ADMIN VARIANT SYNCHRONIZATION (Source of truth: Admin Product Variants)
  const adminVariants = Array.isArray(product.variants) ? product.variants : [];

  // Dynamically extract unique colors from admin variants
  const colorMap = new Map<string, string>();
  adminVariants.forEach((v: any) => {
    if (v.color && v.color.trim() !== '') {
      const name = v.color.trim();
      const hex = (v.colorHex && v.colorHex.trim() !== '') ? v.colorHex.trim() : '#1a1a1a';
      if (!colorMap.has(name)) {
        colorMap.set(name, hex);
      }
    }
  });

  const dynamicColors = Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  const [selectedColor, setSelectedColor] = useState<string | null>(
    dynamicColors.length > 0 ? dynamicColors[0].name : null
  );

  useEffect(() => {
    if (dynamicColors.length > 0 && (!selectedColor || !colorMap.has(selectedColor))) {
      setSelectedColor(dynamicColors[0].name);
    }
  }, [product.variants]);

  // Dynamically map sizes from admin variants
  const dynamicSizesList = availableSizes.map(s => {
    const matchingVariants = adminVariants.filter((v: any) => 
      v.size === s.label && (!selectedColor || v.color?.trim() === selectedColor)
    );
    const totalInv = matchingVariants.reduce((sum: number, v: any) => {
      const inv = v.inventory;
      return sum + (inv ? Math.max(0, inv.totalStock - inv.reservedStock - inv.soldStock) : 0);
    }, 0);
    
    return {
      label: s.label,
      available: matchingVariants.length > 0 ? totalInv > 0 : s.available,
      hasVariant: matchingVariants.length > 0
    };
  });

  const selectedVariantData = adminVariants.find((v: any) => {
    const matchSize = selectedSize ? v.size === selectedSize : true;
    const matchColor = selectedColor ? (v.color?.trim() === selectedColor) : true;
    return matchSize && matchColor;
  }) || adminVariants.find((v: any) => v.size === selectedSize) || adminVariants[0];

  const baseVariant = selectedVariantData || adminVariants[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : 0;
  const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : null;

  const hasDiscount = comparePrice != null && comparePrice > price && price > 0;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  const availableStock = selectedVariantData?.inventory 
    ? Math.max(0, selectedVariantData.inventory.totalStock - selectedVariantData.inventory.soldStock - selectedVariantData.inventory.reservedStock)
    : 99;

  // Centralized Launch & Purchase Mode Engine
  const purchaseMode = getEffectivePurchaseMode(product);
  const isPreBookingMode = purchaseMode === PurchaseMode.PRE_BOOK;
  const offerDetails = getPreBookingOfferDetails(product, price);
  const displaySellingPrice = offerDetails.effectivePrice;
  const displayComparePrice = offerDetails.isOfferActive ? price : comparePrice;
  const showPreBookingOfferBadge = offerDetails.isOfferActive && offerDetails.savingsBadgeText;

  // Single Synchronized Countdown Engine
  const countdown = useSynchronizedCountdown(product.launchDateTime);

  // Filter gallery images dynamically
  const colorFilteredImages = selectedColor
    ? product.images?.filter((img: any) => img.alt && img.alt.toLowerCase().includes(selectedColor.toLowerCase()))
    : [];

  const activeGalleryUrls: string[] = (colorFilteredImages && colorFilteredImages.length > 0)
    ? colorFilteredImages.map((i: any) => i.url)
    : (product.images?.map((i: any) => i.url) || ['/images/placeholder.svg']);

  const activeCoverImage = (colorFilteredImages && colorFilteredImages.length > 0)
    ? colorFilteredImages[0].url
    : (product.frontImageUrl || coverImage || activeGalleryUrls[0]);

  // Mobile vertical gallery — array of per-frame refs for IntersectionObserver
  const [activeMobileImageIdx, setActiveMobileImageIdx] = useState(0);
  const mobileFrameRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Size chart entries extraction
  const sizeChartEntries: SizeChartEntry[] = (() => {
    if (adminVariants.length > 0) {
      return adminVariants.map((v: any) => ({
        size: v.color ? `${v.color} - ${v.size}` : v.size,
        alphaSize: v.alphaSize,
        numericSize: v.numericSize,
        color: v.color,
        measurements: v.measurements || null,
      }));
    }
    const productEntries = (product.sizeChart as any)?.entries;
    if (Array.isArray(productEntries) && productEntries.length > 0) {
      return productEntries;
    }
    return [];
  })();

  const hasSizeChart = true; // Always expose existing size chart system cleanly

  const { requireAuth } = useAuth();
  const { addToCart, beginInstantCheckout, toggleWishlist, isInWishlist, toggleCompare, isInCompare, showToast } = useStore();
  const wishlisted = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  // PRE-BOOKING LUXURY 6-ITEM ATELIER COLLECTOR PRIVILEGES (3x2 GRID)
  const privilegeItems = [
    {
      num: '01',
      icon: <ShieldCheck size={16} strokeWidth={1.5} />,
      title: 'Allocated Before Public Release',
      desc: 'Your unit is physically ring-fenced in our atelier and held strictly under your custody from day one.',
    },
    {
      num: '02',
      icon: <Tag size={16} strokeWidth={1.5} />,
      title: 'Lock In The Private Rate',
      desc: 'Secure your preferential pre-booking price before the official public release, with no price escalation on launch.',
    },
    {
      num: '03',
      icon: <Eye size={16} strokeWidth={1.5} />,
      title: 'Private Product Reveals',
      desc: 'Gain access to private digital showcases and behind-the-scenes material exploration before public reveals.',
    },
    {
      num: '04',
      icon: <Ticket size={16} strokeWidth={1.5} />,
      title: 'The Inner Circle',
      desc: 'Receive exclusive invitations to intimate brand exhibitions, design talks and atelier open evenings.',
    },
    {
      num: '05',
      icon: <Gift size={16} strokeWidth={1.5} />,
      title: 'Collector Rewards',
      desc: 'Receive authenticated physical provenance cards and surprise archival gifts included with your delivery.',
    },
    {
      num: '06',
      icon: <Trophy size={16} strokeWidth={1.5} />,
      title: 'Sponsored Brand Experiences',
      desc: 'Automatic consideration for hosted brand retreats, runway showcases and private dinners.',
    },
  ];

  // SCARCITY & ALLOCATION DYNAMIC CALCULATIONS
  const totalStockSum = adminVariants.reduce((acc: number, v: any) => acc + (v.inventory?.totalStock ?? 25), 0);
  const soldStockSum = adminVariants.reduce((acc: number, v: any) => acc + (v.inventory?.soldStock ?? 0), 0);
  const reservedStockSum = adminVariants.reduce((acc: number, v: any) => acc + (v.inventory?.reservedStock ?? 0), 0);
  const allocatedCount = soldStockSum + reservedStockSum;
  const editionTotal = totalStockSum > 0 ? totalStockSum : 400;
  const remainingCount = Math.max(0, editionTotal - allocatedCount);
  const editionNumber = Math.min(editionTotal, Math.max(1, allocatedCount + 1));
  const scarcityPercent = Math.min(100, Math.max(0, Math.round((remainingCount / editionTotal) * 100)));

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gm_recently_viewed');
      let ids = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(ids)) ids = [];
      ids = [product.id, ...ids.filter((id: string) => id !== product.id)];
      localStorage.setItem('gm_recently_viewed', JSON.stringify(ids.slice(0, 8)));
    } catch (e) {}

    if (product) {
      try {
        const gaItem = formatGA4Item(product, selectedSize || undefined, 1);
        trackViewItem(gaItem);
      } catch (e) {}
    }
  }, [product, selectedSize]);

  // Scroll listener — also dismisses scroll hint once user has scrolled meaningfully
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
      // Dismiss scroll hint after user has scrolled past the first gallery frame
      if (scrollY > 80) setShowScrollHint(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver: show floating mobile CTA only when product details are in viewport
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;
    if (!productDetailRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileCta(entry.isIntersecting);
        if (entry.isIntersecting) setShowScrollHint(false);
      },
      { root: null, threshold: 0.1 }
    );

    observer.observe(productDetailRef.current);
    return () => observer.disconnect();
  }, [productDetailRef.current]);

  // IntersectionObserver: track which gallery frame is in view (updates image counter)
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;

    const frames = mobileFrameRefs.current.filter(Boolean) as HTMLDivElement[];
    if (frames.length === 0) return;

    const frameObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = frames.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) {
              setActiveMobileImageIdx(idx);
              // Dismiss hint when user passes first frame
              if (idx > 0) setShowScrollHint(false);
            }
          }
        });
      },
      // Frame is "active" when it occupies >50% of the viewport
      { threshold: 0.5 }
    );

    frames.forEach((frame) => frameObserver.observe(frame));
    return () => frameObserver.disconnect();
  }, [activeGalleryUrls.length]);

  // 100% Deterministic Bidirectional Continuous Scroll Reel Hook (60 FPS GPU Translation)
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 1023) return;

    const totalImages = activeGalleryUrls.length;
    if (totalImages <= 1) return;

    const maxProgress = totalImages - 1;

    const handleWheel = (e: WheelEvent) => {
      const scrollY = window.scrollY;

      // If document is scrolled down past top hero section:
      if (scrollY > 15) {
        if (e.deltaY < 0 && scrollY <= 30 && reelProgressRef.current > 0) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'instant' as any });
          const delta = (e.deltaY / 400) * 0.8;
          const next = Math.max(0, Math.min(maxProgress, reelProgressRef.current + delta));
          reelProgressRef.current = next;
          setReelProgress(next);
        }
        return;
      }

      // When window.scrollY <= 15 (Top Hero Section):
      if (e.deltaY > 0) {
        // Scrolling DOWN -> Advance continuous reel smoothly
        if (reelProgressRef.current < maxProgress) {
          e.preventDefault();
          const delta = (e.deltaY / 400) * 0.8;
          const next = Math.min(maxProgress, Math.max(0, reelProgressRef.current + delta));
          reelProgressRef.current = next;
          setReelProgress(next);
        }
      } else if (e.deltaY < 0) {
        // Scrolling UP -> Retreat continuous reel smoothly
        if (reelProgressRef.current > 0) {
          e.preventDefault();
          const delta = (e.deltaY / 400) * 0.8;
          const next = Math.max(0, Math.min(maxProgress, reelProgressRef.current + delta));
          reelProgressRef.current = next;
          setReelProgress(next);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeGalleryUrls.length]);

  const handleAddToCart = () => {
    if (isPreBookingMode) return; // Add to Bag disabled for Pre-Booking products
    if (!selectedSize) {
      if (typeof window !== 'undefined' && window.innerWidth <= 1023) {
        setMobileSheetAction('add');
        setMobileSheetOpen(true);
        return;
      }
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart(product, selectedSize, quantity, selectedColor || undefined);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      if (typeof window !== 'undefined' && window.innerWidth <= 1023) {
        setMobileSheetAction('buy');
        setMobileSheetOpen(true);
        return;
      }
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const orderType = isPreBookingMode ? 'PRE_BOOKING' : 'REGULAR';
    requireAuth(
      'checkout',
      () => {
        beginInstantCheckout({ product, size: selectedSize, quantity, color: selectedColor || undefined, orderType });
        router.push('/checkout');
      },
      { type: 'checkout', product, size: selectedSize, quantity, color: selectedColor || undefined, orderType }
    );
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      showToast('Link Copied', 'Vault product link copied to clipboard.');
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (e) {}
  };

  const currentDisplayIndex = Math.min(activeGalleryUrls.length, Math.floor(reelProgress) + 1);

  return (
    <div
      className={styles.pageContainer}
      style={isPreBookingMode && showMobileCta
        ? { paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }
        : undefined
      }
    >
      
      {/* =======================================================
          MOBILE VERTICAL GALLERY STACK (PRE-BOOKING ONLY)
          Each image occupies one full mobile viewport as an
          independent cinematic frame. Page scroll advances images.
          NO horizontal swipe. NO carousel. NO overflow-x.
          ======================================================= */}
      {isPreBookingMode && (
        <div className={styles.mobileVerticalGallery}>
          {activeGalleryUrls.map((url: string, idx: number) => (
            <div
              key={url + idx}
              className={styles.mobileGalleryFrame}
              ref={(el) => { mobileFrameRefs.current[idx] = el; }}
            >
              <img
                src={url}
                alt={`${product.name} Gallery ${idx + 1}`}
                className={styles.mobileGalleryFrameImage}
                loading={idx === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />

              {/* Per-frame image counter — updates naturally as frames scroll into view */}
              {activeGalleryUrls.length > 1 && (
                <div className={styles.mobileGalleryCounter}>
                  {String(idx + 1).padStart(2, '0')} — {String(activeGalleryUrls.length).padStart(2, '0')}
                </div>
              )}

              {/* "Scroll for Details" hint — ONLY on the first frame, fades after scroll */}
              {idx === 0 && showScrollHint && (
                <div className={styles.mobileScrollHint} aria-hidden="true">
                  SCROLL FOR DETAILS
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DESKTOP HERO: 3-COLUMN VIEWPORT LAYOUT WITH SYMMETRICAL 50/50 IMAGES */}
      <section className={styles.heroScrollSection}>
        
        <div className={styles.heroStickyContainer}>
          
          <div className={isPreBookingMode ? styles.twoColPreBookingGrid : styles.threeColGrid}>
            
            {/* COLUMN 1: LEFT (STATIC COVER IMAGE - EXACT MATCHING ASPECT RATIO) - ONLY FOR LIVE PRODUCTS */}
            {!isPreBookingMode && (
              <div className={styles.colLeft}>
                
                {/* ELEGANT LUXURY GARMENT LABEL RIBBON */}
                <div className={styles.ribbonWrap}>
                  <div className={styles.ribbonCloth}>
                    <span className={styles.ribbonText}>Exclusive</span>
                  </div>
                </div>

                <img
                  src={activeCoverImage}
                  alt={`${product.name} Identity`}
                  className={styles.staticImage}
                />
              </div>
            )}

            {/* PRIMARY MEDIA GALLERY (CONTINUOUS REEL — PROMOTED TO LEFT COLUMN FOR PRE-BOOKING) */}
            <div className={isPreBookingMode ? styles.colPreBookingGallery : styles.colCenter}>
              <div className={styles.reelContainer}>
                <div
                  className={styles.galleryReelStack}
                  style={{ transform: `translate3d(0, -${reelProgress * 100}%, 0)` }}
                >
                  {activeGalleryUrls.map((url: string, idx: number) => (
                    <img
                      key={url + idx}
                      src={url}
                      alt={`${product.name} Gallery ${idx + 1}`}
                      className={styles.galleryReelItem}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.galleryCounterBadge}>
                0{currentDisplayIndex} — 0{activeGalleryUrls.length}
              </div>
            </div>

            {/* PRODUCT INFO COLUMN — PRE-BOOKING LUXURY RESERVATION PANEL */}
            <div
              ref={isPreBookingMode ? productDetailRef : undefined}
              className={isPreBookingMode ? styles.colRightPreBooking : styles.colRight}
            >
              {isPreBookingMode ? (
                <div className={styles.preBookPanel}>
                  {/* 2. TOP EYEBROW */}
                  <div className={styles.preBookEyebrow}>
                    <span className={styles.preBookEyebrowDot}>●</span>
                    <span>PRE BOOKING ALLOCATION</span>
                  </div>

                  {/* 3. PRODUCT TITLE + METADATA */}
                  <div className={styles.preBookTitleBlock}>
                    <h1 className={styles.preBookTitle}>
                      {product.name}
                      <span className={styles.preBookInlineMeta}>
                        <span className={styles.preBookMetaDivider}>|</span>
                        <span>{product.category?.name || 'Tees'}</span>
                        <span className={styles.preBookMetaDot}>•</span>
                        <span>{product.collectionName || 'essentials'}</span>
                      </span>
                    </h1>
                  </div>

                  {/* 4. DESCRIPTION */}
                  <p className={styles.preBookDesc}>
                    {product.shortDesc || 'Archival heavyweight cotton silhouette engineered with dropped shoulders and relaxed drape.'}
                  </p>

                  {/* 5. PRICE */}
                  <div className={styles.preBookPriceRow}>
                    <span className={styles.preBookPriceCurrent}>₹{displaySellingPrice.toLocaleString('en-IN')}</span>
                    {(displayComparePrice && displayComparePrice > displaySellingPrice) && (
                      <span className={styles.preBookPriceOld}>₹{displayComparePrice.toLocaleString('en-IN')}</span>
                    )}
                    {showPreBookingOfferBadge ? (
                      <span className={styles.preBookDiscountBadge}>{offerDetails.savingsBadgeText || 'PRE BOOK & SAVE 10%'}</span>
                    ) : (
                      hasDiscount && <span className={styles.preBookDiscountBadge}>{discountPercent}% OFF</span>
                    )}
                  </div>

                  {/* 6. DIVIDER */}
                  <div className={styles.preBookDivider} />

                  {/* Dynamic Color Variants (If Configured in Admin) */}
                  {dynamicColors.length > 0 && (
                    <div className={styles.preBookColorSection}>
                      <div className={styles.preBookSectionHeader}>
                        <span className={styles.preBookSectionLabel}>COLOR:</span>
                        <span className={styles.preBookColorVal}>{selectedColor}</span>
                      </div>
                      <div className={styles.preBookColorSwatches}>
                        {dynamicColors.map((c) => {
                          const isSelected = selectedColor === c.name;
                          return (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => setSelectedColor(c.name)}
                              className={`${styles.preBookColorDot} ${isSelected ? styles.preBookColorDotActive : ''}`}
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                              aria-label={`Select color ${c.name}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 7. SIZE SECTION */}
                  <div className={styles.preBookSizeSection}>
                    <div className={styles.preBookSectionHeader}>
                      <span className={styles.preBookSectionLabel}>SIZE:</span>
                      {hasSizeChart && (
                        <button
                          type="button"
                          onClick={() => setIsSizeChartOpen(true)}
                          className={styles.preBookSizeChartBtn}
                        >
                          <Ruler size={11} strokeWidth={1.5} />
                          <span>SIZE CHART →</span>
                        </button>
                      )}
                    </div>
                    <div className={styles.preBookSizeGrid}>
                      {dynamicSizesList.map((s) => {
                        const isSelected = selectedSize === s.label;
                        const isDisabled = !s.available;
                        return (
                          <button
                            key={s.label}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              setSelectedSize(s.label);
                              setSizeError(false);
                            }}
                            className={`${styles.preBookSizeBtn} ${isSelected ? styles.preBookSizeBtnActive : ''} ${isDisabled ? styles.preBookSizeBtnDisabled : ''}`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                    {sizeError && (
                      <p className={styles.preBookSizeError}>
                        Please select a size to proceed
                      </p>
                    )}
                  </div>

                  {/* 8. QUANTITY */}
                  <div className={styles.preBookQtySection}>
                    <span className={styles.preBookSectionLabel}>QUANTITY:</span>
                    <div className={styles.preBookQtyControl}>
                      <button
                        type="button"
                        className={styles.preBookQtyBtn}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} strokeWidth={1.8} />
                      </button>
                      <span className={styles.preBookQtyVal}>{quantity}</span>
                      <button
                        type="button"
                        className={styles.preBookQtyBtn}
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>

                  {/* 9. COUNTDOWN / ALLOCATION MODULE */}
                  {!countdown.isCompleted && (
                    <div className={styles.preBookReservationCard}>
                      {/* Module Header */}
                      <div className={styles.reservationCardHeader}>
                        <div className={styles.reservationLaunchesIn}>
                          <span className={styles.reservationDot}>●</span>
                          <span>LAUNCHES IN</span>
                        </div>
                        <div className={styles.reservationHeaderBadgeGroup}>
                          {product.maxPreBooking != null && (
                            <span className={styles.reservationAllocationCountBadge}>
                              {Math.max(0, Number(product.maxPreBooking) - Number(product.currentPreBookings || 0))} Allocations Left
                            </span>
                          )}
                          <span className={styles.reservationSpecialBadge}>PRE-BOOK SPECIAL</span>
                        </div>
                      </div>

                      {/* Module Body */}
                      <div className={styles.reservationCardBody}>
                        {/* Left: Cohesive Countdown Instrument */}
                        <div className={styles.countdownStack}>
                          <div className={styles.countdownDigitBlock}>
                            <span className={styles.countdownDigits}>{String(countdown.days).padStart(2, '0')}</span>
                            <span className={styles.countdownDigitLabel}>DAYS</span>
                          </div>
                          <div className={styles.countdownVertLine} />
                          <div className={styles.countdownDigitBlock}>
                            <span className={styles.countdownDigits}>{String(countdown.hours).padStart(2, '0')}</span>
                            <span className={styles.countdownDigitLabel}>HRS</span>
                          </div>
                          <div className={styles.countdownVertLine} />
                          <div className={styles.countdownDigitBlock}>
                            <span className={styles.countdownDigits}>{String(countdown.minutes).padStart(2, '0')}</span>
                            <span className={styles.countdownDigitLabel}>MINS</span>
                          </div>
                          <div className={styles.countdownVertLine} />
                          <div className={styles.countdownDigitBlock}>
                            <span className={styles.countdownDigits}>{String(countdown.seconds).padStart(2, '0')}</span>
                            <span className={styles.countdownDigitLabel}>SECS</span>
                          </div>
                        </div>

                        {/* Vertical Center Divider */}
                        <div className={styles.reservationCenterDivider} />

                        {/* Right: Dispatch Window & Trust Guarantees */}
                        <div className={styles.reservationRightCol}>
                          <div className={styles.dispatchBox}>
                            <span className={styles.dispatchHeading}>EXPECTED DISPATCH</span>
                            <span className={styles.dispatchSubtext}>
                              {formatExpectedDispatchText(product.expectedDispatch, product.customExpectedDispatch) || 'Within 24 Hours of Launch'}
                            </span>
                          </div>

                          <div className={styles.trustCheckList}>
                            <div className={styles.trustCheckItem}>
                              <span className={styles.trustCheckIcon}>🔒</span>
                              <span>Allocation reserved after payment</span>
                            </div>
                            <div className={styles.trustCheckItem}>
                              <span className={styles.trustCheckIcon}>⌑</span>
                              <span>Reservation closes automatically</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Module Bottom Editorial Links */}
                      <div className={styles.reservationCardFooter}>
                        <button
                          type="button"
                          onClick={() => setIsBenefitsModalOpen(true)}
                          className={styles.reservationFooterLink}
                        >
                          WHY PRE BOOK? →
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsTermsModalOpen(true)}
                          className={styles.reservationFooterLinkSecondary}
                        >
                          TERMS & CONDITIONS →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 10. CTA */}
                  <div className={styles.preBookCtaWrap}>
                    <button
                      type="button"
                      className={styles.preBookCtaButton}
                      onClick={handleBuyNow}
                      id="vault-prebook-cta"
                      disabled={availableStock === 0}
                    >
                      <span className={styles.preBookCtaLabel}>PRE BOOK NOW</span>
                      <span className={styles.preBookCtaArrow}>→</span>
                    </button>

                    {/* 11. CTA SUPPORTING MESSAGE */}
                    <p className={styles.preBookCtaSupportMsg}>
                      <ShieldCheck size={13} strokeWidth={1.8} className={styles.preBookCtaSupportIcon} />
                      <span>Secure your allocation before public launch</span>
                    </p>
                  </div>

                  {/* 12. SECONDARY ACTIONS */}
                  <div className={styles.preBookSecondaryActions}>
                    <button
                      type="button"
                      className={`${styles.preBookActionLink} ${wishlisted ? styles.preBookActionLinkActive : ''}`}
                      onClick={() => requireAuth('wishlist', () => toggleWishlist(product), { type: 'wishlist', product })}
                    >
                      <Heart size={12} fill={wishlisted ? 'currentColor' : 'none'} strokeWidth={1.7} />
                      <span>WISHLIST</span>
                    </button>

                    <span className={styles.preBookActionDivider}>|</span>

                    <button
                      type="button"
                      className={`${styles.preBookActionLink} ${inCompare ? styles.preBookActionLinkActive : ''}`}
                      onClick={() => toggleCompare(product)}
                    >
                      <ArrowLeftRight size={12} strokeWidth={1.7} />
                      <span>COMPARE</span>
                    </button>

                    <span className={styles.preBookActionDivider}>|</span>

                    <button
                      type="button"
                      className={styles.preBookActionLink}
                      onClick={handleShare}
                    >
                      <Share2 size={12} strokeWidth={1.7} />
                      <span>{copiedShare ? 'COPIED' : 'SHARE'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Non-prebooking regular Exclusive Rack product panel */
                <>
                  {/* Eyebrow */}
                  <div className={styles.preBookEyebrowRow}>
                    <span className={styles.eyebrowDot}>•</span>
                    <span className={styles.collectionTag}>
                      {product.collectionName || 'SIGNATURE COLLECTION'}
                    </span>
                  </div>

                  {/* Product Name */}
                  <h1 className={styles.productTitle}>{product.name}</h1>

                  {/* 2-Column Category & Collection Metadata */}
                  <div className={styles.metaTwoCol}>
                    <div>
                      <div className={styles.metaBlockLabel}>CATEGORY</div>
                      <div className={styles.metaBlockVal}>{product.category?.name || 'Oversized Tees'}</div>
                    </div>
                    <div>
                      <div className={styles.metaBlockLabel}>COLLECTION</div>
                      <div className={styles.metaBlockVal}>{product.collectionName || 'Signature Collection'}</div>
                    </div>
                  </div>

                  {/* Concise Teaser Description */}
                  <p className={styles.shortDesc}>
                    {product.shortDesc || 'A tribute to stillness. Inspired by the quiet depth of the ocean — crafted for those who move with purpose and stay rooted in their intent.'}
                  </p>

                  {/* Price Section */}
                  <div className={styles.priceBox}>
                    <span className={styles.sellingPrice}>₹{displaySellingPrice.toLocaleString('en-IN')}</span>
                    {(displayComparePrice && displayComparePrice > displaySellingPrice) && (
                      <span className={styles.comparePrice}>₹{displayComparePrice.toLocaleString('en-IN')}</span>
                    )}
                    {hasDiscount && <span className={styles.discountBadge}>{discountPercent}% OFF</span>}
                  </div>

                  {/* Dynamic Variant Selectors */}
                  <div className={styles.selectorRow}>
                    {dynamicColors.length > 0 && (
                      <div className={styles.selectorBlock}>
                        <div className={styles.selectorLabelRow}>
                          <span className={styles.selectorTitle}>COLOR:</span>
                          <span className={styles.selectedValName}>{selectedColor}</span>
                        </div>
                        <div className={styles.colorSwatches}>
                          {dynamicColors.map((c) => {
                            const isSelected = selectedColor === c.name;
                            return (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() => setSelectedColor(c.name)}
                                className={`${styles.colorDotBtn} ${isSelected ? styles.colorDotBtnActive : ''}`}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                                aria-label={`Select color ${c.name}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className={styles.selectorBlock}>
                      <div className={styles.selectorLabelRow}>
                        <span className={styles.selectorTitle}>SIZE:</span>
                        <button
                          type="button"
                          onClick={() => setIsSizeChartOpen(true)}
                          className={styles.sizeChartLinkBtn}
                        >
                          <Ruler size={11} />
                          <span>SIZE CHART</span>
                        </button>
                      </div>
                      <div className={styles.sizeBoxes}>
                        {dynamicSizesList.map((s) => {
                          const isSelected = selectedSize === s.label;
                          const isDisabled = !s.available;
                          return (
                            <button
                              key={s.label}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => {
                                setSelectedSize(s.label);
                                sizeError && setSizeError(false);
                              }}
                              className={`${styles.sizeBoxBtn} ${isSelected ? styles.sizeBoxBtnActive : ''} ${isDisabled ? styles.sizeBoxBtnDisabled : ''}`}
                            >
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {sizeError && (
                    <p style={{ color: '#ff6b6b', fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Please select a size to proceed
                    </p>
                  )}

                  {/* Quantity Selector */}
                  <div className={styles.quantitySection}>
                    <div className={styles.selectorTitle} style={{ marginBottom: '4px' }}>QUANTITY</div>
                    <div className={styles.quantityBoxRow}>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className={styles.qtyVal}>{quantity}</span>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* CTA Block */}
                  <div className={styles.ctaContainerBlock}>
                    <div className={styles.ctaHorizontalRow}>
                      <button
                        type="button"
                        className={styles.buyNowBtnCompact}
                        onClick={handleBuyNow}
                        id="vault-buy-now"
                        disabled={availableStock === 0}
                      >
                        <span className={styles.ctaText}>BUY NOW</span>
                        <span className={styles.ctaArrow}>→</span>
                      </button>

                      <button
                        type="button"
                        className={styles.addToBagSquareBtn}
                        onClick={handleAddToCart}
                        id="vault-add-to-bag"
                        disabled={availableStock === 0}
                        title="Add to Bag"
                        aria-label="Add to Bag"
                      >
                        <ShoppingBag size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Supporting Actions */}
                  <div className={styles.iconRowThree}>
                    <button
                      type="button"
                      className={`${styles.iconRowBtn} ${wishlisted ? styles.iconRowBtnActive : ''}`}
                      onClick={() => requireAuth('wishlist', () => toggleWishlist(product), { type: 'wishlist', product })}
                    >
                      <Heart size={12} fill={wishlisted ? 'currentColor' : 'none'} />
                      <span>WISHLIST</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.iconRowBtn} ${inCompare ? styles.iconRowBtnActive : ''}`}
                      onClick={() => toggleCompare(product)}
                    >
                      <ArrowLeftRight size={12} />
                      <span>COMPARE</span>
                    </button>

                    <button
                      type="button"
                      className={styles.iconRowBtn}
                      onClick={handleShare}
                    >
                      <Share2 size={12} />
                      <span>{copiedShare ? 'COPIED' : 'SHARE'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          UNLOCKED PAGE FLOW (SINGLE BROWSER SCROLLBAR)
          ================================================== */}
      <div className={styles.vaultUnlockedContent}>
        
        {/* REDESIGNED FULL-WIDTH EDITORIAL EXCLUSIVE RACK ALLOCATION DASHBOARD */}
        <section className={styles.fullWidthAllocationSection}>
          <div className={styles.allocationDashboard}>
            
            <div className={styles.allocationHeaderRow}>
              <div className={styles.allocationTitleGroup}>
                <Award size={16} color="#c8a46a" />
                <span className={styles.allocationTitleText}>EXCLUSIVE RACK ALLOCATION</span>
              </div>
              <span className={styles.allocationEditionTag}>
                EDITION {editionNumber} / {editionTotal}
              </span>
            </div>

            {/* 3 LARGE EDITORIAL STATISTIC COLUMNS */}
            <div className={styles.editorialStatsThreeCol}>
              <div className={styles.statColBlock}>
                <span className={styles.statColLabel}>AVAILABLE</span>
                <div className={styles.statColNumberRow}>
                  <span className={styles.statColBigNum}>{remainingCount}</span>
                  <span className={styles.statColUnit}>PCS</span>
                </div>
              </div>

              <div className={styles.statColBlock}>
                <span className={styles.statColLabel}>SOLD</span>
                <div className={styles.statColNumberRow}>
                  <span className={styles.statColBigNum}>{allocatedCount}</span>
                  <span className={styles.statColUnit}>PCS</span>
                </div>
              </div>

              <div className={styles.statColBlock}>
                <span className={styles.statColLabel}>TOTAL</span>
                <div className={styles.statColNumberRow}>
                  <span className={styles.statColBigNum}>{editionTotal}</span>
                  <span className={styles.statColUnit}>PCS</span>
                </div>
              </div>
            </div>

            {/* FULL-WIDTH THIN GOLD PROGRESS BAR */}
            <div className={styles.progressVisualizationWrap}>
              <div className={styles.progressTrackLine}>
                <div
                  className={styles.progressFillGold}
                  style={{ width: `${scarcityPercent}%` }}
                />
              </div>
              <div className={styles.progressLabelMeta}>
                <span>{scarcityPercent}% REMAINING</span>
                <span>{100 - scarcityPercent}% ALLOCATED</span>
              </div>
            </div>

            {/* 5-COLUMN HORIZONTAL EDITORIAL STATUS TAGS */}
            <div className={styles.fiveTagEditorialRow}>
              <div className={styles.editorialTagCard}>
                <span className={styles.editorialTagLabel}>ALLOCATION TYPE</span>
                <span className={styles.editorialTagVal}>Limited Allocation</span>
              </div>

              <div className={styles.editorialTagCard}>
                <span className={styles.editorialTagLabel}>RESTOCKING</span>
                <span className={styles.editorialTagVal}>No Restocking</span>
              </div>

              <div className={styles.editorialTagCard}>
                <span className={styles.editorialTagLabel}>CURATION</span>
                <span className={styles.editorialTagVal}>Private Collection</span>
              </div>

              <div className={styles.editorialTagCard}>
                <span className={styles.editorialTagLabel}>SERIALISATION</span>
                <span className={styles.editorialTagVal}>Hand Numbered</span>
              </div>

              <div className={styles.editorialTagCard}>
                <span className={styles.editorialTagLabel}>AUTHENTICITY</span>
                <span className={styles.editorialTagVal}>Edition Verified</span>
              </div>
            </div>

          </div>
        </section>

        {/* ==================================================
            WHY PRE BOOK? PRIVATE ALLOCATION PRIVILEGES SECTION (3x2 EDITORIAL GRID)
            ================================================== */}
        {isPreBookingMode && (
          <section className={styles.preBookingPrivilegesSection}>
            <div className={styles.privilegesContainer}>
              <div className={styles.privilegesHeader}>
                <span className={styles.privilegesEyebrow}>
                  PRE-BOOKING PRIVILEGES
                </span>
                <h2 className={styles.privilegesTitle}>
                  WHY PRE BOOK WITH GODSMOVE?
                </h2>
                <p className={styles.privilegesSubtitle}>
                  Direct atelier reservations engineered for decisive collectors before public release.
                </p>
                <div className={styles.privilegesRule} />
              </div>

              {/* Perfect 3-Column x 2-Row Editorial Grid */}
              <div className={styles.privilegesGridThreeCol}>
                {privilegeItems.map((item, idx) => (
                  <div key={idx} className={styles.privilegeItem}>
                    <div className={styles.privilegeItemTop}>
                      <span className={styles.privilegeIndex}>{item.num}</span>
                      <span className={styles.privilegeBareIcon}>{item.icon}</span>
                    </div>
                    <h3 className={styles.privilegeTitle}>{item.title}</h3>
                    <p className={styles.privilegeDesc}>{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Subtle Editorial Text Links (No Heavy Buttons) */}
              <div className={styles.privilegesFooter}>
                <button
                  type="button"
                  onClick={() => setIsBenefitsModalOpen(true)}
                  className={styles.privilegeTextLink}
                >
                  <span>Explore Full Pre-Booking Benefits</span>
                  <span className={styles.privilegeLinkArrow}>→</span>
                </button>
                <span className={styles.privilegeLinkDivider}>•</span>
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className={styles.privilegeTextLink}
                >
                  <span>Terms & Dispatch Policy</span>
                  <span className={styles.privilegeLinkArrow}>→</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* EDITORIAL DETAILS & SYMBOLISM — UNIVERSAL PRODUCT STORYTELLING */}
        <ProductStorytelling product={product} />

      </div>

      {/* FIXED FLOATING MOBILE PRE-BOOK CTA BAR — visible only when product detail section is in viewport */}
      {isPreBookingMode ? (
        <div className={`${styles.mobileFloatingCtaBar} ${showMobileCta ? styles.mobileFloatingCtaBarVisible : ''}`}>
          <button
            type="button"
            className={styles.mobileFloatingCtaBtn}
            onClick={handleBuyNow}
            disabled={availableStock === 0}
            id="mobile-vault-prebook-cta"
          >
            <span className={styles.mobileFloatingCtaLabel}>
              {availableStock === 0 ? 'ALLOCATION EXHAUSTED' : 'PRE BOOK NOW'}
            </span>
            <span className={styles.mobileFloatingCtaArrow}>→</span>
          </button>
        </div>
      ) : (
        /* Regular live product mobile sticky bottom bar */
        <div className={styles.mobileStickyBottomBar}>
          <button
            type="button"
            className={`${styles.mobileBarWishlist} ${wishlisted ? styles.wishlisted : ''}`}
            onClick={() => requireAuth('wishlist', () => toggleWishlist(product), { type: 'wishlist', product })}
            aria-label="Wishlist"
          >
            <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          <button
            type="button"
            className={styles.mobileBarBuyNow}
            onClick={handleBuyNow}
            disabled={availableStock === 0}
          >
            BUY NOW
          </button>

          <button
            type="button"
            className={styles.mobileBarAddToBag}
            onClick={handleAddToCart}
            disabled={availableStock === 0}
            aria-label="Add to Bag"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      )}

      {/* Pre Booking Modals */}
      <PreBookingBenefitsModal
        isOpen={isBenefitsModalOpen}
        onClose={() => setIsBenefitsModalOpen(false)}
        product={product}
      />

      <PreBookingTermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        product={product}
      />

      {/* Size Chart Modal */}
      {hasSizeChart && (
        <SizeChartModal
          isOpen={isSizeChartOpen}
          onClose={() => setIsSizeChartOpen(false)}
          productName={product.name}
          entries={sizeChartEntries}
        />
      )}

      {/* Mobile Variant Quick Add Sheet */}
      <MobileQuickAddSheet
        isOpen={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        productName={product.name}
        sizes={availableSizes.map(s => ({ size: s.label, available: s.available }))}
        addingSize={null}
        onAddSize={(size) => {
          setSelectedSize(size);
          setSizeError(false);
          if (mobileSheetAction === 'buy') {
            beginInstantCheckout({ product, size, quantity, color: selectedColor || undefined });
            router.push('/checkout');
          } else {
            addToCart(product, size, quantity, selectedColor || undefined);
          }
        }}
      />
    </div>
  );
}
