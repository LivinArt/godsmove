'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Tag, Rocket } from 'lucide-react';
import { useSynchronizedCountdown } from '@/lib/launch-engine';
import styles from './PreBookingProductCard.module.css';

interface PreBookingProductCardProps {
  product: any;
  onOpenBenefits?: (productName: string) => void;
  onPreBookClick?: (product: any) => void;
}

export default function PreBookingProductCard({
  product,
  onOpenBenefits,
  onPreBookClick,
}: PreBookingProductCardProps) {
  if (!product) return null;

  const countdown = useSynchronizedCountdown(product.launchDateTime);

  // Price formatting
  const price = product.mrp
    ? Number(product.mrp)
    : product.variants?.[0]?.price
    ? Number(product.variants[0].price)
    : 0;
  const comparePrice = product.comparePrice
    ? Number(product.comparePrice)
    : product.variants?.[0]?.comparePrice
    ? Number(product.variants[0].comparePrice)
    : null;

  const primaryImage =
    product.frontImageUrl ||
    product.images?.[0]?.url ||
    '/images/placeholder.svg';

  const categoryName = product.category?.name || 'STATEMENT PIECE';

  return (
    <article className={styles.card}>
      {/* 1. Image Container (Clean, no countdown overlays) */}
      <div className={styles.imageWrap}>
        <span className={styles.statusBadge}>PRE-BOOKING OPEN</span>
        <Link href={`/product/${product.slug}`} className={styles.imageLink}>
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
            className={styles.productImage}
          />
        </Link>
      </div>

      {/* 2. Product Information Area */}
      <div className={styles.infoPanel}>
        <div className={styles.metaRow}>
          <span className={styles.categoryTag}>{categoryName}</span>
        </div>

        <h3 className={styles.productTitle}>
          <Link href={`/product/${product.slug}`} className={styles.productTitleLink}>
            {product.name}
          </Link>
        </h3>

        {/* Price Row */}
        <div className={styles.priceRow}>
          <span className={styles.currentPrice}>₹{price.toLocaleString('en-IN')}</span>
          {comparePrice && comparePrice > price && (
            <>
              <span className={styles.comparePrice}>₹{comparePrice.toLocaleString('en-IN')}</span>
              <span className={styles.savingsTag}>
                SAVE ₹{(comparePrice - price).toLocaleString('en-IN')}
              </span>
            </>
          )}
        </div>

        {/* 3. Compact Horizontal Countdown */}
        {!countdown.isCompleted && product.launchDateTime && (
          <div className={styles.countdownBar}>
            <span className={styles.countdownLabel}>LAUNCHES IN</span>
            <div className={styles.countdownDigits}>
              <span>
                {String(countdown.days).padStart(2, '0')}<span className={styles.countdownUnit}>D</span>
              </span>
              <span>
                {String(countdown.hours).padStart(2, '0')}<span className={styles.countdownUnit}>H</span>
              </span>
              <span>
                {String(countdown.minutes).padStart(2, '0')}<span className={styles.countdownUnit}>M</span>
              </span>
              <span>
                {String(countdown.seconds).padStart(2, '0')}<span className={styles.countdownUnit}>S</span>
              </span>
            </div>
          </div>
        )}

        {/* 4. Action CTA Buttons */}
        <div className={styles.ctaRow}>
          <button
            type="button"
            className={styles.primaryCta}
            onClick={() => onPreBookClick?.(product)}
          >
            <span>PRE-BOOK NOW</span>
            <ArrowRight size={13} />
          </button>
          <button
            type="button"
            className={styles.benefitsCta}
            onClick={() => onOpenBenefits?.(product.name)}
          >
            BENEFITS
          </button>
        </div>

        {/* 5. 3 Benefit Icons Underneath CTA */}
        <div className={styles.benefitsRow}>
          <div className={styles.benefitBlock}>
            <ShieldCheck size={14} className={styles.benefitIcon} />
            <span className={styles.benefitText}>SECURED<br />ALLOCATION</span>
          </div>
          <div className={styles.benefitBlock}>
            <Tag size={14} className={styles.benefitIcon} />
            <span className={styles.benefitText}>PRE-BOOK<br />PRICE</span>
          </div>
          <div className={styles.benefitBlock}>
            <Rocket size={14} className={styles.benefitIcon} />
            <span className={styles.benefitText}>EARLY<br />DISPATCH</span>
          </div>
        </div>
      </div>
    </article>
  );
}
