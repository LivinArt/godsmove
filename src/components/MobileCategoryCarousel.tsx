'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './MobileCategoryCarousel.module.css';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  description?: string;
}

interface MobileCategoryCarouselProps {
  categories: CategoryItem[];
}

export default function MobileCategoryCarousel({ categories }: MobileCategoryCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate for seamless infinite loop
  const doubled = [...categories, ...categories];

  const pauseAnimation = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <div
      className={styles.carouselOuter}
      onTouchStart={pauseAnimation}
      onMouseDown={pauseAnimation}
    >
      <div
        ref={trackRef}
        className={`${styles.carouselTrack} ${isPaused ? styles.paused : ''}`}
      >
        {doubled.map((cat, i) => {
          // Pick a fallback image per category type
          let img = '/images/campaign/editorial-01.png';
          if (cat.slug === 'tees') img = '/images/products/tee-black.png';
          else if (cat.slug === 'hoodies') img = '/images/products/tee-charcoal.png';
          else if (cat.slug === 'accessories') img = '/images/products/tee-ivory.png';
          if (cat.imageUrl) img = cat.imageUrl;

          return (
            <Link
              key={`${cat.id}-${i}`}
              href={`/category/${cat.slug}`}
              className={styles.carouselCard}
              aria-label={cat.name}
              tabIndex={i < categories.length ? 0 : -1} // only first set is accessible
            >
              <div className={styles.cardImageWrap}>
                <Image
                  src={img}
                  alt={cat.name}
                  fill
                  sizes="220px"
                  style={{ objectFit: 'cover' }}
                  className={styles.cardImage}
                />
                <div className={styles.cardOverlay} />
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardName}>{cat.name}</h3>
                <span className={styles.cardCta}>Enter ›</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
