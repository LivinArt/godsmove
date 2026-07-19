'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductStoryProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  stages: { title: string; desc: string; icon: string }[];
  setStages: React.Dispatch<React.SetStateAction<{ title: string; desc: string; icon: string }[]>>;
}

export function ProductStory({
  formData,
  onChange,
  stages,
  setStages
}: ProductStoryProps) {
  const [activeAccordion, setActiveAccordion] = useState<string>('whyWeMadeThis');

  const handleStageChange = (idx: number, field: 'title' | 'desc' | 'icon', value: string) => {
    const nextStages = [...stages];
    nextStages[idx] = { ...nextStages[idx], [field]: value };
    setStages(nextStages);
  };

  const panels = [
    {
      id: 'whyWeMadeThis',
      label: 'Why We Made This',
      fields: (
        <div>
          <label className="form-label">Backstory narrative</label>
          <textarea
            name="whyWeMadeThis"
            value={formData.whyWeMadeThis || ''}
            onChange={onChange}
            rows={3}
            className="admin-input admin-textarea"
            placeholder="The backstory and design motivation..."
          />
        </div>
      )
    },
    {
      id: 'craftsmanship',
      label: 'Craftsmanship details',
      fields: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="pim-grid-col2">
            <div>
              <label className="form-label">Fabric Name</label>
              <input
                type="text"
                name="fabricName"
                value={formData.fabricName || ''}
                onChange={onChange}
                className="admin-input"
                placeholder="e.g. 400GSM Organic Cotton"
              />
            </div>
            <div>
              <label className="form-label">Fabric post-rationale</label>
              <input
                type="text"
                name="fabricWhy"
                value={formData.fabricWhy || ''}
                onChange={onChange}
                className="admin-input"
                placeholder="e.g. Loopback knit selects for postural drape."
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="pim-grid-col2">
            <div>
              <label className="form-label">Construction Details</label>
              <input
                type="text"
                name="constructionName"
                value={formData.constructionName || ''}
                onChange={onChange}
                className="admin-input"
                placeholder="e.g. Reinforced Flatlock Seaming"
              />
            </div>
            <div>
              <label className="form-label">Construction rationale</label>
              <input
                type="text"
                name="constructionWhy"
                value={formData.constructionWhy || ''}
                onChange={onChange}
                className="admin-input"
                placeholder="e.g. Restricts seam friction."
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="pim-grid-col2">
            <div>
              <label className="form-label">Finishing Details</label>
              <input
                type="text"
                name="printName"
                value={formData.printName || ''}
                onChange={onChange}
                className="admin-input"
                placeholder="e.g. High-density screen prints"
              />
            </div>
            <div>
              <label className="form-label">Finishing rationale</label>
              <input
                type="text"
                name="printWhy"
                value={formData.printWhy || ''}
                onChange={onChange}
                className="admin-input"
                placeholder="e.g. Elevates logo texture dimensions."
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'fabricMaterial',
      label: 'Fabric & Material',
      fields: (
        <div>
          <label className="form-label">Material Composition</label>
          <input
            type="text"
            name="material"
            value={formData.material || ''}
            onChange={onChange}
            className="admin-input"
            placeholder="e.g. 100% Organic Cotton"
          />
        </div>
      )
    },
    {
      id: 'fit',
      label: 'Silhouette & Fit',
      fields: (
        <div>
          <label className="form-label">Fit description</label>
          <input
            type="text"
            name="fit"
            value={formData.fit || ''}
            onChange={onChange}
            className="admin-input"
            placeholder="e.g. Boxy drop-shoulder proportions"
          />
        </div>
      )
    },
    {
      id: 'specifications',
      label: 'Specifications',
      fields: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="pim-grid-col3">
          <div>
            <label className="form-label">Country of Origin</label>
            <input
              type="text"
              name="country"
              value={formData.country || ''}
              onChange={onChange}
              className="admin-input"
              placeholder="e.g. India"
            />
          </div>
          <div>
            <label className="form-label">Manufacturer Atelier</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer || ''}
              onChange={onChange}
              className="admin-input"
              placeholder="e.g. GODSMOVE Atelier"
            />
          </div>
          <div>
            <label className="form-label">Net Quantity</label>
            <input
              type="number"
              name="netQuantity"
              value={formData.netQuantity ?? 1}
              onChange={onChange}
              className="admin-input"
            />
          </div>
        </div>
      )
    },
    {
      id: 'careInstructions',
      label: 'Care Instructions',
      fields: (
        <div>
          <label className="form-label">Care details</label>
          <input
            type="text"
            name="washCare"
            value={formData.washCare || ''}
            onChange={onChange}
            className="admin-input"
            placeholder="e.g. Dry clean recommended"
          />
        </div>
      )
    },
    {
      id: 'packaging',
      label: 'Packaging (Optional)',
      fields: (
        <div>
          <label className="form-label">Luxury Packaging specifications</label>
          <input
            type="text"
            name="packaging"
            value={formData.packaging || ''}
            onChange={onChange}
            className="admin-input"
            placeholder="e.g. Matte linen collection archive box."
          />
        </div>
      )
    },
    {
      id: 'ownershipInfo',
      label: 'Ownership Information',
      fields: (
        <div>
          <label className="form-label">Ownership details</label>
          <input
            type="text"
            name="ownershipInfo"
            value={formData.ownershipInfo || ''}
            onChange={onChange}
            className="admin-input"
            placeholder="e.g. Individually serialized badge #001-050."
          />
        </div>
      )
    },
    {
      id: 'editorialNotes',
      label: 'Editorial Notes (Optional)',
      fields: (
        <div>
          <label className="form-label">Notes</label>
          <textarea
            name="editorialNotes"
            value={formData.editorialNotes || ''}
            onChange={onChange}
            rows={2}
            className="admin-input admin-textarea"
            placeholder="Editorial layout directions..."
          />
        </div>
      )
    }
  ];

  return (
    <section className="admin-card" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
        2. Product Storytelling & Life Cycle
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }} className="pim-accordions-wrap">
        {panels.map((panel) => {
          const isOpen = activeAccordion === panel.id;
          return (
            <div
              key={panel.id}
              style={{
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '2px',
                background: 'rgba(255,255,255,0.01)',
                overflow: 'hidden'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveAccordion(isOpen ? '' : panel.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: isOpen ? 'rgba(255,255,255,0.03)' : 'none',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span>{panel.label}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>
              
              {isOpen && (
                <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0,0,0,0.1)' }}>
                  {panel.fields}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Garment Life Cycle Builder */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '28px' }}>
        <span style={{ fontSize: '11px', color: 'var(--admin-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'block' }}>
          Garment Life Cycle Builder (Exactly 6 Stages)
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="pim-grid-col2">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                background: 'var(--admin-surface-2)',
                border: '1px solid var(--admin-border)',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--admin-muted)', fontWeight: 700 }}>STAGE 0{idx + 1}</span>
              
              <div>
                <label className="form-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Stage Title</label>
                <input
                  type="text"
                  value={stage.title}
                  onChange={e => handleStageChange(idx, 'title', e.target.value)}
                  className="admin-input"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Description</label>
                <textarea
                  value={stage.desc}
                  onChange={e => handleStageChange(idx, 'desc', e.target.value)}
                  rows={2}
                  className="admin-input admin-textarea"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '10px', marginBottom: '4px' }}>Timeline Icon</label>
                <select
                  value={stage.icon}
                  onChange={e => handleStageChange(idx, 'icon', e.target.value)}
                  className="admin-input admin-select"
                  style={{ padding: '6px 10px', fontSize: '12px', height: 'auto' }}
                >
                  <option value="Compass">Compass (Concept/Drafting)</option>
                  <option value="Layers">Layers (Weaving/Materials)</option>
                  <option value="Scissors">Scissors (Sculpting/Patterning)</option>
                  <option value="Cpu">Cpu (Technical Construction)</option>
                  <option value="ShieldCheck">Shield Check (Quality Inspection)</option>
                  <option value="Package">Package (Ready/Archival Slips)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
