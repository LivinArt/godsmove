'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Share2, ArrowRight, Truck, ShieldCheck, Check, Bell } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import { resolveProductImages } from '@/lib/image-resolver';
import {
  getPreBookingOfferDetails,
  useSynchronizedCountdown,
  formatExpectedDispatchText,
} from '@/lib/launch-engine';
import { PreBookingBenefitsModal } from '@/components/prebooking/PreBookingModals';
import PreBookingQuickSelectModal from '@/components/home/PreBookingQuickSelectModal';
import { PreBookingNotifyButton } from './PreBookingNotifyButton';
import styles from './PreBookingProductCard.module.css';


export interface PreBookingProductCardProps {
  product: any;
  index?: number;
  theme?: 'default' | 'dark';
  showCta?: boolean;
  isDominant?: boolean;
}

export default function PreBookingProductCard({
  product,
  index = 0,
}: PreBookingProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [benefitsModalOpen, setBenefitsModalOpen] = useState(false);
  const [quickSelectOpen, setQuickSelectOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isBellRegistered, setIsBellRegistered] = useState(false);

  const { toggleWishlist, isInWishlist, showToast } = useStore();
  const { requireAuth } = useAuth();

  useEffect(() => {
    setMounted(true);
    let isCancelled = false;
    import('@/actions/prebooking-interest.actions').then(({ checkPreBookingInterestAction }) => {
      checkPreBookingInterestAction(product.id).then((res) => {
        if (!isCancelled && res.isRegistered) {
          setIsBellRegistered(true);
        }
      });
    });
    return () => { isCancelled = true; };
  }, [product.id]);

  const wishlisted = mounted ? isInWishlist(product.id) : false;

  // Launch Engine synchronized countdown
  const countdown = useSynchronizedCountdown(product.launchDateTime);

  // Price calculations
  const baseVariant = product.variants?.[0];
  const rawPrice = baseVariant?.price ? Number(baseVariant.price) : Number(product.price || 0);
  const comparePrice = baseVariant?.comparePrice
    ? Number(baseVariant.comparePrice)
    : product.comparePrice
    ? Number(product.comparePrice)
    : null;

  const offerDetails = getPreBookingOfferDetails(product, rawPrice);
  const displayPrice = offerDetails.isOfferActive ? offerDetails.effectivePrice : rawPrice;
  const originalPrice = offerDetails.originalPrice || comparePrice || rawPrice;
  const hasDiscount = originalPrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  // Allocation & Scarcity metrics (using authentic launch engine data)
  const maxPreBookingLimit = product.maxPreBooking != null ? Number(product.maxPreBooking) : 1000;
  const currentPreBooked = Number(product.currentPreBookings || 0);
  const allocationsRemaining = Math.max(0, maxPreBookingLimit - currentPreBooked);
  const preBookingPercent = Math.min(100, Math.max(8, Math.round((currentPreBooked / maxPreBookingLimit) * 100)));

  // Image resolution
  const { enableImageToggle, defaultImageSide } = product;
  const { frontImage, backImage } = resolveProductImages(product);
  const defaultIsFront = defaultImageSide === 'front';
  const showFront = defaultIsFront ? !isFlipped : isFlipped;
  const currentImageUrl =
    enableImageToggle && frontImage !== '/images/placeholder.svg' && backImage !== '/images/placeholder.svg'
      ? showFront
        ? frontImage
        : backImage
      : frontImage;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof window !== 'undefined') {
        const url = `${window.location.origin}/product/${product.slug}`;
        navigator.clipboard.writeText(url);
        setCopiedShare(true);
        showToast('Link Copied', 'Pre-Booking reservation link copied.');
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth('wishlist', () => toggleWishlist(product), { type: 'wishlist', product });
  };

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* 1. HERO IMAGE WITH OVERLAYS */}
      <div className={styles.imageWrapper}>
        <Link href={`/product/${product.slug}`} tabIndex={-1}>
          <Image
            src={currentImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
            className={styles.image}
            priority={index < 4}
          />
        </Link>

        {/* Image Toggle Front/Back (if configured) */}
        {enableImageToggle && frontImage && backImage && (
          <button
            type="button"
            className={styles.imageToggleBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFlipped(!isFlipped);
            }}
          >
            {isFlipped ? 'Tap to See Front' : 'Tap to See Back'}
          </button>
        )}

        {/* Top Left: Luxury Badge */}
        <span className={styles.topBadge}>
          PRE BOOKING
        </span>

        {/* Top Right: Share Action Button */}
        <div className={styles.topActions}>
          <button
            type="button"
            className={`${styles.iconBtn} ${copiedShare ? styles.iconActive : ''}`}
            onClick={handleShare}
            aria-label="Share allocation link"
            title="Share Allocation"
          >
            {copiedShare ? <Check size={13} /> : <Share2 size={13} />}
          </button>
        </div>


        {/* Bottom Image Overlay: Simplified Translucent Reservation & Countdown Panel */}
        <div className={styles.reservationPanel}>
          <div className={styles.panelTopRow}>
            {/* Left: LAUNCHES IN + Countdown Tiles */}
            <div className={styles.countdownBlock}>
              <span className={styles.countdownLabel}>
                <span className={styles.liveDot} />
                LAUNCHES IN
              </span>
              <div className={styles.countdownTiles}>
                <div className={styles.countdownTile}>
                  <span className={styles.tileNum}>{String(countdown.days).padStart(2, '0')}</span>
                  <span className={styles.tileUnit}>D</span>
                </div>
                <div className={styles.countdownTile}>
                  <span className={styles.tileNum}>{String(countdown.hours).padStart(2, '0')}</span>
                  <span className={styles.tileUnit}>H</span>
                </div>
                <div className={styles.countdownTile}>
                  <span className={styles.tileNum}>{String(countdown.minutes).padStart(2, '0')}</span>
                  <span className={styles.tileUnit}>M</span>
                </div>
                <div className={styles.countdownTile}>
                  <span className={styles.tileNum}>{String(countdown.seconds).padStart(2, '0')}</span>
                  <span className={styles.tileUnit}>S</span>
                </div>
              </div>
            </div>

            {/* Right: Allocation Scarcity Counter (X / MAX RESERVED) */}
            <div className={styles.allocationBlock}>
              <span className={styles.allocationReserved}>
                {currentPreBooked} / {maxPreBookingLimit} RESERVED
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* 2. PRODUCT DETAILS (BELOW IMAGE) */}
      <div className={styles.details}>
        {/* Collection Name */}
        <span className={styles.collectionName}>
          {product.collectionName || product.category?.name || 'Exclusive Allocation'}
        </span>

        {/* Product Name */}
        <Link href={`/product/${product.slug}`} className={styles.productTitle}>
          {product.name}
        </Link>

        {/* Price Row */}
        <div className={styles.priceRow}>
          <span className={styles.sellingPrice}>
            ₹{displayPrice.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className={styles.comparePrice}>
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          {offerDetails.isOfferActive && offerDetails.savingsBadgeText ? (
            <span className={styles.discountBadge}>
              {offerDetails.savingsBadgeText}
            </span>
          ) : hasDiscount && discountPercent > 0 ? (
            <span className={styles.discountBadge}>
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        {/* Two Micro Information Rows with Luxury Icons */}
        <div className={styles.microInfoStack}>
          <div className={styles.microInfoRow}>
            <Truck size={12} className={styles.microInfoIcon} />
            <span>
              Expected Dispatch: {formatExpectedDispatchText(product.expectedDispatch, product.customExpectedDispatch)}
            </span>
          </div>
          <div className={styles.microInfoRow}>
            <ShieldCheck size={12} className={styles.microInfoIcon} />
            <span>Allocation Reserved only after payment</span>
          </div>
        </div>

        {/* Benefits & Terms Modal Trigger Link */}
        <div className={styles.benefitsTriggerRow}>
          <button
            type="button"
            className={styles.benefitsTriggerLink}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setBenefitsModalOpen(true);
            }}
          >
            <ShieldCheck size={12} className={styles.benefitsTriggerIcon} />
            <span>BENEFITS & TERMS</span>
            <span className={styles.benefitsTriggerArrow}>→</span>
          </button>
        </div>

        {/* 3. Primary Action Row: PRE-BOOK NOW + Single Square Bell Icon */}
        <div className={styles.primaryActionRow}>
          <button
            type="button"
            className={styles.preBookBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickSelectOpen(true);
            }}
          >
            <span>PRE BOOK NOW</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
          <PreBookingNotifyButton product={product} showSubText={true} />
        </div>
      </div>





      {/* Render Luxury Benefits Modal */}
      <PreBookingBenefitsModal
        isOpen={benefitsModalOpen}
        onClose={() => setBenefitsModalOpen(false)}
        product={product}
      />

      {/* Render Quick Size Select Drawer */}
      <PreBookingQuickSelectModal
        isOpen={quickSelectOpen}
        onClose={() => setQuickSelectOpen(false)}
        product={product}
      />
    </div>
  );
}
