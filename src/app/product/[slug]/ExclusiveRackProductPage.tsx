'use client';

import { useState, useEffect } from 'react';
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

  // Dynamic Scroll Progress & Image Index tracking for Cinematic Vault Reel
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Size chart entries extraction
  const sizeChartEntries: SizeChartEntry[] = (() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.map((v: any) => ({
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

  // Color Swatches Pipeline
  const rawColors = (product.variants || [])
    .map((v: any) => ({ name: v.color?.trim() || '', hex: v.colorHex?.trim() || '' }))
    .filter((c: any) => c.name !== '');

  const uniqueColorsMap = new Map<string, string>();
  for (const c of rawColors) {
    if (!uniqueColorsMap.has(c.name)) {
      uniqueColorsMap.set(c.name, c.hex);
    }
  }
  const availableColors = Array.from(uniqueColorsMap.entries()).map(([name, hex]) => ({ name, hex }));

  const displayColors = availableColors.length > 0 ? availableColors : [
    { name: 'DEEP BLACK', hex: '#0a0a0a' },
    { name: 'RAW IVORY', hex: '#f0ede6' },
    { name: 'EARTH TAUPE', hex: '#5c4e46' },
    { name: 'MIDNIGHT NAVY', hex: '#1c2430' }
  ];

  const [selectedColor, setSelectedColor] = useState<string | null>(displayColors[0].name);

  const selectedVariantData = product.variants?.find((v: any) => {
    const matchSize = selectedSize ? v.size === selectedSize : true;
    const matchColor = selectedColor ? (v.color?.trim() === selectedColor) : true;
    return matchSize && matchColor;
  }) || product.variants?.find((v: any) => v.size === selectedSize) || product.variants?.[0];

  const baseVariant = selectedVariantData || product.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : 0;
  const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : null;

  const filteredSizes = availableSizes.map(s => {
    const matchingVariant = product.variants?.find((v: any) => 
      v.size === s.label && (selectedColor ? v.color?.trim() === selectedColor : true)
    );
    const inv = matchingVariant?.inventory;
    const inStock = inv ? (inv.totalStock - inv.reservedStock - inv.soldStock) > 0 : s.available;
    return {
      label: s.label,
      available: inStock && Boolean(matchingVariant)
    };
  });

  const hasDiscount = comparePrice != null && comparePrice > price && price > 0;
  const discountPercent = hasDiscount ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  const availableStock = selectedVariantData?.inventory 
    ? selectedVariantData.inventory.totalStock - selectedVariantData.inventory.soldStock - selectedVariantData.inventory.reservedStock 
    : 99;

  // Filter gallery images
  const colorFilteredImages = selectedColor
    ? product.images?.filter((img: any) => img.alt && img.alt.toLowerCase().includes(selectedColor.toLowerCase()))
    : [];

  const activeGalleryUrls: string[] = (colorFilteredImages && colorFilteredImages.length > 0)
    ? colorFilteredImages.map((i: any) => i.url)
    : (product.images?.map((i: any) => i.url) || ['/images/placeholder.svg']);

  const activeCoverImage = (colorFilteredImages && colorFilteredImages.length > 0)
    ? colorFilteredImages[0].url
    : (product.frontImageUrl || coverImage || activeGalleryUrls[0]);

  // SCARCITY & ALLOCATION DYNAMIC CALCULATIONS
  const variantsList = product.variants || [];
  const totalStockSum = variantsList.reduce((acc: number, v: any) => acc + (v.inventory?.totalStock ?? 25), 0);
  const soldStockSum = variantsList.reduce((acc: number, v: any) => acc + (v.inventory?.soldStock ?? 0), 0);
  const reservedStockSum = variantsList.reduce((acc: number, v: any) => acc + (v.inventory?.reservedStock ?? 0), 0);
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

  // Scroll listener for Pure Sticky Scroll Progression
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Wheel Scroll Lock: Locks body scroll on desktop until the final gallery image is reached
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 1023) return;

    const totalImages = activeGalleryUrls.length;
    if (totalImages <= 1) return;

    let isUnlocked = false;
    let isThrottled = false;

    const handleWheel = (e: WheelEvent) => {
      // If user has already scrolled past top hero, let normal scroll happen
      if (window.scrollY > 30) {
        isUnlocked = true;
        return;
      }

      if (!isUnlocked) {
        if (e.deltaY > 0) {
          // Scrolling Down -> Advance gallery reel
          setGalleryIndex((prevIndex) => {
            if (prevIndex < totalImages - 1) {
              e.preventDefault();
              if (!isThrottled) {
                isThrottled = true;
                setTimeout(() => { isThrottled = false; }, 350);
                return prevIndex + 1;
              }
              return prevIndex;
            } else {
              isUnlocked = true;
              return prevIndex;
            }
          });
        } else if (e.deltaY < 0 && window.scrollY <= 10) {
          // Scrolling Up at top of page -> Retreat gallery reel
          setGalleryIndex((prevIndex) => {
            if (prevIndex > 0) {
              e.preventDefault();
              if (!isThrottled) {
                isThrottled = true;
                setTimeout(() => { isThrottled = false; }, 350);
                return prevIndex - 1;
              }
              return prevIndex;
            }
            return 0;
          });
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
    addToCart(product, selectedSize, quantity);
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
        beginInstantCheckout({ product, size: selectedSize, quantity });
        router.push('/checkout');
      },
      { type: 'checkout', product, size: selectedSize, quantity }
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

  return (
    <div className={styles.pageContainer}>
      
      {/* MOBILE HERO: 100vh FULLSCREEN GALLERY */}
      <div className={styles.mobileOnlyHero}>
        <img
          src={activeGalleryUrls[galleryIndex] || activeCoverImage}
          alt={product.name}
          className={styles.mobileHeroImage}
        />

        <div className={styles.mobileScrollOverlay} style={{ opacity: isScrolled ? 0 : 1 }}>
          <span>Scroll for Vault Details</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* DESKTOP HERO: 3-COLUMN VIEWPORT LAYOUT WITH CONTINUOUS VERTICAL IMAGE REEL */}
      <section className={styles.heroScrollSection}>
        
        <div className={styles.heroStickyContainer}>
          
          <div className={styles.threeColGrid}>
            
            {/* COLUMN 1: LEFT (STATIC COVER IMAGE - COMPLETELY FIXED) */}
            <div className={styles.colLeft}>
              
              {/* WHITE CLOTH EMBOSSED CURSIVE RIBBON */}
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

            {/* COLUMN 2: CENTER (CONTINUOUS VERTICAL IMAGE REEL) */}
            <div className={styles.colCenter}>
              <div className={styles.reelContainer}>
                <div
                  className={styles.galleryReelStack}
                  style={{ transform: `translateY(-${galleryIndex * 100}%)` }}
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
                0{galleryIndex + 1} — 0{activeGalleryUrls.length}
              </div>
            </div>

            {/* COLUMN 3: RIGHT (FIXED PRODUCT INFO PANEL — ZERO NESTED SCROLLBARS) */}
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

              {/* Color & Size Selector Row */}
              <div className={styles.selectorRow}>
                {/* Color Swatches */}
                <div>
                  <div className={styles.selectorLabelRow}>
                    <span className={styles.selectorTitle}>COLOR:</span>
                    <span className={styles.selectedValName}>{selectedColor}</span>
                  </div>
                  <div className={styles.colorSwatches}>
                    {displayColors.map((c) => {
                      const isSelected = selectedColor === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setSelectedColor(c.name)}
                          className={`${styles.colorDotBtn} ${isSelected ? styles.colorDotBtnActive : ''}`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Size Boxes */}
                <div>
                  <div className={styles.selectorLabelRow}>
                    <span className={styles.selectorTitle}>SIZE:</span>
                  </div>
                  <div className={styles.sizeBoxes}>
                    {(filteredSizes.length > 0 ? filteredSizes : [
                      { label: 'XS', available: true },
                      { label: 'S', available: true },
                      { label: 'M', available: true },
                      { label: 'L', available: true },
                      { label: 'XL', available: true }
                    ]).map((s) => {
                      const isSelected = selectedSize === s.label;
                      return (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => {
                            setSelectedSize(s.label);
                            setSizeError(false);
                          }}
                          className={`${styles.sizeBoxBtn} ${isSelected ? styles.sizeBoxBtnActive : ''}`}
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
                <div className={styles.selectorTitle} style={{ marginBottom: '4px' }}>QUANTITY</div>
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
