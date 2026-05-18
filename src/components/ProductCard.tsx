'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: any; // Using any here to accommodate the Prisma inclusion type without deep typing in this component
  index?: number;
  /** High-contrast typography for cards on dark section backgrounds */
  theme?: 'default' | 'dark';
}

export default function ProductCard({ product, index = 0, theme = 'default' }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useStore();
  const wishlisted = isInWishlist(product.id);
  const [isFlipped, setIsFlipped] = useState(false);

  const { enableImageToggle, frontImageUrl, backImageUrl, defaultImageSide } = product;

  // Determine current image
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

  // Determine if new (e.g., created within last 7 days)
  const isNew = product.createdAt && new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (
    <div
      className={`${styles.card} ${theme === 'dark' ? styles.cardDark : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Link href={`/product/${product.slug}`} className={styles.imageWrap}>
        <Image
          src={currentImageUrl}
          alt={product.name}
          width={600}
          height={750}
          className={`${styles.image} ${isFlipped ? styles.flipped : ''}`}
          priority={index < 4}
        />
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
              ? (defaultImageSide === 'front' ? 'Tap to See Front' : 'Tap to See Back') 
              : (defaultImageSide === 'front' ? 'Tap to See Back' : 'Tap to See Front')}
          </button>
        )}
        {isNew && (
          <span className={styles.tag}>New</span>
        )}
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
      <div className={styles.info}>
        <Link href={`/product/${product.slug}`} className={styles.name}>
          {product.name}
        </Link>
        <div className={styles.meta}>
          <span className={styles.color}>{colorName}</span>
          <div className={styles.priceRow}>
            {comparePrice && comparePrice > price && (
              <span className={styles.comparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
            )}
            <span className={styles.price}>₹{price.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
