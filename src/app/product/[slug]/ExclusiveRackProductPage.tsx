'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ShoppingBag,
  ArrowLeftRight,
  Share2,
  Lock,
  ChevronDown,
  ShieldCheck,
  Award,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import SizeSelector from '@/components/SizeSelector';
import SizeChartModal, { type SizeChartEntry } from '@/components/SizeChartModal';
import QuantitySelector from '@/components/QuantitySelector';
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

  // Dynamic Scroll Progress & Image Index tracking for Cinematic Vault Sequence
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

  const [selectedColor, setSelectedColor] = useState<string | null>(
    availableColors.length > 0 ? availableColors[0].name : null
  );

  const selectedVariantData = product.variants?.find((v: any) => {
    const matchSize = selectedSize ? v.size === selectedSize : true;
    const matchColor = selectedColor ? (v.color?.trim() === selectedColor) : true;
    return matchSize && matchColor;
  }) || product.variants?.find((v: any) => v.size === selectedSize) || product.variants?.[0];

  const baseVariant = selectedVariantData || product.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : 0;
  const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : null;
  const activeSku = baseVariant?.sku || '';

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

  // SCARCITY & ETIMATION DYNAMIC CALCULATIONS
  const variantsList = product.variants || [];
  const totalStockSum = variantsList.reduce((acc: number, v: any) => acc + (v.inventory?.totalStock ?? 25), 0);
  const soldStockSum = variantsList.reduce((acc: number, v: any) => acc + (v.inventory?.soldStock ?? 0), 0);
  const reservedStockSum = variantsList.reduce((acc: number, v: any) => acc + (v.inventory?.reservedStock ?? 0), 0);
  const allocatedCount = soldStockSum + reservedStockSum;
  const editionTotal = totalStockSum > 0 ? totalStockSum : 100;
  const remainingCount = Math.max(0, editionTotal - allocatedCount);
  const editionNumber = Math.min(editionTotal, Math.max(1, allocatedCount + 1));
  const scarcityPercent = Math.min(100, Math.max(0, Math.round((allocatedCount / editionTotal) * 100)));

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

  // Scroll listener for Pure CSS Sticky Scroll Progression & gallery index stepping
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);

      const numImages = activeGalleryUrls.length;
      if (numImages > 1) {
        // Compute active image index as user scrolls through locked hero height
        const heroStepDistance = window.innerHeight * 0.9;
        const index = Math.min(numImages - 1, Math.floor(scrollY / heroStepDistance));
        setGalleryIndex(Math.max(0, index));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  const numImages = activeGalleryUrls.length;
  const heroScrollHeight = numImages > 1 ? `${numImages * 100}vh` : '100vh';

  return (
    <div className={styles.pageContainer}>
      
      {/* MOBILE HERO: 100vh FULLSCREEN GALLERY */}
      <div className={styles.mobileOnlyHero}>
        <img
          src={activeGalleryUrls[galleryIndex] || activeCoverImage}
          alt={product.name}
          className={styles.mobileHeroImage}
        />

        {/* Scroll overlay indicator */}
        <div className={styles.mobileScrollOverlay} style={{ opacity: isScrolled ? 0 : 1 }}>
          <span>Scroll for Vault Details</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* FULLSCREEN DESKTOP HERO WITH PURE CSS STICKY SCROLL */}
      <section className={styles.heroScrollSection} style={{ height: heroScrollHeight }}>
        
        <div className={styles.heroStickyContainer}>
          
          {/* Top Vault Nav & Breadcrumb */}
          <div className={styles.topNavRow}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span className={styles.breadcrumbSep}>/</span>
              <Link href="/exclusive-rack">Exclusive Rack</Link>
              <span className={styles.breadcrumbSep}>/</span>
              <span className={styles.breadcrumbCurrent}>{product.name}</span>
            </nav>

            <div className={styles.vaultBadgeHeader}>
              <Sparkles size={11} color="#c8a46a" />
              <span>Private Vault</span>
            </div>
          </div>

          {/* 60% / 40% DESKTOP GRID */}
          <div className={styles.pdpGrid}>
            
            {/* ==================================================
                LEFT SIDE (60%): STATIC COVER + DYNAMIC GALLERY
                ================================================== */}
            <div className={styles.leftCol}>
              
              {/* STATIC COVER IMAGE CARD */}
              <div className={styles.staticImageCard}>
                
                {/* EMBOSSED WHITE CLOTH STITCHED RIBBON */}
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

              {/* DYNAMIC GALLERY IMAGE CARD (BOTTOM -> TOP TRANSITION) */}
              <div className={styles.dynamicImageCard}>
                {activeGalleryUrls.map((url: string, idx: number) => {
                  const isActive = idx === galleryIndex;
                  return (
                    <img
                      key={url + idx}
                      src={url}
                      alt={`${product.name} Gallery ${idx + 1}`}
                      className={styles.dynamicImage}
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? 'translateY(0)' : 'translateY(40px)',
                        zIndex: isActive ? 2 : 1,
                        pointerEvents: isActive ? 'auto' : 'none',
                      }}
                    />
                  );
                })}

                <div className={styles.galleryCounter}>
                  {galleryIndex + 1} / {activeGalleryUrls.length}
                </div>
              </div>

            </div>

            {/* ==================================================
                RIGHT SIDE (40%): STICKY VAULT CONTROL PANEL
                ================================================== */}
            <div className={styles.rightCol}>
              
              {/* Collection Name */}
              <span className={styles.collectionTag}>
                {product.collectionName || 'SIGNATURE COLLECTION'}
              </span>

              {/* Product Name */}
              <h1 className={styles.productTitle}>{product.name}</h1>

              {/* Category */}
              <div className={styles.categoryMeta}>
                <span>Category:</span>
                <span className={styles.categoryLabel}>{product.category?.name || 'OVERSIZED TEES'}</span>
              </div>

              {/* Short Description */}
              <p className={styles.shortDesc}>
                {product.shortDesc || 'Archival silhouette crafted with heavy cotton, drop-shoulder structure, and high-density finish.'}
              </p>

              {/* Price Block */}
              <div className={styles.priceBox}>
                <span className={styles.sellingPrice}>₹{price.toLocaleString('en-IN')}</span>
                {hasDiscount && comparePrice && (
                  <span className={styles.comparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
                )}
                {hasDiscount && (
                  <span className={styles.discountBadge}>{discountPercent}% OFF</span>
                )}
              </div>
              <div className={styles.taxNote}>Price inclusive of all taxes</div>

              {/* Color Selector (Luxury Swatches) */}
              {availableColors.length > 0 && (
                <div className={styles.selectorWrap}>
                  <div className={styles.selectorLabelRow}>
                    <span className={styles.selectorTitle}>Color</span>
                    <span className={styles.selectedValName}>{selectedColor}</span>
                  </div>
                  <div className={styles.colorGrid}>
                    {availableColors.map((c) => {
                      const isSelected = selectedColor === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setSelectedColor(c.name)}
                          className={`${styles.colorSwatchBtn} ${isSelected ? styles.colorSwatchBtnActive : ''}`}
                        >
                          {c.hex && (
                            <span
                              className={styles.colorCircle}
                              style={{ backgroundColor: c.hex }}
                            />
                          )}
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div className={styles.selectorWrap}>
                <div className={styles.selectorLabelRow}>
                  <span className={styles.selectorTitle}>Select Size</span>
                  {hasSizeChart && (
                    <button
                      type="button"
                      onClick={() => setIsSizeChartOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c8a46a',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        padding: 0,
                      }}
                    >
                      Size Chart
                    </button>
                  )}
                </div>
                <SizeSelector
                  sizes={filteredSizes}
                  selected={selectedSize}
                  onSelect={(size) => {
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                />
                {sizeError && (
                  <p style={{ color: '#ff6b6b', fontSize: '10px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Select a size to proceed with custody allocation
                  </p>
                )}
              </div>

              {/* Size Chart Modal Component */}
              {hasSizeChart && (
                <SizeChartModal
                  isOpen={isSizeChartOpen}
                  onClose={() => setIsSizeChartOpen(false)}
                  productName={product.name}
                  entries={sizeChartEntries}
                />
              )}

              {/* Quantity Selector */}
              <div className={styles.selectorWrap}>
                <span className={styles.selectorTitle}>Quantity</span>
                <QuantitySelector
                  quantity={quantity}
                  onChange={setQuantity}
                  max={availableStock}
                />
              </div>

              {/* Action Buttons Stack */}
              <div className={styles.actionStack}>
                <button
                  type="button"
                  className={styles.buyNowBtn}
                  onClick={handleBuyNow}
                  id="vault-buy-now"
                  disabled={availableStock === 0}
                >
                  Buy Now
                </button>

                <button
                  type="button"
                  className={styles.addToBagBtn}
                  onClick={handleAddToCart}
                  id="vault-add-to-bag"
                  disabled={availableStock === 0}
                >
                  <ShoppingBag size={14} />
                  Add to Bag
                </button>

                {/* Wishlist, Compare, Share Icon Actions Row */}
                <div className={styles.iconActionsRow}>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${wishlisted ? styles.iconBtnActive : ''}`}
                    onClick={() => requireAuth('wishlist', () => toggleWishlist(product), { type: 'wishlist', product })}
                    id="vault-wishlist"
                  >
                    <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
                    <span>{wishlisted ? 'Saved' : 'Wishlist'}</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.iconBtn} ${inCompare ? styles.iconBtnActive : ''}`}
                    onClick={() => toggleCompare(product)}
                    id="vault-compare"
                  >
                    <ArrowLeftRight size={14} />
                    <span>{inCompare ? 'Comparing' : 'Compare'}</span>
                  </button>

                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={handleShare}
                    id="vault-share"
                  >
                    <Share2 size={14} />
                    <span>{copiedShare ? 'Copied' : 'Share'}</span>
                  </button>
                </div>
              </div>

              {/* ==================================================
                  EXCLUSIVE OWNERSHIP CERTIFICATE PANEL (REDESIGNED V3)
                  ================================================== */}
              <div className={styles.certificatePanel}>
                
                <div className={styles.certHeader}>
                  <div className={styles.certTitleGroup}>
                    <Award size={14} color="#c8a46a" />
                    <span className={styles.certTitle}>
                      GODSMOVE VAULT CERTIFICATE OF ALLOCATION
                    </span>
                  </div>
                  <span className={styles.certEditionBadge}>
                    Edition {editionNumber} / {editionTotal}
                  </span>
                </div>

                {/* Scarcity message banner */}
                <div className={styles.scarcityMessageBanner}>
                  {allocatedCount > 0 
                    ? `${allocatedCount} collectors already own this edition. Only ${remainingCount} pieces remain worldwide.`
                    : `Only ${remainingCount} pieces remain worldwide in private archives.`}
                </div>

                {/* Certificate Data Grid */}
                <div className={styles.certGrid}>
                  <div className={styles.certDataCard}>
                    <div className={styles.certDataLabel}>Available</div>
                    <div className={`${styles.certDataVal} ${styles.certDataValGold}`}>
                      {remainingCount} Pieces Remaining
                    </div>
                  </div>

                  <div className={styles.certDataCard}>
                    <div className={styles.certDataLabel}>Allocated</div>
                    <div className={styles.certDataVal}>
                      {allocatedCount} Pieces Allocated
                    </div>
                  </div>

                  <div className={styles.certDataCard}>
                    <div className={styles.certDataLabel}>Allocation Status</div>
                    <div className={styles.certDataVal}>No Restocking</div>
                  </div>

                  <div className={styles.certDataCard}>
                    <div className={styles.certDataLabel}>Allocation Type</div>
                    <div className={styles.certDataVal}>Limited Allocation</div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className={styles.certProgressWrap}>
                  <div className={styles.certProgressLabels}>
                    <span>{remainingCount} Remaining</span>
                    <span>{allocatedCount} Allocated</span>
                  </div>
                  <div className={styles.certTrack}>
                    <div
                      className={styles.certFill}
                      style={{ width: `${scarcityPercent}%` }}
                    />
                  </div>
                </div>

                {/* Certificate Statements */}
                <div className={styles.certStatements}>
                  <div className={styles.certStatementRow}>
                    <span className={styles.certBullet}>◆</span>
                    <span>Each piece is individually allocated. No future manufacturing.</span>
                  </div>
                  <div className={styles.certStatementRow}>
                    <span className={styles.certBullet}>◆</span>
                    <span>Once allocated, this edition is permanently closed.</span>
                  </div>
                </div>

                {/* Certificate Tag Pills */}
                <div className={styles.certTags}>
                  <span className={styles.certTag}>Private Collection</span>
                  <span className={styles.certTag}>Hand Numbered</span>
                  <span className={styles.certTag}>Edition Verified</span>
                  <span className={styles.certTag}>Exclusive Allocation</span>
                  <span className={styles.certTag}>Crafted Once</span>
                  <span className={styles.certTag}>Never Restocked</span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          UNLOCKED VAULT SECTIONS (PRODUCT DETAILS & SYMBOLISM)
          Unlocked after full gallery sequence
          ================================================== */}
      <div className={styles.vaultUnlockedContent}>
        
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
          id="mobile-vault-wishlist"
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          className={styles.mobileBarBuyNow}
          onClick={handleBuyNow}
          id="mobile-vault-buy-now"
          disabled={availableStock === 0}
        >
          Buy Now
        </button>

        <button
          type="button"
          className={styles.mobileBarAddToBag}
          onClick={handleAddToCart}
          id="mobile-vault-add-to-bag"
          disabled={availableStock === 0}
        >
          <ShoppingBag size={14} />
          Add to Bag
        </button>
      </div>

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
