'use client';

import { useRef, useState, useEffect, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ArrowLeftRight, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import { AtmosphericLockedRevealLayers } from '@/components/exclusive/AtmosphericLockedRevealLayers';
import { useAtmosphericRevealPointer } from '@/components/exclusive/useAtmosphericRevealPointer';
import { resolveProductImages } from '@/lib/image-resolver';
import QuickViewModal from './QuickViewModal';
import MobileQuickAddSheet from './MobileQuickAddSheet';
import { formatGA4Item, trackSelectItem } from '@/lib/gtag-ecommerce';
import { getEffectivePurchaseMode } from '@/lib/launch-engine';
import { PurchaseMode } from '@/types/launch';
import PreBookingProductCard, { type PreBookingProductCardProps } from './PreBookingProductCard';
import styles from './ProductCard.module.css';

export interface ProductCardProps {
  product: any;
  index?: number;
  /** High-contrast typography for cards on dark section backgrounds */
  theme?: 'default' | 'dark';
  /** Conversion CTA for exclusive discovery pages */
  showCta?: boolean;
  isDominant?: boolean;
}

export default function ProductCard({
  product,
  index = 0,
  theme = 'default',
  showCta = false,
  isDominant = false,
}: ProductCardProps) {
  const purchaseMode = getEffectivePurchaseMode(product);
  const isPreBooking = purchaseMode === PurchaseMode.PRE_BOOK || Boolean(product?.isPreBooking);

  // Strictly isolate Pre-Booking cards to PreBookingProductCard
  if (isPreBooking) {
    return (
      <PreBookingProductCard
        product={product}
        index={index}
        theme={theme}
        showCta={showCta}
        isDominant={isDominant}
      />
    );
  }

  const [mounted, setMounted] = useState(false);
  const { requireAuth } = useAuth();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { toggleWishlist, isInWishlist, addToCart, toggleCompare, isInCompare } = useStore();
  const wishlisted = mounted ? isInWishlist(product.id) : false;
  const inCompare = mounted ? isInCompare(product.id) : false;
  const [isFlipped, setIsFlipped] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [mobileQuickAddOpen, setMobileQuickAddOpen] = useState(false);
  const [addingSize, setAddingSize] = useState<string | null>(null);
  const isDark = theme === 'dark';
  const revealHostRef = useRef<HTMLDivElement>(null);

  const isExclusiveUnlockListing = product.channel === 'EXCLUSIVE_UNLOCK';

  const { enableImageToggle, defaultImageSide } = product;
  const { frontImage, backImage } = resolveProductImages(product);

  const defaultIsFront = defaultImageSide === 'front';
  const showFront = defaultIsFront ? !isFlipped : isFlipped;
  const currentImageUrl = enableImageToggle && frontImage !== '/images/placeholder.svg' && backImage !== '/images/placeholder.svg'
    ? (showFront ? frontImage : backImage)
    : frontImage;

  const baseVariant = product.variants?.[0];
  const price = baseVariant?.price ? Number(baseVariant.price) : 0;
  const comparePrice = baseVariant?.comparePrice ? Number(baseVariant.comparePrice) : null;
  const colorName = baseVariant?.color || 'Standard';

  useAtmosphericRevealPointer(revealHostRef, {
    enabled: isExclusiveUnlockListing && !!currentImageUrl,
    mode: 'card',
  });

  const hasDiscount = comparePrice != null && comparePrice > price && price > 0;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;
  const savingsAmount = hasDiscount ? comparePrice - price : 0;

  const isNew =
    product.createdAt &&
    new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Extract available sizes from variants and inventory
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONE_SIZE'];
  const variants = product.variants || [];
  
  const cardSizes = allSizes.map(sizeLabel => {
    const variant = variants.find((v: any) => v.size === sizeLabel);
    if (!variant) return null;
    const inv = variant.inventory;
    const isAvailable = inv ? (inv.totalStock - inv.reservedStock - inv.soldStock) > 0 : false;
    return {
      size: sizeLabel,
      available: isAvailable
    };
  }).filter(Boolean) as { size: string; available: boolean }[];

  const handleQuickAdd = (size: string) => {
    if (addingSize) return;
    setAddingSize(size);
    setTimeout(() => {
      // addToCart already calls setCartOpen(true) — the drawer opening IS the confirmation.
      // No toast needed; the reserved message is shown in the drawer.
      addToCart(product, size, 1);
      setAddingSize(null);
    }, 600); // 600ms elegant loading check
  };

  return (
    <div
      className={`${styles.card} ${isDark ? styles.cardDark : ''} ${isDominant ? styles.cardDominant : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={styles.imageWrapContainer}>
        <Link
          href={`/product/${product.slug}`}
          className={styles.imageWrap}
          onClick={() => {
            try {
              trackSelectItem(formatGA4Item(product, undefined, 1, index));
            } catch (e) {
              // ignore
            }
          }}
        >
          {isExclusiveUnlockListing ? (
            <div
              ref={revealHostRef}
              className={`gm-atmospheric-reveal-host ${styles.unlockRevealMount}`}
              style={
                {
                  ['--rx' as string]: '50%',
                  ['--ry' as string]: '46%',
                  ['--mx' as string]: '0',
                  ['--my' as string]: '0',
                } as CSSProperties
              }
            >
              <Image
                src={currentImageUrl}
                alt=""
                fill
                sizes="(max-width: 767px) 50vw, 28vw"
                className={`${styles.unlockLcpImg} ${isFlipped ? styles.flipped : ''}`}
                priority={index < 4}
                aria-hidden
              />
              <AtmosphericLockedRevealLayers
                key={currentImageUrl}
                imageUrl={currentImageUrl}
              />
            </div>
          ) : (
            <Image
              src={currentImageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
              className={`${styles.image} ${isFlipped ? styles.flipped : ''}`}
              priority={index < 4}
            />
          )}
          {enableImageToggle && frontImage && backImage && (
            <button
              className={styles.imageToggleBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFlipped(!isFlipped);
              }}
            >
              {isFlipped
                ? defaultImageSide === 'front'
                  ? 'Tap to See Front'
                  : 'Tap to See Back'
                : defaultImageSide === 'front'
                  ? 'Tap to See Back'
                  : 'Tap to See Front'}
            </button>
          )}
        </Link>

        {/* Horizontal Non-Overlapping Tag & Badge System */}
        <div className={styles.tagContainer}>
          {isNew ? (
            <span className={styles.tag}>New</span>
          ) : null}
          {product.isExclusiveRack ? (
            <span className={`${styles.featuredBadge} ${styles.exclusiveBadge}`}>
              {product.featuredBadge || 'Vault Edition'}
            </span>
          ) : product.featuredBadge ? (
            <span className={`${styles.featuredBadge} ${product.isExclusiveRack && product.drop ? styles.vaultDropBadge : ''}`}>
              {product.featuredBadge}
            </span>
          ) : product.isExclusiveRack && product.drop ? (
            <span className={styles.vaultDropBadge}>Vault</span>
          ) : null}
        </div>

        {/* Elegant Square Action Buttons (Top-Right overlay) */}
        <div className={styles.cardActions}>
          <button
            className={`${styles.actionBtn} ${wishlisted ? styles.wishlisted : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              requireAuth('wishlist', () => toggleWishlist(product), { type: 'wishlist', product });
            }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            className={`${styles.actionBtn} ${inCompare ? styles.inCompare : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCompare(product);
            }}
            aria-label={inCompare ? 'Remove from comparison' : 'Add to comparison'}
          >
            <ArrowLeftRight size={14} />
          </button>
        </div>

        {/* Mobile Quick Add Trigger Badge (+ Button) */}
        {cardSizes.length > 0 && (
          <button
            type="button"
            className={styles.mobileQuickAddTrigger}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileQuickAddOpen(true);
            }}
            aria-label={`Quick add ${product.name}`}
          >
            <Plus size={16} strokeWidth={2.2} />
          </button>
        )}

        {/* Desktop Quick Add Hover CTA Button (>= 1024px) */}
        {cardSizes.length > 0 && (
          <button
            type="button"
            className={styles.desktopQuickAddHoverBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileQuickAddOpen(true);
            }}
            aria-label={`Quick add ${product.name}`}
          >
            <Plus size={14} strokeWidth={2.2} />
            <span>Quick Add</span>
          </button>
        )}
      </div>

      <div className={`${styles.info} ${isDark ? styles.infoDark : ''}`}>
        <span className={styles.collection}>
          {product.collectionName || product.category?.name || 'Archival Edition'}
        </span>
        <Link href={`/product/${product.slug}`} className={styles.name}>
          {product.name}
        </Link>

        {hasDiscount && discountPercent > 0 && (
          <span className={styles.discountBadge}>{discountPercent}% OFF</span>
        )}

        {isDark ? (
          <>
            <div className={styles.priceBlock}>
              {hasDiscount && (
                <span className={styles.comparePrice}>
                  ₹{comparePrice!.toLocaleString('en-IN')}
                </span>
              )}
              <span className={styles.price}>₹{price.toLocaleString('en-IN')}</span>
              {hasDiscount && savingsAmount > 0 && (
                <span className={styles.savings}>
                  Save ₹{savingsAmount.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className={styles.color}>{colorName}</span>
            {showCta && (
              <Link href={`/product/${product.slug}`} className={styles.cardCta}>
                Request Access
              </Link>
            )}
          </>
        ) : (
          <div className={styles.meta}>
            <span className={styles.color}>{colorName}</span>
            <div className={styles.priceRow}>
              {hasDiscount && (
                <span className={styles.comparePrice}>
                  ₹{comparePrice!.toLocaleString('en-IN')}
                </span>
              )}
              <span className={styles.price}>₹{price.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Render Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />

      {/* Render Mobile Quick Add Sheet */}
      <MobileQuickAddSheet
        isOpen={mobileQuickAddOpen}
        onClose={() => setMobileQuickAddOpen(false)}
        productName={product.name}
        sizes={cardSizes}
        addingSize={addingSize}
        onAddSize={(size) => handleQuickAdd(size)}
      />
    </div>
  );
}
