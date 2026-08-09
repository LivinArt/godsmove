'use client';

import React from 'react';
import {
  Layers,
  Scissors,
  Brush,
  ShieldCheck,
  Sparkles,
  Package,
  Tag,
  Award,
  Flame,
  Eye,
  Crown,
  Ruler,
  Heart,
  Diamond,
} from 'lucide-react';
import styles from './ProductStorytelling.module.css';

export interface StorytellingBlock {
  id?: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  icon?: string;
}

export interface StorytellingArchiveSpec {
  id?: string;
  label?: string;
  value?: string;
}

export interface ProductStorytellingData {
  detailsEyebrow?: string;
  detailsTitle?: string;
  detailsIntro?: string;
  detailsBlocks?: StorytellingBlock[];
  archiveEyebrow?: string;
  archiveTitle?: string;
  archiveBadgeText?: string;
  archiveSpecs?: StorytellingArchiveSpec[];
}

interface ProductStorytellingProps {
  product: any;
  themeMode?: 'dark' | 'light';
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  Layers,
  Scissors,
  Brush,
  ShieldCheck,
  Sparkles,
  Package,
  Tag,
  Award,
  Flame,
  Eye,
  Crown,
  Ruler,
  Heart,
  Diamond,
};

/**
 * Derives storytelling visual theme directly from product channel / destination.
 * Exclusive Rack (and Pre-Booking Exclusive Rack) -> Dark Theme
 * Drops (and Pre-Booking Drops) -> Light Theme
 */
export function getStorytellingTheme(product: any): 'dark' | 'light' {
  if (!product) return 'light';
  const isExclusive = Boolean(
    product.isExclusiveRack ||
    product.channel === 'EXCLUSIVE_RACK'
  );
  return isExclusive ? 'dark' : 'light';
}

export default function ProductStorytelling({ product, themeMode }: ProductStorytellingProps) {
  // 1. If product or product.storytelling is missing, render nothing.
  if (!product || !product.storytelling) return null;

  const storytelling: ProductStorytellingData = product.storytelling;

  // 2. Determine theme mode based on product type
  const effectiveTheme = themeMode || getStorytellingTheme(product);

  // 3. Extract Details & Symbolism
  const detailsEyebrow = storytelling.detailsEyebrow || 'DESIGN SPECIFICATION';
  const detailsTitle = storytelling.detailsTitle || 'PRODUCT DETAILS & SYMBOLISM';
  const detailsIntro = storytelling.detailsIntro || '';

  const rawBlocks = storytelling.detailsBlocks;
  const blocks: StorytellingBlock[] = Array.isArray(rawBlocks)
    ? rawBlocks.filter((b) => b && (b.eyebrow || b.heading || b.description))
    : [];

  const hasProductDetails = Boolean(detailsIntro.trim() || blocks.length > 0);

  // 4. Extract Archive Specs
  const archiveEyebrow = storytelling.archiveEyebrow || 'TECHNICAL ARCHIVE';
  const archiveTitle = storytelling.archiveTitle || 'GARMENT SPECIFICATIONS';
  const archiveBadgeText = storytelling.archiveBadgeText || '';

  const rawSpecs = storytelling.archiveSpecs;
  const specs: StorytellingArchiveSpec[] = Array.isArray(rawSpecs)
    ? rawSpecs.filter((s) => s && (s.label || s.value))
    : [];

  const hasTechnicalArchive = specs.length > 0;

  // 5. If storytelling has neither product details nor technical archive content, render nothing.
  if (!hasProductDetails && !hasTechnicalArchive) {
    return null;
  }

  const themeClass = effectiveTheme === 'dark' ? styles.darkTheme : styles.lightTheme;

  return (
    <section className={`${styles.storytellingSection} ${themeClass}`}>
      <div className={styles.storytellingContainer}>
        {/* ── 1. PRODUCT DETAILS & SYMBOLISM SECTION ── */}
        {hasProductDetails && (
          <>
            <div className={styles.header}>
              <span className={styles.eyebrow}>{detailsEyebrow}</span>
              <h2 className={styles.title}>{detailsTitle}</h2>
              <div className={styles.rule} />
              <span className={styles.subLabel}>SHORT DESCRIPTION</span>
            </div>

            {detailsIntro && (
              <div className={styles.narrative}>
                <p>{detailsIntro}</p>
              </div>
            )}

            {blocks.length > 0 && (
              <div className={styles.cardGrid}>
                {blocks.map((block, idx) => {
                  const IconComp = block.icon && ICON_MAP[block.icon] ? ICON_MAP[block.icon] : Layers;
                  const formattedIndex = String(idx + 1).padStart(2, '0');

                  return (
                    <div key={block.id || `block-${idx}`} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <span className={styles.cardIndex}>{formattedIndex}</span>
                        <div className={styles.cardIconWrap}>
                          <IconComp size={14} />
                        </div>
                      </div>
                      {block.eyebrow && <span className={styles.cardMicroLabel}>{block.eyebrow}</span>}
                      {block.heading && <h3 className={styles.cardTitle}>{block.heading}</h3>}
                      {block.description && <p className={styles.cardDesc}>{block.description}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── 2. TECHNICAL ARCHIVE SUBSECTION ── */}
        {hasTechnicalArchive && (
          <div className={styles.archiveSection}>
            {hasProductDetails && <div className={styles.archiveDivider} />}

            <div className={styles.archiveHeaderRow}>
              <div className={styles.archiveHeaderLeft}>
                <span className={styles.archiveEyebrow}>{archiveEyebrow}</span>
                <h3 className={styles.archiveTitle}>{archiveTitle}</h3>
              </div>
              {archiveBadgeText && (
                <div className={styles.archiveHeaderRight}>
                  <span className={styles.archiveBadge}>{archiveBadgeText}</span>
                </div>
              )}
            </div>

            <div className={styles.specGrid}>
              {specs.map((spec, idx) => (
                <div key={spec.id || `spec-${idx}`} className={styles.specCell}>
                  {spec.label && <span className={styles.specLabel}>{spec.label}</span>}
                  {spec.value && <span className={styles.specValue}>{spec.value}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
