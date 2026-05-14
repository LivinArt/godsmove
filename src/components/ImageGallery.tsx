'use client';

import { useState } from 'react';
import Image from 'next/image';
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

  // If toggle is enabled, override the main image display
  const hasToggle = enableToggle && frontImage && backImage;
  let currentImageUrl = images[activeIndex];
  if (hasToggle && activeIndex === 0) { // Apply toggle only to the first/main view
    const defaultIsFront = defaultSide === 'front';
    const showFront = defaultIsFront ? !isFlipped : isFlipped;
    currentImageUrl = showFront ? frontImage : backImage;
  }

  return (
    <div className={styles.gallery}>
      <div className={styles.thumbnails}>
        {images.map((img, i) => (
          <button
            key={i}
            className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ''}`}
            onClick={() => setActiveIndex(i)}
            aria-label={`View image ${i + 1}`}
          >
            <Image
              src={img}
              alt={`${alt} thumbnail ${i + 1}`}
              width={80}
              height={100}
              style={{ objectFit: 'cover' }}
            />
          </button>
        ))}
      </div>
      <div className={styles.main}>
        <div className={styles.imageWrap}>
          <Image
            src={currentImageUrl}
            alt={`${alt} - Image ${activeIndex + 1}`}
            width={800}
            height={1000}
            className={`${styles.mainImage} ${isFlipped ? styles.flipped : ''}`}
            priority
          />
          {hasToggle && activeIndex === 0 && (
            <button
              className={styles.imageToggleBtn}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFlipped(!isFlipped);
              }}
              style={{
                position: 'absolute',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(10, 10, 10, 0.6)',
                backdropFilter: 'blur(8px)',
                color: '#F5F1E8',
                padding: '10px 20px',
                borderRadius: '30px',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 10,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(10, 10, 10, 0.85)';
                e.currentTarget.style.borderColor = 'rgba(200, 164, 106, 0.4)';
                e.currentTarget.style.color = '#C8A46A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(10, 10, 10, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#F5F1E8';
              }}
            >
              {isFlipped 
                ? (defaultSide === 'front' ? 'Tap to See Front' : 'Tap to See Back') 
                : (defaultSide === 'front' ? 'Tap to See Back' : 'Tap to See Front')}
            </button>
          )}
        </div>
        <div className={styles.dots}>
          {images.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
