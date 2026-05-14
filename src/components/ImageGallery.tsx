'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './ImageGallery.module.css';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

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
            src={images[activeIndex]}
            alt={`${alt} - Image ${activeIndex + 1}`}
            width={800}
            height={1000}
            className={styles.mainImage}
            priority
          />
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
