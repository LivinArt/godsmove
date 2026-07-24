'use client';

import React from 'react';
import { SingleImageUploader } from './SingleImageUploader';

interface MerchandisingProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  badgeType: string;
  setBadgeType: (val: string) => void;
  customBadgeText: string;
  setCustomBadgeText: (val: string) => void;
}

export function Merchandising({
  formData,
  onChange,
  setFormData,
  badgeType,
  setBadgeType,
  customBadgeText,
  setCustomBadgeText
}: MerchandisingProps) {
  return (
    <section className="admin-card" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
        4. Merchandising & Badge Curation
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Feature on Homepage Checkbox */}
        <div style={{ padding: '20px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="showOnHomepage"
              name="showOnHomepage"
              checked={formData.showOnHomepage}
              onChange={onChange}
              style={{ width: '15px', height: '15px', accentColor: 'var(--admin-accent)', cursor: 'pointer' }}
            />
            <label htmlFor="showOnHomepage" style={{ fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Feature on Homepage
            </label>
          </div>
          
          {formData.showOnHomepage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <div>
                <label className="form-label">Hero Headline Slide Description</label>
                <input
                  type="text"
                  name="featuredHeadline"
                  value={formData.featuredHeadline || ''}
                  onChange={onChange}
                  className="admin-input"
                  placeholder="e.g. Autumn / Winter Capsule 2026"
                />
              </div>
              <div>
                <label className="form-label">Hero Subheadline Slide Description</label>
                <textarea
                  name="featuredDescription"
                  value={formData.featuredDescription || ''}
                  onChange={onChange}
                  rows={2}
                  className="admin-input admin-textarea"
                  placeholder="The design philosophy and campaign narrative..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Publish in Exclusive Rack Checkbox */}
        <div style={{ padding: '20px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: formData.isExclusiveRack ? '16px' : 0 }}>
            <input
              type="checkbox"
              id="isExclusiveRack"
              name="isExclusiveRack"
              checked={formData.isExclusiveRack}
              onChange={onChange}
              style={{ width: '15px', height: '15px', accentColor: 'var(--admin-accent)', cursor: 'pointer' }}
            />
            <label htmlFor="isExclusiveRack" style={{ fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Publish in Exclusive Rack
            </label>
          </div>

          {formData.isExclusiveRack && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="pim-grid-col2">
                <div>
                  <label className="form-label">Collection (Assigned in Identity)</label>
                  <div
                    className="admin-input"
                    style={{
                      background: 'var(--admin-surface)',
                      color: '#c8a46a',
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 600,
                      opacity: 0.9,
                      cursor: 'not-allowed',
                    }}
                  >
                    {formData.collectionName || 'Default Catalog'}
                  </div>
                </div>
                <div>
                  <label className="form-label">Editorial Badge Selection</label>
                  <select
                    value={badgeType}
                    onChange={e => setBadgeType(e.target.value)}
                    className="admin-input admin-select"
                  >
                    <option value="None">No Badge</option>
                    <option value="Editor's Pick">Editor's Pick</option>
                    <option value="Limited">Limited</option>
                    <option value="Signature">Signature</option>
                    <option value="Archive">Archive</option>
                    <option value="Exclusive">Exclusive</option>
                    <option value="Members Only">Members Only</option>
                    <option value="Custom">Custom Badge...</option>
                  </select>
                </div>
              </div>

              {badgeType === 'Custom' && (
                <div>
                  <label className="form-label">Custom Badge Text</label>
                  <input
                    type="text"
                    value={customBadgeText}
                    onChange={e => setCustomBadgeText(e.target.value)}
                    className="admin-input"
                    placeholder="e.g. RARE THREADS"
                  />
                </div>
              )}

              <div>
                <label className="form-label">Long-form Collection Story</label>
                <textarea
                  name="editorStory"
                  value={formData.editorStory || ''}
                  onChange={onChange}
                  rows={3}
                  className="admin-input admin-textarea"
                  placeholder="Long form exclusive editorial storytelling..."
                />
              </div>

              {/* Use Cover Image Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0' }}>
                <input
                  type="checkbox"
                  id="useCoverImage"
                  name="useCoverImage"
                  checked={formData.useCoverImage !== false}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, useCoverImage: e.target.checked }))}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--admin-accent)', cursor: 'pointer' }}
                />
                <label htmlFor="useCoverImage" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--admin-accent)', cursor: 'pointer' }}>
                  Use Cover Image (Automatically reuses the Product Cover image for banners & backgrounds)
                </label>
              </div>

              {/* Banners are shown only if Use Cover Image is disabled */}
              {formData.useCoverImage === false && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }} className="pim-grid-col2">
                  <div>
                    <label className="form-label">Collection Grid Banner</label>
                    <SingleImageUploader
                      value={formData.collectionBanner || ''}
                      onChange={(url) => setFormData((prev: any) => ({ ...prev, collectionBanner: url }))}
                      label="Collection Banner"
                    />
                  </div>
                  <div>
                    <label className="form-label">Collection Hero Cover Image</label>
                    <SingleImageUploader
                      value={formData.collectionHeroImage || ''}
                      onChange={(url) => setFormData((prev: any) => ({ ...prev, collectionHeroImage: url }))}
                      label="Collection Hero Image"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
