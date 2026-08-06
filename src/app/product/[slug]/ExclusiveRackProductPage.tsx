'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Plus
} from 'lucide-react';
import SizeChartModal, { type SizeChartEntry } from '@/components/SizeChartModal';
import RecentlyViewed from '@/components/RecentlyViewed';
import MobileQuickAddSheet from '@/components/MobileQuickAddSheet';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import { formatGA4Item, trackViewItem } from '@/lib/gtag-ecommerce';
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

  // Proportional Continuous Reel Scroll Progress (0 to totalImages - 1)
  const [reelProgress, setReelProgress] = useState(0);
  const reelProgressRef = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const hasSizeChart = sizeChartEntries.some(
    (e: any) => e.measurements && typeof e.measurements === 'object' && Object.keys(e.measurements).length > 0
  );

  const { requireAuth } = useAuth();
  const { addToCart, beginInstantCheckout, toggleWishlist, isInWishlist, toggleCompare, isInCompare, showToast } = useStore();
  const wishlisted = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  // SCARCITY & ALLOCATION DYNAMIC CALCULATIONS
  const totalStockSum = adminVariants.reduce((acc: number, v: any) => acc + (v.inventory?.totalStock ?? 25), 0);
  const soldStockSum = adminVariants.reduce((acc: number, v: any) => acc + (v.inventory?.soldStock ?? 0), 0);
  const reservedStockSum = adminVariants.reduce((acc: number, v: any) => acc + (v.inventory?.reservedStock ?? 0), 0);
  const allocatedCount = soldStockSum + reservedStockSum;
  const editionTotal = totalStockSum > 0 ? totalStockSum : 100;
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

  // Scroll listener for sticky container state
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    requireAuth(
      'checkout',
      () => {
        beginInstantCheckout({ product, size: selectedSize, quantity, color: selectedColor || undefined });
        router.push('/checkout');
      },
      { type: 'checkout', product, size: selectedSize, quantity, color: selectedColor || undefined }
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
    <div className={styles.pageContainer}>
      
      {/* MOBILE HERO: 100vh FULLSCREEN GALLERY */}
      <div className={styles.mobileOnlyHero}>
        <img
          src={activeGalleryUrls[Math.floor(reelProgress)] || activeCoverImage}
          alt={product.name}
          className={styles.mobileHeroImage}
        />

        <div className={styles.mobileScrollOverlay} style={{ opacity: isScrolled ? 0 : 1 }}>
          <span>Scroll for Vault Details</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* DESKTOP HERO: 3-COLUMN VIEWPORT LAYOUT WITH SYMMETRICAL 50/50 IMAGES */}
      <section className={styles.heroScrollSection}>
        
        <div className={styles.heroStickyContainer}>
          
          <div className={styles.threeColGrid}>
            
            {/* COLUMN 1: LEFT (STATIC COVER IMAGE - EXACT MATCHING ASPECT RATIO) */}
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

            {/* COLUMN 2: CENTER (CONTINUOUS REEL — NARROW 14px LUXURY SPACING) */}
            <div className={styles.colCenter}>
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

            {/* COLUMN 3: RIGHT (EDITORIAL PRODUCT INFO — RESPONSIVE & UNCONGESTED) */}
            <div className={styles.colRight}>
              
              {/* Collection Name */}
              <span className={styles.collectionTag}>
                {product.collectionName || 'SIGNATURE COLLECTION'}
              </span>

              {/* Product Name */}
              <h1 className={styles.productTitle}>{product.name}</h1>

              {/* Short Editorial Description */}
              <p className={styles.shortDesc}>
                {product.shortDesc || 'A tribute to stillness. Inspired by the quiet depth of the ocean — crafted for those who move with purpose and stay rooted in their intent.'}
              </p>

              {/* Price Row */}
              <div className={styles.priceBox}>
                <span className={styles.sellingPrice}>₹{price.toLocaleString('en-IN')}</span>
                {hasDiscount && comparePrice && (
                  <span className={styles.comparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
                )}
                {hasDiscount && (
                  <span className={styles.discountBadge}>{discountPercent}% OFF</span>
                )}
              </div>

              {/* 2-Column Metadata */}
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

              {/* Dynamic Variant Selectors Block (100% Admin Panel Synchronized) */}
              <div className={styles.selectorRow}>
                {/* Dynamic Tactile Color Swatches */}
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

                {/* Dynamic Substantial Size Boxes */}
                <div className={styles.selectorBlock}>
                  <div className={styles.selectorLabelRow}>
                    <span className={styles.selectorTitle}>SIZE:</span>
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
                            setSizeError(false);
                          }}
                          className={`${styles.sizeBoxBtn} ${isSelected ? styles.sizeBoxBtnActive : ''} ${isDisabled ? styles.sizeBoxBtnDisabled : ''}`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>

                  {hasSizeChart && (
                    <button
                      type="button"
                      onClick={() => setIsSizeChartOpen(true)}
                      className={styles.sizeChartLink}
                    >
                      <Ruler size={11} />
                      <span>SIZE CHART</span>
                    </button>
                  )}
                </div>
              </div>

              {sizeError && (
                <p style={{ color: '#ff6b6b', fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Please select a size to proceed
                </p>
              )}

              {/* Quantity Counter Box */}
              <div>
                <div className={styles.selectorTitle} style={{ marginBottom: '6px' }}>QUANTITY</div>
                <div className={styles.quantityBoxRow}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus size={11} />
                  </button>
                  <span className={styles.qtyVal}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                  >
                    <Plus size={11} />
                  </button>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className={styles.actionStack}>
                <button
                  type="button"
                  className={styles.buyNowBtn}
                  onClick={handleBuyNow}
                  id="vault-buy-now"
                  disabled={availableStock === 0}
                >
                  BUY NOW
                </button>

                <button
                  type="button"
                  className={styles.addToBagBtn}
                  onClick={handleAddToCart}
                  id="vault-add-to-bag"
                  disabled={availableStock === 0}
                >
                  <ShoppingBag size={14} />
                  ADD TO BAG
                </button>
              </div>

              {/* 3-Column Icon Actions Row */}
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

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          UNLOCKED PAGE FLOW (SINGLE BROWSER SCROLLBAR)
          ================================================== */}
      <div className={styles.vaultUnlockedContent}>
        
        {/* EXCLUSIVE RACK OWNERSHIP CERTIFICATE PANEL */}
        <section className={styles.certBoxSection}>
          <div className={styles.certBox}>
            
            <div className={styles.certHeader}>
              <div className={styles.certHeaderTitle}>
                <Award size={14} color="#c8a46a" />
                <span>EXCLUSIVE RACK ALLOCATION</span>
              </div>
              <span className={styles.certEditionText}>
                EDITION {editionNumber} / {editionTotal}
              </span>
            </div>

            {/* 3 Metric Columns: AVAILABLE | SOLD | TOTAL */}
            <div className={styles.metricsThreeCol}>
              <div className={styles.metricColItem}>
                <span className={styles.metricColLabel}>AVAILABLE</span>
                <div className={styles.metricColNum}>
                  <span>{remainingCount}</span>
                  <span className={styles.metricColPcs}>PCS</span>
                </div>
              </div>

              <div className={styles.metricColItem}>
                <span className={styles.metricColLabel}>SOLD</span>
                <div className={styles.metricColNum}>
                  <span>{allocatedCount}</span>
                  <span className={styles.metricColPcs}>PCS</span>
                </div>
              </div>

              <div className={styles.metricColItem}>
                <span className={styles.metricColLabel}>TOTAL</span>
                <div className={styles.metricColNum}>
                  <span>{editionTotal}</span>
                  <span className={styles.metricColPcs}>PCS</span>
                </div>
              </div>
            </div>

            {/* Solid Warm Gold Progress Bar */}
            <div className={styles.certProgressSection}>
              <div className={styles.certProgressTrack}>
                <div
                  className={styles.certProgressFill}
                  style={{ width: `${scarcityPercent}%` }}
                />
              </div>
              <div className={styles.certProgressLabels}>
                <span>{scarcityPercent}% REMAINING</span>
                <span>{100 - scarcityPercent}% ALLOCATED</span>
              </div>
            </div>

            {/* 3 Status Cards */}
            <div className={styles.statusThreeBox}>
              <div className={styles.statusCard}>
                <div className={styles.statusCardLabel}>ALLOCATION TYPE</div>
                <div className={styles.statusCardVal}>Limited Allocation</div>
              </div>

              <div className={styles.statusCard}>
                <div className={styles.statusCardLabel}>RESTOCKING</div>
                <div className={styles.statusCardVal}>No Restocking</div>
              </div>

              <div className={styles.statusCard}>
                <div className={styles.statusCardLabel}>UNIQUE PIECE</div>
                <div className={styles.statusCardVal}>Individually Allocated</div>
              </div>
            </div>

            {/* 4 Feature Icons Row */}
            <div className={styles.featureFourRow}>
              <div className={styles.featureIconCard}>
                <User size={14} color="#c8a46a" />
                <span className={styles.featureIconCardText}>HAND NUMBERED</span>
              </div>

              <div className={styles.featureIconCard}>
                <Award size={14} color="#c8a46a" />
                <span className={styles.featureIconCardText}>LIMITED EDITION</span>
              </div>

              <div className={styles.featureIconCard}>
                <Package size={14} color="#c8a46a" />
                <span className={styles.featureIconCardText}>PRIVATE COLLECTION</span>
              </div>

              <div className={styles.featureIconCard}>
                <ShieldCheck size={14} color="#c8a46a" />
                <span className={styles.featureIconCardText}>EDITION VERIFIED</span>
              </div>
            </div>

          </div>
        </section>

        {/* EDITORIAL DETAILS & SYMBOLISM */}
        <section className={styles.editorialSection}>
          <div className={styles.editorialHeader}>
            <span className={styles.editorialEyebrow}>DESIGN SPECIFICATION</span>
            <h2 className={styles.editorialTitle}>PRODUCT DETAILS & SYMBOLISM</h2>
            <div className={styles.editorialRule} />
          </div>

          {product.description && (
            <div className={styles.editorialNarrative}>
              <p>{product.description}</p>
            </div>
          )}

          <div className={styles.specsGrid}>
            {product.material && (
              <div className={styles.specCard}>
                <span className={styles.specTitle}>MATERIAL & FABRIC</span>
                <p className={styles.specText}>{product.material}</p>
              </div>
            )}

            {product.fit && (
              <div className={styles.specCard}>
                <span className={styles.specTitle}>SILHOUETTE & FIT</span>
                <p className={styles.specText}>{product.fit}</p>
              </div>
            )}

            {product.country && (
              <div className={styles.specCard}>
                <span className={styles.specTitle}>ORIGIN</span>
                <p className={styles.specText}>Crafted in {product.country}</p>
              </div>
            )}

            {product.washCare && (
              <div className={styles.specCard}>
                <span className={styles.specTitle}>CARE INSTRUCTIONS</span>
                <p className={styles.specText}>{product.washCare}</p>
              </div>
            )}
          </div>
        </section>

        {/* INTEGRATED RECENTLY VIEWED SECTION */}
        {profile && (
          <div className={styles.recentlyViewedVaultWrap}>
            <RecentlyViewed />
          </div>
        )}

      </div>

      {/* MOBILE FIXED BOTTOM STICKY BAR */}
      <div className={styles.mobileBottomBar}>
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
        >
          <ShoppingBag size={14} />
          ADD TO BAG
        </button>
      </div>

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
            beginInstantCheckout({ product, size, quantity });
            router.push('/checkout');
          } else {
            addToCart(product, size, quantity);
          }
        }}
      />
    </div>
  );
}
