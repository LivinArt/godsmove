'use client';

import React from 'react';
import { SingleImageUploader } from './SingleImageUploader';
import { ImageUploader } from './ImageUploader';
import type { ProductImageInput } from '@/lib/validations/product';

interface MediaManagerProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  images: ProductImageInput[];
  setImages: React.Dispatch<React.SetStateAction<ProductImageInput[]>>;
}

export function MediaManager({
  formData,
  setFormData,
  images,
  setImages
}: MediaManagerProps) {
  return (
    <section className="admin-card" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
        5. Visual Media Asset Manager
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Cover Image & Hover Image */}
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

        {/* Gallery Images */}
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

        {/* Optional Ambient Video */}
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
