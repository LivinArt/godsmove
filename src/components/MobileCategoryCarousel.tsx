'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const scrollDirectionRef = useRef<1 | -1>(1); // 1 = right, -1 = left
  const [isInteracting, setIsInteracting] = useState(false);

  // Gentle auto-scroll step
  const autoScrollStep = useCallback(() => {
    const el = containerRef.current;
    if (!el || isInteracting) return;

    // Respect user's reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;

    // Move gently by 0.35px per frame
    const delta = 0.35 * scrollDirectionRef.current;
    el.scrollLeft += delta;

    // Check bounds & reverse direction smoothly
    if (el.scrollLeft >= maxScroll - 1) {
      scrollDirectionRef.current = -1;
    } else if (el.scrollLeft <= 1) {
      scrollDirectionRef.current = 1;
    }

    animFrameRef.current = requestAnimationFrame(autoScrollStep);
  }, [isInteracting]);

  // Pause auto-scroll on user touch/drag/scroll, resume after 3.5s inactivity
  const handleInteraction = useCallback(() => {
    setIsInteracting(true);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 3500);
  }, []);

  // Start auto-scroll loop when not interacting
  useEffect(() => {
    if (!isInteracting) {
      animFrameRef.current = requestAnimationFrame(autoScrollStep);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isInteracting, autoScrollStep]);

  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className={styles.carouselOuter}>
      <div
        ref={containerRef}
        className={styles.carouselContainer}
        onTouchStart={handleInteraction}
        onTouchMove={handleInteraction}
        onMouseDown={handleInteraction}
        onScroll={handleInteraction}
      >
        {categories.map((cat) => {
          let img = '/images/campaign/editorial-01.png';
          if (cat.slug === 'tees') img = '/images/products/tee-black.png';
          else if (cat.slug === 'hoodies') img = '/images/products/tee-charcoal.png';
          else if (cat.slug === 'accessories') img = '/images/products/tee-ivory.png';
          if (cat.imageUrl) img = cat.imageUrl;

          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={styles.carouselCard}
              aria-label={cat.name}
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
                <span className={styles.cardCta}>Enter Room ›</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

