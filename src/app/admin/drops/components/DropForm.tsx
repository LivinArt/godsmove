'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  Loader2,
  Info,
  Search,
  Zap,
  Star,
  Timer,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { UpsertDropSchema, type UpsertDropInput } from '@/lib/validations/drop';
import { createDrop, updateDrop } from '@/actions/drop.actions';
import { SingleImageUploader } from '@/app/admin/products/components/SingleImageUploader';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface DropFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    manifesto: string | null;
    heroImageUrl: string | null;
    launchAt: Date | null;
    endAt: Date | null;
    status: string;
    isFeatured: boolean;
    showCountdown: boolean;
    maxUnits: number | null;
    products: ProductOption[];
  };
  allProducts: ProductOption[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a JS Date (or null) for a datetime-local input value */
function toDatetimeLocal(date: Date | null): string {
  if (!date) return '';
  // datetime-local expects "YYYY-MM-DDTHH:MM"
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Convert datetime-local string to ISO string for Zod */
function toISOString(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const STATUS_OPTIONS = [
  { value: 'DRAFT',     label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'LIVE',      label: 'Live' },
  { value: 'ENDED',     label: 'Ended' },
  { value: 'ARCHIVED',  label: 'Archived' },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function DropForm({ initialData, allProducts }: DropFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName]               = useState(initialData?.name ?? '');
  const [slug, setSlug]               = useState(initialData?.slug ?? '');
  const [tagline, setTagline]         = useState(initialData?.tagline ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [manifesto, setManifesto]     = useState(initialData?.manifesto ?? '');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(initialData?.heroImageUrl ?? null);
  const [launchAt, setLaunchAt]       = useState(toDatetimeLocal(initialData?.launchAt ?? null));
  const [endAt, setEndAt]             = useState(toDatetimeLocal(initialData?.endAt ?? null));
  const [status, setStatus]           = useState(initialData?.status ?? 'DRAFT');
  const [isFeatured, setIsFeatured]   = useState(initialData?.isFeatured ?? false);
  const [showCountdown, setShowCountdown] = useState(initialData?.showCountdown ?? true);
  const [maxUnits, setMaxUnits]       = useState<string>(
    initialData?.maxUnits != null ? String(initialData.maxUnits) : ''
  );
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(initialData?.products.map((p) => p.id) ?? [])
  );

  // ── Product filter ──────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [allProducts, productSearch]);

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAutoSlug = () => {
    if (name && !initialData) setSlug(generateSlug(name));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const payload = {
        id: initialData?.id,
        name,
        slug,
        tagline: tagline || null,
        description: description || null,
        manifesto: manifesto || null,
        heroImageUrl: heroImageUrl || null,
        launchAt: toISOString(launchAt),
        endAt: toISOString(endAt),
        status,
        isFeatured,
        showCountdown,
        maxUnits: maxUnits ? parseInt(maxUnits, 10) : null,
        productIds: Array.from(selectedProductIds),
      };

      // Client-side Zod parse
      const validated = UpsertDropSchema.parse(payload);

      if (initialData?.id) {
        await updateDrop({ ...validated, id: initialData.id });
      } else {
        await createDrop(validated);
      }

      router.push('/admin/drops');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      if (err?.errors) {
        setError(
          err.errors
            .map((e: any) => `${e.path.join('.')}: ${e.message}`)
            .join(' · ')
        );
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setIsPending(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} style={{ paddingBottom: 80 }}>
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div
        className="page-header"
        style={{
          position: 'sticky',
          top: 16,
          zIndex: 10,
          background: 'var(--admin-surface)',
          padding: '16px 24px',
          borderRadius: 12,
          border: '1px solid var(--admin-border)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link
            href="/admin/drops"
            className="btn-secondary"
            style={{ padding: 8, border: 'none', background: 'transparent' }}
          >
            <ArrowLeft style={{ width: 20, height: 20 }} />
          </Link>
          <h1 className="page-title" style={{ margin: 0 }}>
            {initialData ? 'Edit Drop' : 'New Drop'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="admin-input admin-select"
            style={{ width: 'auto', padding: '8px 36px 8px 12px' }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? (
              <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
            ) : (
              <Save style={{ width: 16, height: 16 }} />
            )}
            {isPending ? 'Saving…' : 'Save Drop'}
          </button>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <Info style={{ width: 16, height: 16, marginTop: 2 }} />
          <div>{error}</div>
        </div>
      )}

      {/* ── Two-column layout ────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 32,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        {/* ── Main column ───────────────────────────────────────────────────── */}
        <div
          style={{
            flex: '2 1 600px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Basic Information */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 20, margin: '0 0 20px' }}>
              Basic Information
            </h2>

            <div className="form-row" style={{ marginBottom: 20 }}>
              <div>
                <label className="form-label">Drop Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleAutoSlug}
                  required
                  placeholder="PRIMAL ARCHETYPES // DROP 001"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="form-label">Slug *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    placeholder="primal-archetypes-drop-001"
                    className="admin-input"
                  />
                  <button
                    type="button"
                    onClick={() => setSlug(generateSlug(name))}
                    className="btn-secondary"
                    style={{ padding: '0 12px', flexShrink: 0 }}
                    title="Auto-generate slug from name"
                  >
                    Auto
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="First contact."
                className="admin-input"
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Full editorial description of this drop…"
                className="admin-input admin-textarea"
              />
            </div>
          </section>

          {/* Narrative / Manifesto */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Manifesto</h2>
            <p style={{ fontSize: 13, color: 'var(--admin-muted)', marginBottom: 16 }}>
              The brand philosophy and story behind this release. Displayed on the drop page.
            </p>
            <textarea
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              rows={8}
              placeholder="Write the launch story, cultural context, and intent behind this collection…"
              className="admin-input admin-textarea"
              style={{ minHeight: 180 }}
            />
          </section>

          {/* Hero Media */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Hero Image</h2>
            <p style={{ fontSize: 13, color: 'var(--admin-muted)', marginBottom: 16 }}>
              The primary campaign image shown on the drop landing page and collection previews.
            </p>
            <SingleImageUploader
              label="Hero Campaign Image"
              description="Recommended: 1920×1080px or wider. PNG, JPEG, WebP."
              value={heroImageUrl}
              onChange={setHeroImageUrl}
            />
          </section>

          {/* Product Assignment */}
          <section className="admin-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>
                  <Package
                    size={16}
                    style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}
                  />
                  Product Assignment
                </h2>
                <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0 }}>
                  {selectedProductIds.size} product
                  {selectedProductIds.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              {selectedProductIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProductIds(new Set())}
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: 12 }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Product search */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--admin-muted)',
                }}
              />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products…"
                className="admin-input"
                style={{ paddingLeft: 34 }}
              />
            </div>

            {/* Product list */}
            <div
              style={{
                maxHeight: 320,
                overflowY: 'auto',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
              }}
            >
              {filteredProducts.length === 0 ? (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: 'var(--admin-muted)',
                    fontSize: 13,
                  }}
                >
                  No products match your search.
                </div>
              ) : (
                filteredProducts.map((product, i) => {
                  const selected = selectedProductIds.has(product.id);
                  const isLast = i === filteredProducts.length - 1;
                  return (
                    <label
                      key={product.id}
                      htmlFor={`product-${product.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderBottom: isLast ? 'none' : '1px solid var(--admin-border)',
                        cursor: 'pointer',
                        background: selected ? 'var(--admin-accent-dim)' : 'transparent',
                        transition: 'background 0.12s',
                      }}
                    >
                      <input
                        id={`product-${product.id}`}
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleProduct(product.id)}
                        style={{ accentColor: 'var(--admin-accent)', width: 15, height: 15 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: selected ? 600 : 400,
                            color: selected ? 'var(--admin-accent)' : 'var(--admin-text)',
                          }}
                        >
                          {product.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--admin-muted)',
                            fontFamily: 'var(--admin-mono)',
                          }}
                        >
                          {product.slug}
                        </div>
                      </div>
                      <span
                        className={
                          product.status === 'ACTIVE'
                            ? 'badge badge-green'
                            : 'badge badge-grey'
                        }
                        style={{ fontSize: 10 }}
                      >
                        {product.status}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div
          style={{
            flex: '1 1 300px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Launch Settings */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, margin: '0 0 20px' }}>
              <Zap size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Launch Settings
            </h2>

            <div className="form-group">
              <label className="form-label">Launch Date &amp; Time</label>
              <input
                type="datetime-local"
                value={launchAt}
                onChange={(e) => setLaunchAt(e.target.value)}
                className="admin-input"
              />
              <p style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 4 }}>
                Status auto-derives from this date. Leave blank for manual control.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date &amp; Time</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="admin-input"
              />
              <p style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 4 }}>
                When the drop window closes. Leave blank for no end date.
              </p>
            </div>
          </section>

          {/* Visibility */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, margin: '0 0 20px' }}>
              <Star size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Visibility
            </h2>

            <label
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                cursor: 'pointer',
                paddingBottom: 16,
                borderBottom: '1px solid var(--admin-border)',
                marginBottom: 16,
              }}
            >
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: 'var(--admin-accent)',
                  marginTop: 2,
                }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--admin-text)' }}>
                  Feature on Homepage
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--admin-muted)',
                    marginTop: 3,
                    lineHeight: 1.4,
                  }}
                >
                  Showcases this drop as the primary homepage campaign.
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showCountdown}
                onChange={(e) => setShowCountdown(e.target.checked)}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: 'var(--admin-accent)',
                  marginTop: 2,
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--admin-text)' }}>
                    Show Countdown Timer
                  </div>
                  <Timer size={14} color="var(--admin-warning)" />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--admin-muted)',
                    marginTop: 3,
                    lineHeight: 1.4,
                  }}
                >
                  Displays a live countdown to launch when status is Scheduled.
                </div>
              </div>
            </label>
          </section>

          {/* Scarcity */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Scarcity Controls</h2>
            <p style={{ fontSize: 13, color: 'var(--admin-muted)', marginBottom: 16 }}>
              Leave blank for unlimited availability.
            </p>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Maximum Units</label>
              <input
                type="number"
                value={maxUnits}
                onChange={(e) => setMaxUnits(e.target.value)}
                placeholder="e.g. 100"
                min={1}
                className="admin-input"
              />
            </div>
          </section>

          {/* Status info */}
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--admin-surface-2)',
              border: '1px solid var(--admin-border)',
              borderRadius: 10,
              fontSize: 12,
              color: 'var(--admin-muted)',
              lineHeight: 1.7,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--admin-text)', marginBottom: 6 }}>
              Status auto-derivation
            </div>
            <div>🔲 No date → <strong>DRAFT</strong></div>
            <div>📅 Future date → <strong>SCHEDULED</strong></div>
            <div>🟢 Between dates → <strong>LIVE</strong></div>
            <div>⬛ Past end date → <strong>ENDED</strong></div>
            <div>📦 Manual → <strong>ARCHIVED</strong></div>
          </div>
        </div>
      </div>
    </form>
  );
}
