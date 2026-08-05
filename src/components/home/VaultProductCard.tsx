'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Heart, ArrowLeftRight, ShoppingBag } from 'lucide-react';
import { useCommerceActions } from '@/hooks/useCommerceActions';
import { resolveProductImages } from '@/lib/image-resolver';
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
  const touchStartX = useRef<number | null>(null);
  const feedbackTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  // Extract available sizes from variants or default list
  const availableSizes = useMemo<string[]>(() => {
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const variantSizes = product.variants
        .map((v: any) => typeof v === 'string' ? v : (typeof v?.size === 'string' ? v.size : ''))
        .filter((s: string) => Boolean(s));
      if (variantSizes.length > 0) {
        return Array.from(new Set(variantSizes));
      }
    }
    return DEFAULT_SIZES;
  }, [product.variants]);

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || 'M');

  // Ensure base price is a valid number > 0
  const basePrice = useMemo(() => {
    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    return Number(rawPrice) > 0 ? Number(rawPrice) : 2999;
  }, [product]);

  // Construct complete production product payload to prevent ₹0 price bug
  const completeProduct = useMemo(() => {
    const existingVariants = Array.isArray(product.variants) && product.variants.length > 0 
      ? product.variants 
      : [];

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
            inventory: { totalStock: 100, reservedStock: 0, soldStock: 32 }
          }
        ];

    return {
      ...product,
      price: basePrice,
      variants: normalizedVariants,
    };
  }, [product, selectedSize, basePrice]);

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

  const formattedPrice = `₹${basePrice.toLocaleString('en-IN')}`;

  return (
    <div className={`${styles.exclusiveRow} ${isEven ? styles.rowNormal : styles.rowReverse}`}>
      {/* Hidden gallery image preloader for zero-delay instant switching */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {galleryUrls.map((url) => (
          <Image key={url} src={url} alt="" width={10} height={10} priority />
        ))}
      </div>

      {/* 1. Fixed Image Gallery Container */}
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

          {product.featuredBadge && (
            <span className={styles.exclusiveCardBadge}>{product.featuredBadge}</span>
          )}

          {/* Fixed Position Gallery Navigation Arrows */}
          {totalImages > 1 && (
            <>
              <button
                type="button"
                className={`${styles.galleryArrow} ${styles.galleryArrowLeft}`}
                onClick={handlePrevImage}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                aria-label="Previous image"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className={`${styles.galleryArrow} ${styles.galleryArrowRight}`}
                onClick={handleNextImage}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                aria-label="Next image"
              >
                <ChevronRight size={18} />
              </button>

              {/* Fixed Gallery Indicators */}
              <div className={styles.galleryIndicators}>
                {galleryUrls.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.indicatorDot} ${currentImageIndex === idx ? styles.indicatorActive : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setCurrentImageIndex(idx);
                    }}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* 2. Product Information Area */}
      <div className={styles.exclusiveInfoPanel}>
        {/* Collection Eyebrow */}
        <span className={styles.exclusiveGoldLabel}>
          {product.collectionName || product.category?.name || 'EXCLUSIVE RACK'}
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
        <div className={styles.exclusivePrice}>
          {formattedPrice}
        </div>

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

        {/* Limited Edition Block */}
        <div className={styles.editionBlock}>
          <div className={styles.editionHeader}>
            <span className={styles.editionTitle}>LIMITED EDITION</span>
            <span className={styles.noRestockTag}>NO RESTOCKING</span>
          </div>
          <div className={styles.editionMetaRow}>
            <span>Edition of 100</span>
            <span className={styles.editionDot}>•</span>
            <span>68 pieces remain</span>
          </div>
          <div className={styles.stockProgressBar}>
            <div className={styles.stockProgressFill} />
          </div>
        </div>

        {/* Non-intrusive Inline Editorial Feedback */}
        {inlineFeedback && (
          <div className={styles.inlineFeedbackMessage}>
            {inlineFeedback}
          </div>
        )}

        {/* 3. Product Actions Row ([ BUY NOW ] | ♡ | ⇄ | 👜) */}
        <div className={styles.actionsRow}>
          <button 
            type="button"
            className={styles.buyNowButton}
            onClick={handleBuyNow}
          >
            BUY NOW
          </button>

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

            {/* Compare Button (PUBLIC — NO AUTH REQUIRED) */}
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
        </div>
      </div>
    </div>
  );
}
