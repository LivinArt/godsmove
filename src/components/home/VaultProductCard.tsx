'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Heart, ArrowLeftRight, ShoppingBag, ShieldCheck, Tag, Rocket, Bell } from 'lucide-react';
import { useCommerceActions } from '@/hooks/useCommerceActions';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/store/useStore';
import { resolveProductImages } from '@/lib/image-resolver';
import { getEffectivePurchaseMode, useSynchronizedCountdown } from '@/lib/launch-engine';
import { PurchaseMode } from '@/types/launch';
import PreBookingBenefitsModal from '@/components/PreBookingBenefitsModal';
import { PreBookingTermsModal } from '@/components/prebooking/PreBookingModals';
import { PreBookingNotifyButton } from '../PreBookingNotifyButton';
import styles from './VaultProductCard.module.css';


const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface VaultProductCardProps {
  product: any;
  isEven: boolean;
}

export default function VaultProductCard({ product, isEven }: VaultProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [inlineFeedback, setInlineFeedback] = useState<string | null>(null);
  const [isBellRegistered, setIsBellRegistered] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const feedbackTimer = useRef<NodeJS.Timeout | null>(null);

  const { requireAuth } = useAuth();
  const showToast = useStore((s) => s.showToast);

  useEffect(() => {
    setMounted(true);
    let isCancelled = false;
    if (product?.id) {
      import('@/actions/prebooking-interest.actions').then(({ checkPreBookingInterestAction }) => {
        checkPreBookingInterestAction(product.id).then((res) => {
          if (!isCancelled && res.isRegistered) {
            setIsBellRegistered(true);
          }
        });
      });
    }
    return () => { isCancelled = true; };
  }, [product?.id]);

  const handleNotifyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(
      'notify',
      async () => {
        const { togglePreBookingInterestAction } = await import('@/actions/prebooking-interest.actions');
        const res = await togglePreBookingInterestAction(product.id);
        if (res.success) {
          setIsBellRegistered(true);
          showToast(
            res.alreadyRegistered ? "Already Registered" : "Interest Received",
            res.message || "YOUR INTEREST HAS BEEN RECEIVED."
          );
        }
      },
      { type: 'notify', product }
    );
  };

  // Extract available sizes from variants or default list

  const availableSizes = useMemo<string[]>(() => {
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const variantSizes = product.variants
        .map((v: any) => (typeof v === 'string' ? v : typeof v?.size === 'string' ? v.size : ''))
        .filter((s: string) => Boolean(s));
      if (variantSizes.length > 0) {
        return Array.from(new Set(variantSizes));
      }
    }
    return DEFAULT_SIZES;
  }, [product.variants]);

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || 'M');

  // Calculate actual stock across all active variants
  const actualAvailableStock = useMemo(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.reduce((sum: number, v: any) => {
        const stock = v.inventory?.totalStock ?? 0;
        return sum + (stock > 0 ? stock : 0);
      }, 0);
    }
    return product.initialStock || 0;
  }, [product]);

  // Ensure base price is a valid number > 0
  const basePrice = useMemo(() => {
    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    return Number(rawPrice) > 0 ? Number(rawPrice) : 2999;
  }, [product]);

  const formattedPrice = useMemo(() => `₹${basePrice.toLocaleString('en-IN')}`, [basePrice]);

  // Construct complete production product payload
  const completeProduct = useMemo(() => {
    const existingVariants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : [];
    const hasSelectedSizeVariant = existingVariants.some((v: any) => v.size === selectedSize);

    const normalizedVariants = hasSelectedSizeVariant
      ? existingVariants.map((v: any) => ({
          ...v,
          price: Number(v.price) > 0 ? Number(v.price) : basePrice,
        }))
      : [
          ...existingVariants,
          {
            id: `${product.id}-${selectedSize}`,
            size: selectedSize,
            price: basePrice,
            inventory: { totalStock: actualAvailableStock || 10, reservedStock: 0, soldStock: 0 },
          },
        ];

    return {
      ...product,
      price: basePrice,
      variants: normalizedVariants,
    };
  }, [product, selectedSize, basePrice, actualAvailableStock]);

  const triggerInlineFeedback = (msg: string) => {
    setInlineFeedback(msg);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setInlineFeedback(null), 2400);
  };

  // Consume shared commerce layer
  const {
    handleBuyNow,
    handleAddToCart,
    handleWishlist,
    handleCompare,
    isWishlisted,
    isCompared,
  } = useCommerceActions({
    product: completeProduct,
    selectedSize,
    quantity: 1,
    onRequireSize: () => triggerInlineFeedback('Please select a size'),
    onSuccessMessage: (msg) => triggerInlineFeedback(msg),
  });

  const wishlisted = mounted ? isWishlisted : false;
  const inCompare = mounted ? isCompared : false;

  // Resolve image gallery
  const galleryUrls = useMemo(() => {
    const resolved = resolveProductImages(product);
    const urls: string[] = [];

    if (resolved.frontImage && resolved.frontImage !== '/images/placeholder.svg') {
      urls.push(resolved.frontImage);
    }
    if (resolved.backImage && resolved.backImage !== '/images/placeholder.svg' && !urls.includes(resolved.backImage)) {
      urls.push(resolved.backImage);
    }

    if (Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((img: any) => {
        const url = typeof img === 'string' ? img : img.url;
        if (url && !urls.includes(url) && url !== '/images/placeholder.svg') {
          urls.push(url);
        }
      });
    }

    return urls.length > 0 ? urls : ['/images/placeholder.svg'];
  }, [product]);

  const totalImages = galleryUrls.length;

  const handleNextImage = useCallback((e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const handlePrevImage = useCallback((e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 35) {
      if (diffX > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    touchStartX.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      handleNextImage(e);
    } else if (e.key === 'ArrowLeft') {
      handlePrevImage(e);
    }
  };

  const purchaseMode = getEffectivePurchaseMode(product);
  const isPreBookingMode = purchaseMode === PurchaseMode.PRE_BOOK;
  const countdown = useSynchronizedCountdown(product.launchDateTime);
  const [isBenefitsModalOpen, setIsBenefitsModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const maxPreBookingLimit = product.maxPreBooking != null ? Number(product.maxPreBooking) : 100;
  const currentPreBooked = Number(product.currentPreBookings || 0);
  const preBookingRemaining = Math.max(0, maxPreBookingLimit - currentPreBooked);
  const preBookingPercent = Math.min(100, Math.round((currentPreBooked / maxPreBookingLimit) * 100));

  return (
    <div className={`${styles.exclusiveRow} ${isEven ? styles.rowNormal : styles.rowReverse}`}>
      {/* Hidden gallery image preloader */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {galleryUrls.map((url) => (
          <Image key={url} src={url} alt="" width={10} height={10} priority />
        ))}
      </div>      {/* 1. Clean Product Image Container */}
      <div className={styles.exclusiveImgPanel}>
        <div
          className={styles.exclusiveImageContainer}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-label={`${product.name} gallery`}
        >
          <Link href={`/product/${product.slug}`} tabIndex={-1}>
            {galleryUrls.map((url, idx) => (
              <Image
                key={url}
                src={url}
                alt={`${product.name} view ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 440px"
                className={`${styles.exclusiveImg} ${currentImageIndex === idx ? styles.activeImg : styles.hiddenImg}`}
                priority={idx === 0 && isEven}
              />
            ))}
          </Link>

          {isPreBookingMode ? (
            <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
              <PreBookingNotifyButton product={product} showSubText={false} />
            </div>
          ) : null}

          {isPreBookingMode ? (
            <span className={styles.exclusiveCardBadge}>PRE-BOOKING OPEN</span>
          ) : product.featuredBadge ? (
            <span className={styles.exclusiveCardBadge}>{product.featuredBadge}</span>
          ) : null}


          {/* Fixed Position Gallery Navigation Arrows */}
          {totalImages > 1 && (
            <>
              <button
                type="button"
                className={`${styles.galleryNavBtn} ${styles.prevBtn}`}
                onClick={handlePrevImage}
                aria-label="Previous Image"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className={`${styles.galleryNavBtn} ${styles.nextBtn}`}
                onClick={handleNextImage}
                aria-label="Next Image"
              >
                <ChevronRight size={16} />
              </button>

              <div className={styles.galleryDots}>
                {galleryUrls.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.dot} ${currentImageIndex === idx ? styles.activeDot : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setCurrentImageIndex(idx);
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* 1.5 Integrated Countdown Strip Directly Below Product Image for Pre-Booking items */}
        {isPreBookingMode && !countdown.isCompleted && (
          <div className={styles.integratedImageTimerStrip}>
            <span className={styles.timerStripLabel}>
              <span className={styles.liveDot} /> LAUNCHES IN
            </span>
            <span className={styles.timerStripValue}>
              {String(countdown.days).padStart(2, '0')}D : {String(countdown.hours).padStart(2, '0')}H : {String(countdown.minutes).padStart(2, '0')}M : {String(countdown.seconds).padStart(2, '0')}S
            </span>
          </div>
        )}
      </div>

      {/* 2. Product Information Area */}
      <div className={styles.exclusiveInfoPanel}>
        {/* Collection Eyebrow */}
        <span className={styles.exclusiveGoldLabel}>
          {isPreBookingMode ? 'PRE-BOOKING ALLOCATION' : product.collectionName || product.category?.name || 'EXCLUSIVE RACK'}
        </span>

        {/* Product Title */}
        <h3 className={styles.exclusiveItemTitle}>
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* Description */}
        <p className={styles.exclusiveItemDesc}>
          {product.tagline || product.shortDesc || 'Curated silhouette in limited production.'}
        </p>

        {/* Price */}
        <div className={styles.exclusivePrice}>{formattedPrice}</div>

        {/* Minimal Size Selector */}
        <div className={styles.sizeSelectionBlock}>
          <div className={styles.sizeLabelRow}>
            <span className={styles.sizeLabelTitle}>SELECT SIZE</span>
          </div>
          <div className={styles.sizeGrid}>
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`${styles.sizeButton} ${selectedSize === size ? styles.sizeButtonSelected : ''}`}
                onClick={() => setSelectedSize(size)}
                aria-label={`Select size ${size}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory & Allocation Block */}
        <div className={styles.editionBlock}>
          <div className={styles.editionHeader}>
            <span className={styles.editionTitle}>
              {isPreBookingMode ? 'ALLOCATION CUSTODY' : 'LIMITED EDITION'}
            </span>
            <span className={styles.noRestockTag}>
              {isPreBookingMode ? 'RESERVE BEFORE LAUNCH' : 'NO RESTOCKING'}
            </span>
          </div>
          <div className={styles.editionMetaRow}>
            {isPreBookingMode ? (
              <>
                <span>Allocation of {maxPreBookingLimit}</span>
                <span className={styles.editionDot}>•</span>
                <span style={{ color: '#c8a46a', fontWeight: 600 }}>{preBookingRemaining} allocations remain</span>
              </>
            ) : (
              <>
                <span>Edition of {product.maxEdition || 100}</span>
                <span className={styles.editionDot}>•</span>
                <span>{actualAvailableStock > 0 ? `${actualAvailableStock} PIECES REMAIN` : 'SOLD OUT'}</span>
              </>
            )}
          </div>
          <div className={styles.stockProgressBar}>
            <div
              className={styles.stockProgressFill}
              style={{
                width: `${isPreBookingMode ? preBookingPercent : Math.min(100, Math.max(10, (actualAvailableStock / 100) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Non-intrusive Inline Editorial Feedback */}
        {inlineFeedback && <div className={styles.inlineFeedbackMessage}>{inlineFeedback}</div>}

        {/* Product Actions Row (Pre-Booking: PRE-BOOK NOW + Bell Icon | Normal: BUY NOW + Wishlist) */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.buyNowButton}
            onClick={handleBuyNow}
            style={{ flex: 1 }}
          >
            {isPreBookingMode ? 'PRE BOOK NOW' : 'BUY NOW'}
          </button>

          {!isPreBookingMode && (
            <div className={styles.iconActionsGroup}>
              {/* Wishlist Button */}
              <button
                type="button"
                className={`${styles.iconActionButton} ${wishlisted ? styles.iconActive : ''}`}
                onClick={handleWishlist}
                aria-label="Add to wishlist"
                title="Add to Wishlist"
              >
                <Heart size={16} className={wishlisted ? styles.heartFilled : ''} />
              </button>

              {/* Compare Button */}
              <button
                type="button"
                className={`${styles.iconActionButton} ${inCompare ? styles.iconActive : ''}`}
                onClick={handleCompare}
                aria-label="Add to compare"
                title="Compare Product"
              >
                <ArrowLeftRight size={16} />
              </button>

              {/* Add to Cart Button */}
              <button
                type="button"
                className={styles.iconActionButton}
                onClick={handleAddToCart}
                aria-label="Add to cart"
                title="Add to Cart"
              >
                <ShoppingBag size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Pre-Booking 3 Benefit Icons & Modal Trigger */}
        {isPreBookingMode && (
          <div className={styles.vaultPreBookBenefitsArea}>
            <div className={styles.vaultBenefitsGrid}>

              <div className={styles.vaultBenefitCell}>
                <ShieldCheck size={13} className={styles.vaultBenefitIcon} />
                <span>SECURED ALLOCATION</span>
              </div>
              <div className={styles.vaultBenefitCell}>
                <Tag size={13} className={styles.vaultBenefitIcon} />
                <span>PRE-BOOK PRICE</span>
              </div>
              <div className={styles.vaultBenefitCell}>
                <Rocket size={13} className={styles.vaultBenefitIcon} />
                <span>EARLY DISPATCH</span>
              </div>
            </div>

            <div className={styles.vaultPreBookLinks}>
              <button
                type="button"
                onClick={() => setIsBenefitsModalOpen(true)}
                className={styles.vaultLinkBtn}
              >
                PRE-BOOKING BENEFITS →
              </button>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className={styles.vaultLinkBtnSecondary}
              >
                TERMS & CONDITIONS →
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Benefits & Terms Modals */}
      <PreBookingBenefitsModal
        isOpen={isBenefitsModalOpen}
        onClose={() => setIsBenefitsModalOpen(false)}
        productName={product.name}
      />
      <PreBookingTermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />
    </div>
  );
}
