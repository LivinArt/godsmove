'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2, Info } from 'lucide-react';
import { UpsertProductSchema, type UpsertProductInput, type FormVariantInput, type ProductImageInput } from '@/lib/validations/product';
import { upsertProductRecord } from '@/actions/product.actions';
import { ImageUploader } from './ImageUploader';
import { SingleImageUploader } from './SingleImageUploader';
import { VariantManager } from './VariantManager';
import Link from 'next/link';

interface ProductFormProps {
  initialData?: any; // The full product object from DB, if editing
  categories: { id: string; name: string }[];
  drops: { id: string; name: string; slug: string }[];
}

export function ProductForm({ initialData, categories, drops }: ProductFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<UpsertProductInput>>({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    tagline: initialData?.tagline || '',
    shortDesc: initialData?.shortDesc || '',
    description: initialData?.description || '',
    symbolism: initialData?.symbolism || '',
    status: initialData?.status || 'DRAFT',
    isFeatured: initialData?.isFeatured || false,
    categoryId: initialData?.categoryId || categories[0]?.id || '',
    dropId: initialData?.dropId || '',
    isExclusiveRack: initialData?.isExclusiveRack || false,
    enableImageToggle: initialData?.enableImageToggle || false,
    frontImageUrl: initialData?.frontImageUrl || '',
    backImageUrl: initialData?.backImageUrl || '',
    defaultImageSide: initialData?.defaultImageSide || 'front',
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
  });

  // Complex State
  const [images, setImages] = useState<ProductImageInput[]>(
    initialData?.images?.map((img: any) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      position: img.position,
      isCover: img.isCover,
    })) || []
  );

  const [variants, setVariants] = useState<FormVariantInput[]>(
    initialData?.variants?.map((v: any) => ({
      sku: v.sku,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex,
      price: Number(v.price),
      comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
      position: v.position,
      isActive: v.isActive,
      initialStock: v.inventory?.totalStock || 0,
    })) || []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const generateSlug = () => {
    if (!formData.name) return;
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const payload: UpsertProductInput = {
        ...(formData as any),
        dropId: formData.dropId || null,
        images,
        variants,
      };

      // Client-side Zod validation
      const validated = UpsertProductSchema.parse(payload);
      
      await upsertProductRecord(validated);
      router.push('/admin/products');
      
    } catch (err: any) {
      console.error(err);
      if (err.errors) {
        // Zod error formatting
        setError(err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '));
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setIsPending(false);
    }
  };

  // Find selected drop for SKU generation prefix
  const selectedDrop = drops.find(d => d.id === formData.dropId);

  return (
    <form onSubmit={handleSubmit} style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div 
        className="page-header" 
        style={{ 
          position: 'sticky', 
          top: '16px', 
          zIndex: 10, 
          background: 'var(--admin-surface)', 
          padding: '16px 24px', 
          borderRadius: '12px', 
          border: '1px solid var(--admin-border)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          marginBottom: '32px'
        }}
      >
        <div className="flex gap-3">
          <Link href="/admin/products" className="btn-secondary" style={{ padding: '8px', border: 'none', background: 'transparent' }}>
            <ArrowLeft className="w-5 h-5 text-muted" />
          </Link>
          <h1 className="page-title" style={{ margin: 0, alignSelf: 'center' }}>
            {initialData ? 'Edit Product' : 'New Product'}
          </h1>
        </div>
        <div className="flex gap-3">
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="admin-input admin-select"
            style={{ width: 'auto', padding: '8px 36px 8px 12px' }}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active (Published)</option>
            <option value="HIDDEN">Hidden</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Product
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <Info className="w-4 h-4" style={{ marginTop: '2px' }} />
          <div>{error}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Main Content Column */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Basic Info */}
          <section className="admin-card">
            <h2 style={{ fontSize: '16px', marginBottom: '20px' }}>Basic Information</h2>
            
            <div className="form-row" style={{ marginBottom: '20px' }}>
              <div>
                <label className="form-label">Product Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={!formData.slug ? generateSlug : undefined}
                  required
                  className="admin-input"
                />
              </div>
              <div>
                <label className="form-label">Slug *</label>
                <div className="flex gap-2">
                  <input
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                    className="admin-input"
                  />
                  <button type="button" onClick={generateSlug} className="btn-secondary" style={{ padding: '0 12px' }}>
                    Auto
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tagline</label>
              <input
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="e.g. First contact."
                className="admin-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Short Description</label>
              <textarea
                name="shortDesc"
                value={formData.shortDesc}
                onChange={handleChange}
                rows={2}
                className="admin-input admin-textarea"
                style={{ minHeight: '60px' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className="admin-input admin-textarea"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Symbolism / Cultural Context</label>
              <textarea
                name="symbolism"
                value={formData.symbolism}
                onChange={handleChange}
                rows={3}
                placeholder="The meaning behind the piece..."
                className="admin-input admin-textarea"
                style={{ minHeight: '80px' }}
              />
            </div>
          </section>

          {/* Media */}
          <section className="admin-card">
            <h2 style={{ fontSize: '16px', marginBottom: '20px' }}>Media</h2>
            <ImageUploader images={images} onChange={setImages} />
          </section>

          {/* Variants & Inventory */}
          <section className="admin-card">
            <div className="flex-between mb-4">
              <h2 style={{ fontSize: '16px', margin: 0 }}>Variants & Inventory</h2>
            </div>
            <VariantManager 
              variants={variants} 
              onChange={setVariants} 
              productSlug={formData.slug || 'XXXX'}
              seasonPrefix={undefined}
              dropPrefix={selectedDrop?.slug?.toUpperCase() || undefined}
            />
          </section>
          
        </div>

        {/* Sidebar Column */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Organization */}
          <section className="admin-card">
            <h2 style={{ fontSize: '16px', marginBottom: '20px' }}>Organization</h2>
            
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="admin-input admin-select"
              >
                <option value="" disabled>Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Drop Collection</label>
              <select
                name="dropId"
                value={formData.dropId || ''}
                onChange={handleChange}
                className="admin-input admin-select"
              >
                <option value="">No drop (Permanent Collection)</option>
                {drops.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2" style={{ paddingTop: '16px', borderTop: '1px solid var(--admin-border)' }}>
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent)', marginTop: '2px' }}
              />
              <label htmlFor="isFeatured" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--admin-text)' }}>
                Feature on homepage
              </label>
            </div>

            <div className="flex gap-2" style={{ paddingTop: '12px' }}>
              <input
                type="checkbox"
                id="isExclusiveRack"
                name="isExclusiveRack"
                checked={formData.isExclusiveRack}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent)', marginTop: '2px' }}
              />
              <label htmlFor="isExclusiveRack" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--admin-text)' }}>
                Feature in Exclusive Rack
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px', fontWeight: 400 }}>
                  Show this product in the flagship homepage showcase.
                </div>
              </label>
            </div>
          </section>

          {/* Product Presentation Settings */}
          <section className="admin-card">
            <div className="flex gap-2 mb-4">
              <h2 style={{ fontSize: '16px', margin: 0 }}>Presentation Settings</h2>
            </div>

            <div className="flex gap-2" style={{ paddingBottom: formData.enableImageToggle ? '16px' : '0', borderBottom: formData.enableImageToggle ? '1px solid var(--admin-border)' : 'none' }}>
              <input
                type="checkbox"
                id="enableImageToggle"
                name="enableImageToggle"
                checked={formData.enableImageToggle}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: 'var(--admin-accent)', marginTop: '2px' }}
              />
              <label htmlFor="enableImageToggle" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--admin-text)' }}>
                Enable Front/Back Image Toggle
              </label>
            </div>

            {formData.enableImageToggle && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <SingleImageUploader
                    label="Front View Image"
                    description="Upload the front-facing product visual."
                    value={formData.frontImageUrl}
                    onChange={(url) => setFormData((prev) => ({ ...prev, frontImageUrl: url ?? '' }))}
                  />
                  <SingleImageUploader
                    label="Back View Image"
                    description="Upload the reverse-side product visual."
                    value={formData.backImageUrl}
                    onChange={(url) => setFormData((prev) => ({ ...prev, backImageUrl: url ?? '' }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Default Display Side</label>
                  <select
                    name="defaultImageSide"
                    value={formData.defaultImageSide}
                    onChange={handleChange}
                    className="admin-input admin-select"
                  >
                    <option value="front">Front</option>
                    <option value="back">Back</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* SEO Metadata */}
          <section className="admin-card">
            <div className="flex gap-2 mb-4">
              <h2 style={{ fontSize: '16px', margin: 0 }}>Search Engine</h2>
              <Info className="w-4 h-4 text-muted" />
            </div>
            
            <div className="form-group">
              <label className="form-label">SEO Title</label>
              <input
                name="seoTitle"
                value={formData.seoTitle}
                onChange={handleChange}
                placeholder={formData.name || 'Title'}
                className="admin-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">SEO Description</label>
              <textarea
                name="seoDescription"
                value={formData.seoDescription}
                onChange={handleChange}
                rows={4}
                placeholder={formData.shortDesc || 'Description'}
                className="admin-input admin-textarea"
                style={{ minHeight: '100px' }}
              />
            </div>
          </section>

        </div>
      </div>
    </form>
  );
}
