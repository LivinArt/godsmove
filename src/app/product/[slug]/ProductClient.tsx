'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  ShoppingBag, 
  ShieldCheck, 
  Package, 
  ArrowLeftRight, 
  Share2, 
  Star,
  CheckCircle2,
  Lock,
  Minus,
  Plus,
  User
} from 'lucide-react';
import SizeSelector from '@/components/SizeSelector';
import ImageGallery from '@/components/ImageGallery';
import QuantitySelector from '@/components/QuantitySelector';
import RecentlyViewed from '@/components/RecentlyViewed';
import MobileQuickAddSheet from '@/components/MobileQuickAddSheet';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

export default function ProductClient({
  product,
  availableSizes,
  coverImage,
  profile,
}: {
  product: any;
  availableSizes: { label: string; available: boolean }[];
  coverImage?: string | null;
  profile?: any;
}) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copiedShare, setCopiedShare] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileSheetAction, setMobileSheetAction] = useState<'add' | 'buy'>('add');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gm_recently_viewed');
      let ids = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(ids)) ids = [];
      ids = [product.id, ...ids.filter((id: string) => id !== product.id)];
      localStorage.setItem('gm_recently_viewed', JSON.stringify(ids.slice(0, 8)));
    } catch (e) {
      // ignore
    }
  }, [product.id]);

  const { requireAuth } = useAuth();
  const { addToCart, setInstantCheckout, toggleWishlist, isInWishlist, toggleCompare, isInCompare, showToast } = useStore();
  const wishlisted = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  // ── COLOR VARIANTS PIPELINE ──
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
  const colorName = selectedColor || baseVariant?.color || 'Standard';
  const activeSku = baseVariant?.sku || '';

  // Filter sizes available for current selected color
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

  const handleAddToCart = () => {
    if (!selectedSize) {
      if (typeof window !== 'undefined' && window.innerWidth <= 767) {
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
      if (typeof window !== 'undefined' && window.innerWidth <= 767) {
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
        setInstantCheckout({ product, size: selectedSize, quantity });
        router.push('/checkout');
      },
      { type: 'checkout', product, size: selectedSize, quantity }
    );
  };

  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      showToast('Link Copied', 'Product link copied to clipboard.');
      setTimeout(() => setCopiedShare(false), 2000);
    } catch (e) {}
  };

  // Safe Metadata helper
  const getMetadataVal = (key: string, fallback: string = '') => {
    if (product.metadata && typeof product.metadata === 'object') {
      return (product.metadata as any)[key] || fallback;
    }
    return fallback;
  };

  // Filter gallery images for selected color
  const colorFilteredImages = selectedColor
    ? product.images?.filter((img: any) => img.alt && img.alt.toLowerCase().includes(selectedColor.toLowerCase()))
    : [];

  const activeGalleryUrls = (colorFilteredImages && colorFilteredImages.length > 0)
    ? colorFilteredImages.map((i: any) => i.url)
    : (product.images?.map((i: any) => i.url) || ['/images/placeholder.svg']);

  const activeCoverImage = (colorFilteredImages && colorFilteredImages.length > 0)
    ? colorFilteredImages[0].url
    : (product.frontImageUrl || coverImage || activeGalleryUrls[0]);

  return (
    <div className={styles.pdpContainer}>
      
      {/* ==================================================
          SECTION 1: PRODUCT HERO
          ================================================== */}
      <div className={styles.heroLayout}>
        {/* Left (60%): Large Product Gallery */}
        <div className={styles.galleryCol}>
          <ImageGallery
            images={activeGalleryUrls}
            alt={product.name}
            enableToggle={product.enableImageToggle}
            frontImage={activeCoverImage}
            backImage={product.backImageUrl}
            defaultSide={product.defaultImageSide}
          />
        </div>

        {/* Right (40%): Product Information Buy Box */}
        <div className={styles.buyBoxCol}>
          <div className={styles.stickyBuyBox}>
            
            {/* Collection Title */}
            <span className={styles.heroCollection}>
              {product.collectionName || product.category?.name || 'Archival Edition'}
            </span>

            {/* Product Name */}
            <h1 className={styles.heroName}>{product.name}</h1>

            {/* Editorial personalization banner */}
            <div style={{ color: '#c8a46a', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 500 }}>
              Selected for your archive.
            </div>

            {/* Badges Stack */}
            <div className={styles.heroBadges}>
              {product.isExclusiveRack && (
                <span className={styles.exclusiveBadge}>Vault Edition</span>
              )}
              {product.featuredBadge && (
                <span className={styles.featuredBadge}>{product.featuredBadge}</span>
              )}
              {product.channel === 'EXCLUSIVE_UNLOCK' && (
                <span className={styles.unlockBadge}>Private Draw allocation</span>
              )}
            </div>

            {/* Price Block */}
            <div className={styles.heroPriceRow}>
              {hasDiscount && comparePrice && (
                <span className={styles.heroComparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
              )}
              <span className={styles.heroPrice}>₹{price.toLocaleString('en-IN')}</span>
              {hasDiscount && (
                <span className={styles.heroDiscountBadge}>{discountPercent}% OFF</span>
              )}
            </div>

            <div className={styles.heroDivider} />

            {/* Availability */}
            <div className={styles.heroAvailability}>
              <span className={styles.availabilityDot} />
              <span className={styles.availabilityText}>
                {availableStock === 0 
                  ? 'Sold Out' 
                  : availableStock <= 5 
                    ? `Limited Allocation — Only ${availableStock} pieces remain` 
                    : 'Allocations Available'}
              </span>
            </div>

            {/* SKU Badge */}
            {activeSku && (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '0.05em', marginBottom: '16px' }}>
                SKU: {activeSku}
              </div>
            )}

            {/* Short Description */}
            <p className={styles.heroShortDesc}>
              {product.shortDesc || 'Timeless silhouette engineered to preserve structure and hold confidence.'}
            </p>

            {/* Color Variant Selector */}
            {availableColors.length > 0 && (
              <div className={styles.heroSizesWrap} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className={styles.sectionLabel}>Color</span>
                  <span style={{ fontSize: '11px', color: '#c8a46a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {selectedColor}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {availableColors.map((c) => {
                    const isSelected = selectedColor === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setSelectedColor(c.name);
                        }}
                        style={{
                          padding: '8px 16px',
                          border: isSelected ? '1.5px solid #c8a46a' : '1px solid var(--border-medium)',
                          background: isSelected ? 'rgba(200, 164, 106, 0.08)' : 'transparent',
                          color: isSelected ? '#c8a46a' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        {c.hex && (
                          <span
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: c.hex,
                              border: '1px solid rgba(255,255,255,0.2)',
                              display: 'inline-block',
                            }}
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
            <div className={styles.heroSizesWrap}>
              <span className={styles.sectionLabel}>Select Size</span>
              <SizeSelector
                sizes={filteredSizes}
                selected={selectedSize}
                onSelect={(size) => {
                  setSelectedSize(size);
                  setSizeError(false);
                }}
              />
              {sizeError && (
                <p className={styles.sizeError}>Select a size to verify custody allocation</p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className={styles.heroQuantityWrap}>
              <span className={styles.sectionLabel}>Allocation Count</span>
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                max={availableStock}
              />

              {/* Requirement 8: Mobile PDP Minimal Action Links: Compare • Share */}
              <div className={styles.mobilePDPActionRow}>
                <button
                  type="button"
                  className={`${styles.mobilePDPActionBtn} ${inCompare ? styles.inCompare : ''}`}
                  onClick={() => toggleCompare(product)}
                >
                  <ArrowLeftRight size={13} />
                  <span>{inCompare ? 'In Comparison' : 'Compare'}</span>
                </button>
                <span className={styles.mobilePDPActionDivider}>•</span>
                <button
                  type="button"
                  className={styles.mobilePDPActionBtn}
                  onClick={handleShare}
                >
                  <Share2 size={13} />
                  <span>{copiedShare ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* CTA Stack */}
            <div className={styles.heroActions}>
              <button
                className={styles.buyNowBtn}
                onClick={handleBuyNow}
                id="pdp-buy-now"
                disabled={availableStock === 0}
              >
                Buy Now
              </button>
              
              <button
                className={styles.addToBagBtn}
                onClick={handleAddToCart}
                id="pdp-add-to-bag"
                disabled={availableStock === 0}
              >
                <ShoppingBag size={14} style={{ marginRight: 8 }} />
                Add to Bag
              </button>

              <div className={styles.utilitySquareActions}>
                <button
                  className={`${styles.squareActionBtn} ${wishlisted ? styles.wishlisted : ''}`}
                  onClick={() => requireAuth('wishlist', () => toggleWishlist(product), { type: 'wishlist', product })}
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  id="pdp-wishlist"
                >
                  <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
                </button>

                <button
                  className={`${styles.squareActionBtn} ${inCompare ? styles.inCompare : ''}`}
                  onClick={() => toggleCompare(product)}
                  aria-label={inCompare ? 'Remove from comparison' : 'Add to comparison'}
                  id="pdp-compare"
                >
                  <ArrowLeftRight size={16} />
                </button>

                <button
                  className={styles.squareActionBtn}
                  onClick={handleShare}
                  aria-label="Share product link"
                  id="pdp-share"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ==================================================
          SECTION: CRAFTSMANSHIP (EDITORIAL SPECIFICATION)
          ================================================== */}
      <section className={styles.editorialMagazineSection}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 var(--space-xl)' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(200, 164, 106, 0.7)', display: 'block', marginBottom: '20px' }}>
              ARCHIVE CAMPAIGN
            </span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 200, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 20px' }}>
              {product.editorialHeading || 'CRAFTSMANSHIP'}
            </h2>
            {product.editorialNotes && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontStyle: 'italic', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.8, letterSpacing: '0.02em' }}>
                &ldquo;{product.editorialNotes}&rdquo;
              </p>
            )}
            <div style={{ width: '40px', height: '1px', background: '#c8a46a', margin: '28px auto 0', opacity: 0.6 }} />
          </div>

          {/* Spec blocks grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-xl)' }}>
            <div style={{ borderTop: '1px solid rgba(200, 164, 106, 0.2)', paddingTop: 'var(--space-lg)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a46a', display: 'block', marginBottom: '12px' }}>
                {product.fabricLabel || 'FABRIC'}
              </span>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75, letterSpacing: '0.01em' }}>
                {product.fabricWhy || product.material || 'Engineered from 100% heavyweight organic cotton for structural permanence and soft skin contact.'}
              </p>
            </div>
            <div style={{ borderTop: '1px solid rgba(200, 164, 106, 0.2)', paddingTop: 'var(--space-lg)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a46a', display: 'block', marginBottom: '12px' }}>
                {product.fitLabel || 'FIT'}
              </span>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75, letterSpacing: '0.01em' }}>
                {product.fit || 'Archival relaxed silhouette proportioned for balance and uncompromised wearing comfort.'}
              </p>
            </div>
            <div style={{ borderTop: '1px solid rgba(200, 164, 106, 0.2)', paddingTop: 'var(--space-lg)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a46a', display: 'block', marginBottom: '12px' }}>
                {product.constructionLabel || 'CONSTRUCTION'}
              </span>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75, letterSpacing: '0.01em' }}>
                {product.constructionWhy || 'Reinforced double-needle seam engineering constructed for high density and longevity.'}
              </p>
            </div>
            <div style={{ borderTop: '1px solid rgba(200, 164, 106, 0.2)', paddingTop: 'var(--space-lg)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a46a', display: 'block', marginBottom: '12px' }}>
                {product.printLabel || 'FINISH'}
              </span>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75, letterSpacing: '0.01em' }}>
                {product.printWhy || 'Signature archival finish treated to age gracefully through years of ownership.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Browsing history list */}
      {profile && <RecentlyViewed />}

      {/* ==================================================
          MOBILE FIXED BOTTOM PURCHASE BAR
          Visible only on mobile (hidden desktop via CSS)
          ================================================== */}
      <div className={styles.mobileBottomBar}>
        {/* Wishlist */}
        <button
          className={`${styles.mobileBarWishlist} ${wishlisted ? styles.wishlisted : ''}`}
          onClick={() => requireAuth('wishlist', () => toggleWishlist(product), { type: 'wishlist', product })}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          id="mobile-pdp-wishlist"
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Buy Now */}
        <button
          className={styles.mobileBarBuyNow}
          onClick={handleBuyNow}
          id="mobile-pdp-buy-now"
          disabled={availableStock === 0}
        >
          Buy Now
        </button>

        {/* Add to Bag */}
        <button
          className={styles.mobileBarAddToBag}
          onClick={handleAddToCart}
          id="mobile-pdp-add-to-bag"
          disabled={availableStock === 0}
        >
          <ShoppingBag size={14} />
          Add to Bag
        </button>
      </div>

      {/* Requirement 9: Mobile Variant Selection Bottom Sheet */}
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
            setInstantCheckout({ product, size, quantity });
            router.push('/checkout');
          } else {
            addToCart(product, size, quantity);
          }
        }}
      />
    </div>
  );
}

