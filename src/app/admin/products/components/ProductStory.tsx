'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductStoryProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  stages?: any[];
  setStages?: any;
  onImagesChange?: (images: any[]) => void;
}

export function ProductStory({
  formData,
  onChange,
}: ProductStoryProps) {
  const [activeAccordion, setActiveAccordion] = useState<string>('craftsmanship');

  const panels = [
    {
      id: 'craftsmanship',
      label: 'CRAFTSMANSHIP (Storefront Signature Campaign Section)',
      fields: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Section-level editorial overrides */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="pim-grid-col2">
            <div>
              <label className="form-label">Section Overline Label</label>
              <input
                type="text"
                name="editorialHeading"
                value={formData.editorialHeading || 'CRAFTSMANSHIP'}
                onChange={onChange}
                className="admin-input"
                placeholder="e.g. CRAFTSMANSHIP"
              />
              <p style={{ fontSize: '11px', color: 'var(--admin-muted, #999)', marginTop: '4px' }}>
                Displayed as the large section heading on the product page.
              </p>
            </div>
            <div>
              <label className="form-label">Editorial Campaign Note</label>
              <input
                type="text"
                name="editorialNotes"
                value={formData.editorialNotes || ''}
                onChange={onChange}
                className="admin-input"
                placeholder="e.g. Every detail is considered long before the garment reaches the wearer."
              />
              <p style={{ fontSize: '11px', color: 'var(--admin-muted, #999)', marginTop: '4px' }}>
                Displayed as an editorial pull-quote beneath the heading.
              </p>
            </div>
          </div>

          {/* 4 Spec Blocks */}
          <div style={{ borderTop: '1px solid var(--admin-border, #333)', paddingTop: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-main, #f5f1e8)', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Specification Blocks
            </p>
            <p style={{ fontSize: '11px', color: 'var(--admin-muted, #888)', marginBottom: '24px' }}>
              Each block renders as a distinct editorial card on the product page. The tag label is the overline header (e.g. FABRIC) and the sentence is the supporting copy beneath it.
            </p>

            {/* Block 1 — FABRIC */}
            <div style={{ background: 'var(--admin-card-bg, #161616)', border: '1px solid var(--admin-border, #282828)', borderLeft: '3px solid rgba(200, 164, 106, 0.4)', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#c8a46a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Block 1 — FABRIC</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }} className="pim-grid-col2">
                <div>
                  <label className="form-label">Tag Label (overline)</label>
                  <input type="text" name="fabricLabel" value={formData.fabricLabel || 'FABRIC'} onChange={onChange} className="admin-input" placeholder="FABRIC" />
                </div>
                <div>
                  <label className="form-label">Specification sentence</label>
                  <input type="text" name="fabricWhy" value={formData.fabricWhy || ''} onChange={onChange} className="admin-input" placeholder="e.g. Engineered from 100% heavyweight organic cotton for structural permanence." />
                </div>
              </div>
            </div>

            {/* Block 2 — FIT */}
            <div style={{ background: 'var(--admin-card-bg, #161616)', border: '1px solid var(--admin-border, #282828)', borderLeft: '3px solid rgba(200, 164, 106, 0.4)', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#c8a46a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Block 2 — FIT</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }} className="pim-grid-col2">
                <div>
                  <label className="form-label">Tag Label (overline)</label>
                  <input type="text" name="fitLabel" value={formData.fitLabel || 'FIT'} onChange={onChange} className="admin-input" placeholder="FIT" />
                </div>
                <div>
                  <label className="form-label">Specification sentence</label>
                  <input type="text" name="fit" value={formData.fit || ''} onChange={onChange} className="admin-input" placeholder="e.g. Archival relaxed silhouette proportioned for balance and posture." />
                </div>
              </div>
            </div>

            {/* Block 3 — CONSTRUCTION */}
            <div style={{ background: 'var(--admin-card-bg, #161616)', border: '1px solid var(--admin-border, #282828)', borderLeft: '3px solid rgba(200, 164, 106, 0.4)', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#c8a46a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Block 3 — CONSTRUCTION</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }} className="pim-grid-col2">
                <div>
                  <label className="form-label">Tag Label (overline)</label>
                  <input type="text" name="constructionLabel" value={formData.constructionLabel || 'CONSTRUCTION'} onChange={onChange} className="admin-input" placeholder="CONSTRUCTION" />
                </div>
                <div>
                  <label className="form-label">Specification sentence</label>
                  <input type="text" name="constructionWhy" value={formData.constructionWhy || ''} onChange={onChange} className="admin-input" placeholder="e.g. Reinforced double-needle seam engineering constructed for high density." />
                </div>
              </div>
            </div>

            {/* Block 4 — FINISH */}
            <div style={{ background: 'var(--admin-card-bg, #161616)', border: '1px solid var(--admin-border, #282828)', borderLeft: '3px solid rgba(200, 164, 106, 0.4)', padding: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#c8a46a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Block 4 — FINISH</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }} className="pim-grid-col2">
                <div>
                  <label className="form-label">Tag Label (overline)</label>
                  <input type="text" name="printLabel" value={formData.printLabel || 'FINISH'} onChange={onChange} className="admin-input" placeholder="FINISH" />
                </div>
                <div>
                  <label className="form-label">Specification sentence</label>
                  <input type="text" name="printWhy" value={formData.printWhy || ''} onChange={onChange} className="admin-input" placeholder="e.g. Signature archival finish treated to age gracefully through years of ownership." />
                </div>
              </div>
            </div>
          </div>

        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--admin-text-main, #f5f1e8)' }}>
            Product Craftsmanship Management
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--admin-text-muted, #888)' }}>
            Manage storefront Craftsmanship campaign specifications. All blocks are purely text-driven — no images required.
          </p>
        </div>
      </div>

      {panels.map((panel) => {
        const isOpen = activeAccordion === panel.id;
        return (
          <div
            key={panel.id}
            style={{
              background: 'var(--admin-card-bg, #161616)',
              border: '1px solid var(--admin-border, #282828)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveAccordion(isOpen ? '' : panel.id)}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                color: 'var(--admin-text-main, #f5f1e8)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <span>{panel.label}</span>
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px 20px', borderTop: '1px solid var(--admin-border, #282828)' }}>
                <div style={{ paddingTop: '20px' }}>{panel.fields}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
