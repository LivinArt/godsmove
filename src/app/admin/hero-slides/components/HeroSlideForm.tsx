'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { SingleImageUploader } from '@/app/admin/products/components/SingleImageUploader';
import { createHeroSlide, deleteHeroSlide, updateHeroSlide } from '@/actions/hero-slide.actions';
import type { HeroSlide } from '@prisma/client';

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
    <form onSubmit={onSubmit} className="admin-form">
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/hero-slides" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <div className="form-grid" style={{ maxWidth: 720 }}>
        <SingleImageUploader
          label="Desktop hero image"
          description="Full-bleed landscape — dominant frame."
          value={image || null}
          onChange={(url) => setImage(url ?? '')}
        />

        <SingleImageUploader
          label="Mobile hero image (optional)"
          description="Vertical crop. Falls back to desktop if empty."
          value={mobileImage}
          onChange={setMobileImage}
        />

        <label className="form-field">
          <span className="form-label">Eyebrow</span>
          <input className="form-input" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} required maxLength={120} />
        </label>

        <label className="form-field">
          <span className="form-label">Headline</span>
          <input className="form-input" value={headline} onChange={(e) => setHeadline(e.target.value)} required maxLength={200} />
        </label>

        <label className="form-field" style={{ gridColumn: '1 / -1' }}>
          <span className="form-label">Narrative</span>
          <textarea
            className="form-input"
            rows={5}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            required
            maxLength={1200}
          />
        </label>

        <label className="form-field">
          <span className="form-label">CTA label</span>
          <input className="form-input" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} required maxLength={80} />
        </label>

        <label className="form-field">
          <span className="form-label">CTA link</span>
          <input className="form-input" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} required maxLength={500} />
        </label>

        <label className="form-field">
          <span className="form-label">Alignment</span>
          <select className="form-input" value={alignment} onChange={(e) => setAlignment(e.target.value)}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">Overlay intensity ({overlayOpacity.toFixed(2)})</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
          />
        </label>

        <label className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span className="form-label" style={{ margin: 0 }}>Active on storefront</span>
        </label>
      </div>

      {error && (
        <p style={{ color: 'var(--admin-danger)', marginTop: 16, fontSize: 14 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
        <button type="submit" className="btn-primary" disabled={pending || !image}>
          {pending ? <Loader2 size={18} className="animate-spin" /> : edit ? 'Save changes' : 'Create slide'}
        </button>
        {edit && (
          <button type="button" className="btn-secondary" onClick={onDelete} disabled={pending} style={{ color: 'var(--admin-danger)' }}>
            <Trash2 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
