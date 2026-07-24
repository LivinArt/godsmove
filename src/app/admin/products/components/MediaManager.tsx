'use client';

import React, { useState } from 'react';
import { SingleImageUploader } from './SingleImageUploader';
import { ImageUploader } from './ImageUploader';
import type { ProductImageInput, FormVariantInput } from '@/lib/validations/product';
import { Palette, Info } from 'lucide-react';

interface MediaManagerProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  images: ProductImageInput[];
  setImages: React.Dispatch<React.SetStateAction<ProductImageInput[]>>;
  variants?: FormVariantInput[];
}

export function MediaManager({
  formData,
  setFormData,
  images,
  setImages,
  variants = []
}: MediaManagerProps) {
  // Extract unique color names from variants
  const colorNames = Array.from(
    new Set(variants.map((v) => v.color?.trim()).filter((c): c is string => Boolean(c) && c !== ''))
  );

  // Toggle for color-wise media
  const [hasColorMedia, setHasColorMedia] = useState<boolean>(() => {
    if (formData.hasColorMedia !== undefined) return Boolean(formData.hasColorMedia);
    return colorNames.length > 0;
  });

  const handleToggleColorMedia = (val: boolean) => {
    setHasColorMedia(val);
    setFormData((prev: any) => ({ ...prev, hasColorMedia: val }));
  };

  // Guidance card helper
  const ImageGuidelinesBox = () => (
    <div
      style={{
        padding: '12px 16px',
        background: 'rgba(200, 164, 106, 0.05)',
        border: '1px solid rgba(200, 164, 106, 0.2)',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#c8a46a',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px 24px',
        lineHeight: 1.5,
        marginBottom: '16px'
      }}
    >
      <span><strong style={{ color: '#fff' }}>Orientation:</strong> Portrait</span>
      <span><strong style={{ color: '#fff' }}>Aspect Ratio:</strong> 4:5</span>
      <span><strong style={{ color: '#fff' }}>Recommended Resolution:</strong> 1600 × 2000 px</span>
      <span><strong style={{ color: '#fff' }}>Max File Size:</strong> 10 MB</span>
      <span><strong style={{ color: '#fff' }}>Formats:</strong> JPG, PNG, WEBP</span>
    </div>
  );

  return (
    <section className="admin-card" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: '#fff' }}>
            5. Visual Media Asset Manager
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--admin-muted)', marginTop: '4px', margin: 0 }}>
            Upload visual assets and high-resolution campaign galleries.
          </p>
        </div>

        {/* Color Variants Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--admin-surface-2)', padding: '8px 16px', border: '1px solid var(--admin-border)', borderRadius: '4px' }}>
          <Palette size={16} style={{ color: '#c8a46a' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Does this product have colors?</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => handleToggleColorMedia(true)}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '2px',
                border: '1px solid',
                borderColor: hasColorMedia ? '#c8a46a' : 'var(--admin-border)',
                background: hasColorMedia ? '#c8a46a' : 'transparent',
                color: hasColorMedia ? '#000' : 'var(--admin-muted)',
                cursor: 'pointer'
              }}
            >
              YES
            </button>
            <button
              type="button"
              onClick={() => handleToggleColorMedia(false)}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '2px',
                border: '1px solid',
                borderColor: !hasColorMedia ? '#c8a46a' : 'var(--admin-border)',
                background: !hasColorMedia ? '#c8a46a' : 'transparent',
                color: !hasColorMedia ? '#000' : 'var(--admin-muted)',
                cursor: 'pointer'
              }}
            >
              NO
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* CASE 1: COLOR-WISE MEDIA MANAGEMENT */}
        {hasColorMedia && colorNames.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(200, 164, 106, 0.08)', borderLeft: '3px solid #c8a46a' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#c8a46a', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
                Color-Wise Gallery System Active
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--admin-muted)', margin: 0 }}>
                Upload independent galleries for each of the {colorNames.length} color variants ({colorNames.join(', ')}). When customers select a color on the storefront, the gallery switches seamlessly.
              </p>
            </div>

            {colorNames.map((colorName) => {
              const colorTag = `color:${colorName.toLowerCase()}`;
              
              // Find cover image for this color
              const colorCoverImg = images.find(img => img.alt === `${colorTag}:cover` || img.alt === `color:${colorName}:cover`)?.url ||
                (colorName === colorNames[0] ? formData.frontImageUrl : '');

              // Find gallery images for this color
              const colorGalleryImages = images.filter(img => img.alt === `${colorTag}:gallery` || img.alt === `color:${colorName}:gallery` || (img.alt && img.alt.includes(colorName)));

              const handleColorCoverChange = (url: string | null) => {
                if (!url) {
                  setImages(prev => prev.filter(img => img.alt !== `${colorTag}:cover`));
                  if (colorName === colorNames[0]) setFormData((prev: any) => ({ ...prev, frontImageUrl: '' }));
                  return;
                }
                const updated = images.filter(img => img.alt !== `${colorTag}:cover`);
                setImages([...updated, { url, alt: `${colorTag}:cover`, position: 0, isCover: colorName === colorNames[0] }]);
                if (colorName === colorNames[0]) setFormData((prev: any) => ({ ...prev, frontImageUrl: url }));
              };

              const handleColorGalleryChange = (newColorImgs: ProductImageInput[]) => {
                const nonColorImgs = images.filter(img => !(img.alt && (img.alt === `${colorTag}:gallery` || img.alt.includes(colorName))));
                const taggedImgs = newColorImgs.map((img, idx) => ({
                  ...img,
                  alt: `${colorTag}:gallery`,
                  position: idx + 1
                }));
                setImages([...nonColorImgs, ...taggedImgs]);
              };

              return (
                <div key={colorName} style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '6px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#c8a46a', display: 'inline-block' }} />
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                      {colorName} Variant Gallery
                    </h3>
                  </div>

                  <ImageGuidelinesBox />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }} className="pim-grid-col2">
                    <div>
                      <label className="form-label">
                        {colorName} Cover Image <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <SingleImageUploader
                        value={colorCoverImg}
                        onChange={handleColorCoverChange}
                        label={`${colorName} Cover`}
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        {colorName} Gallery Images
                      </label>
                      <ImageUploader
                        images={colorGalleryImages}
                        onChange={handleColorGalleryChange}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* CASE 2: STANDARD SINGLE-GALLERY WORKFLOW (UNCHANGED) */
          <>
            <ImageGuidelinesBox />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="pim-grid-col2">
              <div>
                <label className="form-label">
                  Cover Image URL <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ display: 'block', fontSize: '9px', color: 'var(--admin-muted)', textTransform: 'none', marginTop: '2px' }}>
                    Primary visual shown on the catalog product card and main product page view.
                  </span>
                </label>
                <SingleImageUploader
                  value={formData.frontImageUrl || ''}
                  onChange={(url) => setFormData((prev: any) => ({ ...prev, frontImageUrl: url }))}
                  label="Cover visual"
                />
              </div>

              <div>
                <label className="form-label">
                  Hover Image URL (Optional)
                  <span style={{ display: 'block', fontSize: '9px', color: 'var(--admin-muted)', textTransform: 'none', marginTop: '2px' }}>
                    Secondary visual loaded when client hovers over product card (defaults to Gallery Image #2).
                  </span>
                </label>
                <SingleImageUploader
                  value={formData.backImageUrl || ''}
                  onChange={(url) => setFormData((prev: any) => ({ ...prev, backImageUrl: url }))}
                  label="Hover back visual"
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                Gallery Images <span style={{ color: '#ef4444' }}>*</span>
                <span style={{ display: 'block', fontSize: '9px', color: 'var(--admin-muted)', textTransform: 'none', marginTop: '2px', marginBottom: '10px' }}>
                  Collection of secondary product images rendered inside the product detail carousel.
                </span>
              </label>
              <ImageUploader
                images={images}
                onChange={setImages}
              />
            </div>
          </>
        )}

        {/* Ambient Product Video */}
        <div>
          <label className="form-label">
            Ambient Product Video (Optional)
            <span style={{ display: 'block', fontSize: '9px', color: 'var(--admin-muted)', textTransform: 'none', marginTop: '2px' }}>
              Direct URL to a looping video (.mp4) showcased in the luxury gallery slider.
            </span>
          </label>
          <input
            type="text"
            name="collectionHeroVideo"
            value={formData.collectionHeroVideo || ''}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, collectionHeroVideo: e.target.value }))}
            className="admin-input"
            placeholder="e.g. https://domain.com/videos/product-broll.mp4"
            style={{ marginTop: '6px' }}
          />
        </div>

      </div>
    </section>
  );
}
