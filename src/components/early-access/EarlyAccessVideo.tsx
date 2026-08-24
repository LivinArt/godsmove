'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './EarlyAccessVideo.module.css';

interface EarlyAccessVideoProps {
  backgroundImage?: string;
}

export default function EarlyAccessVideo({
  backgroundImage = '/images/early-access/early-access-hero.jpg',
}: EarlyAccessVideoProps) {
  const [videoError, setVideoError] = useState(true); // Default to uploaded campaign background image
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check reduced motion setting
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return (
    <div className={styles.videoWrap}>
      {/* Primary Background Image Layer (Uploaded GODSMOVƎ Campaign Visual) */}
      <div
        className={`${styles.posterLayer} ${videoLoaded && !videoError ? styles.posterFaded : ''}`}
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden="true"
      />

      {/* Optional Cinematic Video Layer if supported */}
      {!videoError && !prefersReducedMotion && (
        <video
          ref={videoRef}
          className={`${styles.videoElement} ${videoLoaded ? styles.videoLoaded : ''}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          aria-hidden="true"
        >
          <source src="/videos/early-access-campaign.webm" type="video/webm" />
          <source src="/videos/early-access-campaign.mp4" type="video/mp4" />
        </video>
      )}

      {/* Dark Readability Gradient Overlay */}
      <div className={styles.darkOverlay} />
      
      {/* Subtle Grain Texture Overlay */}
      <div className={styles.grainOverlay} />
    </div>
  );
}
