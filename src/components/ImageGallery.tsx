'use client';

import { useState, useRef, type CSSProperties } from 'react';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/image-resolver';
import styles from './ImageGallery.module.css';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  enableToggle?: boolean;
  frontImage?: string | null;
  backImage?: string | null;
  defaultSide?: 'front' | 'back';
}

export default function ImageGallery({ 
  images, alt, enableToggle, frontImage, backImage, defaultSide = 'front' 
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<CSSProperties>({});

  // ── Mobile swipe tracking ──
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const resolvedImages = (images || []).map(img => resolveImageUrl(img));
  const resolvedFront = resolveImageUrl(frontImage);
  const resolvedBack = resolveImageUrl(backImage);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.15)',
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({});
  };

  // ── Touch handlers for mobile swipe ──
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (deltaX > deltaY && deltaX > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwiping.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 40;
    if (deltaX < -SWIPE_THRESHOLD) {
      // Swipe left → next image
      setActiveIndex(prev => (prev + 1) % resolvedImages.length);
    } else if (deltaX > SWIPE_THRESHOLD) {
      // Swipe right → prev image
      setActiveIndex(prev => (prev - 1 + resolvedImages.length) % resolvedImages.length);
    }
    isSwiping.current = false;
  };

  const hasToggle = enableToggle && resolvedFront !== '/images/placeholder.svg' && resolvedBack !== '/images/placeholder.svg' && resolvedFront !== resolvedBack;
  let currentImageUrl = resolvedImages[activeIndex] || '/images/placeholder.svg';
  if (hasToggle && activeIndex === 0) {
    const defaultIsFront = defaultSide === 'front';
    const showFront = defaultIsFront ? !isFlipped : isFlipped;
    currentImageUrl = showFront ? resolvedFront : resolvedBack;
  }

  return (
    <div className={styles.editorialGalleryWrap}>
      {/* Primary Dominant Hero Frame */}
      <div className={styles.dominantHeroFrame}>
        <div 
          className={styles.heroImageContainer}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            key={currentImageUrl}
            src={currentImageUrl}
            alt={`${alt} - Dominant View`}
            width={1000}
            height={1250}
            className={`${styles.heroImage} ${styles.fadeTransition}`}
            style={zoomStyle}
            priority
          />
          {hasToggle && activeIndex === 0 && (
            <button
              type="button"
              className={styles.imageToggleBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFlipped(!isFlipped);
              }}
            >
              {isFlipped 
                ? (defaultSide === 'front' ? 'View Front Silhouette' : 'View Back Silhouette') 
                : (defaultSide === 'front' ? 'View Back Silhouette' : 'View Front Silhouette')}
            </button>
          )}

          {/* Mobile swipe hint — fades out after first interaction */}
          {resolvedImages.length > 1 && (
            <div className={styles.mobileSwipeHint} aria-hidden="true">
              <span className={styles.swipeArrowLeft}>‹</span>
              <span className={styles.swipeArrowRight}>›</span>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Asymmetrical Editorial Collage Supporting Grid */}
      {resolvedImages.length > 1 && (
        <div className={styles.asymmetricalCollageGrid}>
          {resolvedImages.map((img, i) => {
            const isHero = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                className={`${styles.collageTile} ${isHero ? styles.collageTileActive : ''}`}
                onClick={() => setActiveIndex(i)}
                aria-label={`Select lookbook angle ${i + 1}`}
              >
                <div className={styles.collageTileInner}>
                  <Image
                    src={img}
                    alt={`${alt} angle ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 15vw"
                    style={{ objectFit: 'cover' }}
                    className={styles.tileImage}
                  />
                  <span className={styles.tileTag}>0{i + 1}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile & Desktop: Dot Pagination */}
      {resolvedImages.length > 1 && (
        <div className={styles.mobileDotsWrap}>
          {resolvedImages.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.mobileDot} ${i === activeIndex ? styles.mobileDotActive : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
