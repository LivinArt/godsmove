'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import styles from './ExclusiveRackImage.module.css';

interface ExclusiveRackImageProps {
  product: {
    name: string;
    enableImageToggle?: boolean;
    frontImageUrl?: string | null;
    backImageUrl?: string | null;
    defaultImageSide?: 'front' | 'back' | string;
    images?: { url: string }[] | string[];
  };
}

export default function ExclusiveRackImage({ product }: ExclusiveRackImageProps) {
  const { enableImageToggle, frontImageUrl, backImageUrl, defaultImageSide, images, name } = product;

  const defaultSide: 'front' | 'back' = defaultImageSide === 'back' ? 'back' : 'front';
  const [currentSide, setCurrentSide] = useState<'front' | 'back'>(defaultSide);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const canToggle = !!(enableImageToggle && frontImageUrl && backImageUrl);

  // Resolve the active image URL using the priority chain
  const activeImage = canToggle
    ? (currentSide === 'back'
        ? (backImageUrl || frontImageUrl)
        : (frontImageUrl || backImageUrl))
    : (Array.isArray(images)
        ? (typeof images[0] === 'string' ? images[0] : (images[0] as { url: string })?.url)
        : undefined)
    || '/images/placeholder.png';

  const toggle = useCallback(() => {
    if (!canToggle || isTransitioning) return;
    setIsTransitioning(true);
    // Brief fade-out, then flip
    setTimeout(() => {
      setCurrentSide((prev) => (prev === 'front' ? 'back' : 'front'));
      setIsTransitioning(false);
    }, 220);
  }, [canToggle, isTransitioning]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      className={`${styles.wrapper} ${canToggle ? styles.interactive : ''}`}
      onClick={canToggle ? toggle : undefined}
      onKeyDown={canToggle ? handleKeyDown : undefined}
      role={canToggle ? 'button' : undefined}
      tabIndex={canToggle ? 0 : undefined}
      aria-label={canToggle ? 'Toggle between front and back views' : undefined}
    >
      {/* Product Image */}
      <div className={`${styles.imageWrap} ${isTransitioning ? styles.fading : ''}`}>
        <Image
          src={activeImage as string}
          alt={`${name} — ${currentSide} view`}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Helper pill — only when toggle is available */}
      {canToggle && (
        <div className={styles.helpPill} aria-hidden="true">
          <span className={styles.helpText}>Tap to see the other side</span>
        </div>
      )}
    </div>
  );
}
