'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import styles from './CinematicHero.module.css';

const AUTO_MS = 7000;

export type CinematicHeroSlide = {
  id: string;
  image: string;
  mobileImage: string | null;
  eyebrow: string;
  headline: string;
  narrative: string;
  ctaLabel: string;
  ctaHref: string;
  alignment: string;
  overlayOpacity: number;
  sortOrder?: number;
};

function overlayStyle(opacity: number): React.CSSProperties {
  const o = Math.min(0.95, Math.max(0.12, opacity));
  return {
    background: `linear-gradient(to top, rgba(10,10,10,${0.42 + o * 0.48}) 0%, rgba(10,10,10,${0.1 + o * 0.22}) 44%, rgba(10,10,10,${0.02 + o * 0.06}) 100%)`,
  };
}

function alignmentClass(alignment: string): string {
  if (alignment === 'center') return styles.alignCenter;
  if (alignment === 'right') return styles.alignRight;
  return styles.alignLeft;
}

export default function CinematicHero({ slides }: { slides: CinematicHeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const count = slides.length;
  const safeIndex = count ? Math.min(index, count - 1) : 0;
  const active = slides[safeIndex] ?? slides[0];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (count <= 1 || reduceMotion || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, [count, reduceMotion, paused, index]);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!count) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count]
  );

  const goTo = useCallback(
    (i: number) => {
      if (i >= 0 && i < count) setIndex(i);
    },
    [count]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  if (!active) return null;

  return (
    <section
      id="hero"
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="Homepage campaign"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      <div className={styles.layers} aria-hidden={false}>
        {slides.map((slide, i) => {
          const isActive = i === safeIndex;
          const mobileSrc = slide.mobileImage?.trim() || slide.image;
          return (
            <div
              key={slide.id}
              className={`${styles.layer} ${isActive ? styles.layerActive : ''}`}
              aria-hidden={!isActive}
            >
              <div className={styles.imageWrap}>
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  priority={i === 0}
                  loading={i === 0 ? undefined : 'lazy'}
                  sizes="100vw"
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  className={`${styles.imageDesktop} ${styles.imageKen}`}
                />
                <Image
                  src={mobileSrc}
                  alt=""
                  fill
                  priority={i === 0}
                  loading={i === 0 ? undefined : 'lazy'}
                  sizes="100vw"
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  className={`${styles.imageMobile} ${styles.imageKen}`}
                />
              </div>
              <div className={styles.overlay} style={overlayStyle(slide.overlayOpacity)} />
            </div>
          );
        })}
      </div>

      <div className={`${styles.content} ${alignmentClass(active.alignment)}`}>
        <div className={styles.textReveal} key={active.id}>
          <span className={`caption ${styles.eyebrow}`}>{active.eyebrow}</span>
          <h1 className={styles.headline}>{active.headline}</h1>
          <p className={styles.narrative}>{active.narrative}</p>
          <div className={styles.ctaRow}>
            <Link
              href={active.ctaHref}
              className={`btn btn-primary ${styles.heroCta}`}
              id="hero-cta"
            >
              {active.ctaLabel}
            </Link>
          </div>
        </div>
      </div>

      {count > 1 && (
        <div className={styles.controls}>
          <div className={styles.progressTrack} role="presentation" aria-hidden>
            <div
              key={`${active.id}-${safeIndex}-progress`}
              className={`${styles.progressFill} ${reduceMotion ? '' : styles.progressFillAnim}`}
              style={
                reduceMotion
                  ? undefined
                  : {
                      animationDuration: `${AUTO_MS}ms`,
                      animationPlayState: paused ? 'paused' : 'running',
                    }
              }
            />
          </div>
          <div className={styles.dots} role="tablist" aria-label="Hero slides">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Slide ${i + 1}: ${s.headline}`}
                className={`${styles.dot} ${i === safeIndex ? styles.dotActive : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.scrollHint}>
        <ArrowDown size={16} aria-hidden />
        <span>Scroll</span>
      </div>
    </section>
  );
}
