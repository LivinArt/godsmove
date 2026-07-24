'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { SingleImageUploader } from '@/app/admin/products/components/SingleImageUploader';
import { createHeroSlide, deleteHeroSlide, updateHeroSlide } from '@/actions/hero-slide.actions';
import type { HeroSlide } from '@prisma/client';
import styles from './HeroSlideForm.module.css';

type Props = {
  initialData?: HeroSlide;
};

export default function HeroSlideForm({ initialData }: Props) {
  const router = useRouter();
  const edit = Boolean(initialData);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [image, setImage] = useState(initialData?.image ?? '');
  const [mobileImage, setMobileImage] = useState<string | null>(initialData?.mobileImage ?? null);
  const [eyebrow, setEyebrow] = useState(initialData?.eyebrow ?? 'SS26 / DROP 001');
  const [headline, setHeadline] = useState(initialData?.headline ?? 'Worn With Intent.');
  const [narrative, setNarrative] = useState(
    initialData?.narrative ??
      'Heavy in symbolism.\nLimited in quantity.\nBuilt for custodians, not consumers.'
  );
  const [ctaLabel, setCtaLabel] = useState(initialData?.ctaLabel ?? 'ENTER THE DROP');
  const [ctaHref, setCtaHref] = useState(initialData?.ctaHref ?? '/drops');
  const [alignment, setAlignment] = useState(initialData?.alignment ?? 'left');
  const [overlayOpacity, setOverlayOpacity] = useState(initialData?.overlayOpacity ?? 0.45);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (edit && initialData) {
        await updateHeroSlide(initialData.id, {
          image,
          mobileImage,
          eyebrow,
          headline,
          narrative,
          ctaLabel,
          ctaHref,
          alignment: alignment as 'left' | 'center' | 'right',
          overlayOpacity,
          isActive,
        });
      } else {
        await createHeroSlide({
          image,
          mobileImage,
          eyebrow,
          headline,
          narrative,
          ctaLabel,
          ctaHref,
          alignment: alignment as 'left' | 'center' | 'right',
          overlayOpacity,
          isActive,
        });
      }
      router.push('/admin/hero-slides');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!initialData) return;
    if (!window.confirm('Delete this hero slide?')) return;
    setPending(true);
    setError(null);
    try {
      await deleteHeroSlide(initialData.id);
      router.push('/admin/hero-slides');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.canvas}>
      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.topBar}>
          <Link href="/admin/hero-slides" className={styles.backLink}>
            <ArrowLeft size={15} strokeWidth={2} aria-hidden />
            Back
          </Link>
        </div>

        <div className={styles.editorGrid}>
          <div className={styles.colMedia}>
            <section className={styles.card} aria-labelledby="hero-editor-media-title">
              <header className={styles.cardHeader}>
                <span className={styles.cardKicker}>01 — Visual</span>
                <h2 id="hero-editor-media-title" className={styles.cardTitle}>
                  Media
                </h2>
              </header>
              <div className={styles.cardBody}>
                <div className={styles.mediaGrid}>
                  <div className={styles.mediaMount}>
                    <div className={styles.mediaMountInner}>
                      <SingleImageUploader
                        label="Desktop hero image"
                        description="Full-bleed landscape — dominant frame."
                        value={image || null}
                        onChange={(url) => setImage(url ?? '')}
                        guidance={{
                          orientation: 'Cinematic Widescreen (16:9)',
                          recommendedDimensions: '2560 × 1440 px',
                          aspectRatio: '16:9',
                          maxFileSize: '15 MB',
                          acceptedFormats: 'JPG, WEBP, MP4',
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.mediaMount}>
                    <div className={styles.mediaMountInner}>
                      <SingleImageUploader
                        label="Mobile hero image (optional)"
                        description="Vertical crop. Falls back to desktop if empty."
                        value={mobileImage}
                        onChange={setMobileImage}
                        guidance={{
                          orientation: 'Mobile Portrait (9:16)',
                          recommendedDimensions: '1080 × 1920 px',
                          aspectRatio: '9:16',
                          maxFileSize: '10 MB',
                          acceptedFormats: 'JPG, WEBP, MP4',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className={styles.colStack}>
            <section className={styles.card} aria-labelledby="hero-editor-copy-title">
              <header className={styles.cardHeader}>
                <span className={styles.cardKicker}>02 — Narrative</span>
                <h2 id="hero-editor-copy-title" className={styles.cardTitle}>
                  Copy
                </h2>
              </header>
              <div className={styles.cardBody}>
                <div className={styles.row2}>
                  <label className={styles.field}>
                    <span className={styles.label}>Eyebrow</span>
                    <input
                      className={styles.input}
                      value={eyebrow}
                      onChange={(e) => setEyebrow(e.target.value)}
                      required
                      maxLength={120}
                      autoComplete="off"
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Headline</span>
                    <input
                      className={styles.input}
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      required
                      maxLength={200}
                      autoComplete="off"
                    />
                  </label>
                </div>
                <label className={styles.field}>
                  <span className={styles.label}>Narrative</span>
                  <textarea
                    className={styles.textarea}
                    rows={5}
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    required
                    maxLength={1200}
                  />
                </label>
              </div>
            </section>

            <section className={styles.card} aria-labelledby="hero-editor-cta-title">
              <header className={styles.cardHeader}>
                <span className={styles.cardKicker}>03 — Conversion</span>
                <h2 id="hero-editor-cta-title" className={styles.cardTitle}>
                  CTA
                </h2>
              </header>
              <div className={styles.cardBody}>
                <div className={styles.row2}>
                  <label className={styles.field}>
                    <span className={styles.label}>CTA label</span>
                    <input
                      className={styles.input}
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      required
                      maxLength={80}
                      autoComplete="off"
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>CTA link</span>
                    <input
                      className={styles.input}
                      value={ctaHref}
                      onChange={(e) => setCtaHref(e.target.value)}
                      required
                      maxLength={500}
                      autoComplete="off"
                    />
                  </label>
                </div>
              </div>
            </section>

            <section className={styles.card} aria-labelledby="hero-editor-present-title">
              <header className={styles.cardHeader}>
                <span className={styles.cardKicker}>04 — Storefront</span>
                <h2 id="hero-editor-present-title" className={styles.cardTitle}>
                  Presentation
                </h2>
              </header>
              <div className={styles.cardBody}>
                <div className={styles.row2}>
                  <label className={styles.field}>
                    <span className={styles.label}>Alignment</span>
                    <select
                      className={styles.select}
                      value={alignment}
                      onChange={(e) => setAlignment(e.target.value)}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                  <div className={styles.field}>
                    <div className={styles.rangeRow}>
                      <div className={styles.rangeMeta}>
                        <span className={styles.label}>Overlay intensity</span>
                        <span className={styles.rangeValue}>{overlayOpacity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        className={styles.range}
                        min={0}
                        max={1}
                        step={0.05}
                        value={overlayOpacity}
                        onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                        aria-valuemin={0}
                        aria-valuemax={1}
                        aria-valuenow={overlayOpacity}
                        aria-label="Overlay intensity"
                      />
                    </div>
                  </div>
                </div>
                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className={styles.toggleLabel}>Active on storefront</span>
                </label>
              </div>
            </section>
          </div>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actionDock}>
          <p className={styles.actionDockMeta}>
            {edit ? 'Revision · commit to publish' : 'New frame · define campaign'}
          </p>
          <div className={styles.actionButtons}>
            {edit ? (
              <button
                type="button"
                className={styles.btnDelete}
                onClick={onDelete}
                disabled={pending}
              >
                <Trash2 size={16} strokeWidth={2} aria-hidden />
                Delete
              </button>
            ) : null}
            <button type="submit" className={styles.btnSave} disabled={pending || !image}>
              {pending ? (
                <Loader2 size={18} className="animate-spin" aria-hidden />
              ) : null}
              {pending ? 'Saving…' : edit ? 'Save changes' : 'Create slide'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
