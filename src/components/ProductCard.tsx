'use client';

import { useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { AtmosphericLockedRevealLayers } from '@/components/exclusive/AtmosphericLockedRevealLayers';
import { useAtmosphericRevealPointer } from '@/components/exclusive/useAtmosphericRevealPointer';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: any;
  index?: number;
  /** High-contrast typography for cards on dark section backgrounds */
  theme?: 'default' | 'dark';
  /** Conversion CTA for exclusive discovery pages */
  showCta?: boolean;
}

export default function ProductCard({
  product,
  index = 0,
  theme = 'default',
  showCta = false,
}: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useStore();
  const wishlisted = isInWishlist(product.id);
  const [isFlipped, setIsFlipped] = useState(false);
  const isDark = theme === 'dark';
  const revealHostRef = useRef<HTMLDivElement>(null);

  const isExclusiveUnlockListing = product.channel === 'EXCLUSIVE_UNLOCK';

  const { enableImageToggle, frontImageUrl, backImageUrl, defaultImageSide } = product;

  let currentImageUrl = product.images?.[0]?.url || '/placeholder.png';
  if (enableImageToggle && frontImageUrl && backImageUrl) {
    const defaultIsFront = defaultImageSide === 'front';
    const showFront = defaultIsFront ? !isFlipped : isFlipped;
    currentImageUrl = showFront ? frontImageUrl : backImageUrl;
  }

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

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Link href={`/product/${product.slug}`} className={styles.imageWrap}>
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
            width={600}
            height={750}
            className={`${styles.image} ${isFlipped ? styles.flipped : ''}`}
            priority={index < 4}
          />
        )}
        {enableImageToggle && frontImageUrl && backImageUrl && (
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
        {isNew && <span className={styles.tag}>New</span>}
        <button
          className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </Link>

      <div className={`${styles.info} ${isDark ? styles.infoDark : ''}`}>
        <Link href={`/product/${product.slug}`} className={styles.name}>
          {product.name}
        </Link>

        {isDark && hasDiscount && discountPercent > 0 && (
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
    </div>
  );
}
