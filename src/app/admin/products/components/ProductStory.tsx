'use client';

import React from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
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
import {
  StorytellingBlock,
  StorytellingArchiveSpec,
  ProductStorytellingData,
} from '@/components/ProductStorytelling';

interface ProductStoryProps {
  formData: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const AVAILABLE_ICONS = [
  'Layers',
  'Scissors',
  'Brush',
  'ShieldCheck',
  'Sparkles',
  'Package',
  'Tag',
  'Award',
  'Flame',
  'Eye',
  'Crown',
  'Ruler',
  'Heart',
  'Diamond',
];

export function ProductStory({ formData, setFormData }: ProductStoryProps) {
  // Determine Product Type automatically from entered info
  const isExclusiveRack = Boolean(
    formData.isExclusiveRack || formData.channel === 'EXCLUSIVE_RACK'
  );
  const productTypeLabel = isExclusiveRack ? 'EXCLUSIVE RACK' : 'DROPS';

  // Initialize or extract storytelling state
  const storytelling: ProductStorytellingData = formData.storytelling || {};

  const detailsEyebrow = storytelling.detailsEyebrow ?? 'DESIGN SPECIFICATION';
  const detailsTitle = storytelling.detailsTitle ?? 'PRODUCT DETAILS & SYMBOLISM';
  const detailsIntro = storytelling.detailsIntro ?? formData.description ?? '';

  const blocks: StorytellingBlock[] = storytelling.detailsBlocks || [
    {
      id: 'block-1',
      eyebrow: 'FABRIC ARCHITECTURE',
      heading: formData.fabricName || 'Heavyweight Combed Cotton',
      description:
        formData.fabricWhy ||
        'Dense knit construction engineered to drape cleanly with minimal cling, maintaining structural form throughout continuous wear.',
      icon: 'Layers',
    },
    {
      id: 'block-2',
      eyebrow: 'CONSTRUCTION & SEAMS',
      heading: formData.constructionName || 'Drop-Shoulder Precision Cut',
      description:
        formData.constructionWhy ||
        'Relaxed proportions tailored across the chest and upper arm, finished with reinforced double-needle stitching on hem and cuffs.',
      icon: 'Scissors',
    },
    {
      id: 'block-3',
      eyebrow: 'ARTWORK & FINISH',
      heading: formData.printName || 'Archival Screen Application',
      description:
        formData.printWhy ||
        'High-density pigment execution cured for exceptional longevity, formulated to evolve with character through time and laundering.',
      icon: 'Brush',
    },
  ];

  const archiveEyebrow = storytelling.archiveEyebrow ?? 'TECHNICAL ARCHIVE';
  const archiveTitle = storytelling.archiveTitle ?? 'GARMENT SPECIFICATIONS';
  const archiveBadgeText = storytelling.archiveBadgeText ?? '01 / 03 • GODSMOVE ATELIER';

  const specs: StorytellingArchiveSpec[] = storytelling.archiveSpecs || [
    { id: 'spec-1', label: 'MATERIAL', value: formData.material || '100% Cotton (280–300 GSM)' },
    { id: 'spec-2', label: 'FIT TYPE', value: formData.fit || 'Oversized Drop-Shoulder' },
    { id: 'spec-3', label: 'COUNTRY OF ORIGIN', value: formData.origin || formData.country || 'India' },
    { id: 'spec-4', label: 'WASH CARE', value: formData.washCare || 'Machine Wash Cold, Dry Flat in Shade' },
    { id: 'spec-5', label: 'MANUFACTURER', value: formData.manufacturer || 'GODSMOVE Atelier' },
    { id: 'spec-6', label: 'SHIPPING CLASS', value: formData.shippingClass || 'Standard Ground' },
  ];

  // Helper to update storytelling object in formData
  const updateStorytelling = (updated: Partial<ProductStorytellingData>) => {
    const nextStorytelling: ProductStorytellingData = {
      detailsEyebrow,
      detailsTitle,
      detailsIntro,
      detailsBlocks: blocks,
      archiveEyebrow,
      archiveTitle,
      archiveBadgeText,
      archiveSpecs: specs,
      ...updated,
    };
    setFormData((prev: any) => ({
      ...prev,
      storytelling: nextStorytelling,
    }));
  };

  // Content Blocks Handlers
  const handleBlockChange = (index: number, field: keyof StorytellingBlock, val: string) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], [field]: val };
    updateStorytelling({ detailsBlocks: newBlocks });
  };

  const handleAddBlock = () => {
    const newBlock: StorytellingBlock = {
      id: `block-${Date.now()}`,
      eyebrow: 'SPECIFICATION',
      heading: 'New Specification Heading',
      description: 'Detail description of this specification...',
      icon: 'Layers',
    };
    updateStorytelling({ detailsBlocks: [...blocks, newBlock] });
  };

  const handleDeleteBlock = (index: number) => {
    const newBlocks = blocks.filter((_, idx) => idx !== index);
    updateStorytelling({ detailsBlocks: newBlocks });
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;
    updateStorytelling({ detailsBlocks: newBlocks });
  };

  // Technical Specs Handlers
  const handleSpecChange = (index: number, field: keyof StorytellingArchiveSpec, val: string) => {
    const newSpecs = [...specs];
    newSpecs[index] = { ...newSpecs[index], [field]: val };
    updateStorytelling({ archiveSpecs: newSpecs });
  };

  const handleAddSpec = () => {
    const newSpec: StorytellingArchiveSpec = {
      id: `spec-${Date.now()}`,
      label: 'NEW FIELD',
      value: 'Specification value',
    };
    updateStorytelling({ archiveSpecs: [...specs, newSpec] });
  };

  const handleDeleteSpec = (index: number) => {
    const newSpecs = specs.filter((_, idx) => idx !== index);
    updateStorytelling({ archiveSpecs: newSpecs });
  };

  const handleMoveSpec = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= specs.length) return;
    const newSpecs = [...specs];
    const temp = newSpecs[index];
    newSpecs[index] = newSpecs[targetIdx];
    newSpecs[targetIdx] = temp;
    updateStorytelling({ archiveSpecs: newSpecs });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ── AUTOMATIC PRODUCT TYPE DISPLAY BADGE ── */}
      <section
        className="admin-card"
        style={{
          padding: '24px',
          background: 'rgba(200, 164, 106, 0.04)',
          border: '1px solid rgba(200, 164, 106, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: '#c8a46a',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            DETECTED PRODUCT TYPE
          </span>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#fff',
              margin: 0,
            }}
          >
            {productTypeLabel}
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
            Storytelling design system will automatically render in{' '}
            <strong style={{ color: '#c8a46a' }}>
              {isExclusiveRack ? 'Dark Atelier Theme' : 'Light High-Fashion Theme'}
            </strong>{' '}
            on the storefront.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              padding: '8px 16px',
              background: isExclusiveRack ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(200,164,106,0.3)',
              borderRadius: '2px',
              color: '#c8a46a',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {productTypeLabel} ARCHITECTURE
          </div>

          <button
            type="button"
            onClick={() => setFormData((prev: any) => ({ ...prev, storytelling: null }))}
            style={{
              padding: '8px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '2px',
              color: '#ef4444',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            title="Remove Storytelling section from this product"
          >
            Clear Storytelling
          </button>
        </div>
      </section>

      {/* ── SECTION 01: PRODUCT DETAILS & SYMBOLISM ── */}
      <section className="admin-card" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            CHAPTER 01
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            PRODUCT DETAILS & SYMBOLISM
          </h3>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            Create the narrative and craftsmanship blocks displayed in the main product section.
          </p>
        </div>

        {/* Section Header Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }} className="pim-grid-col2">
          <div>
            <label className="form-label">Section Eyebrow</label>
            <input
              type="text"
              value={detailsEyebrow}
              onChange={(e) => updateStorytelling({ detailsEyebrow: e.target.value })}
              className="admin-input"
              placeholder="e.g. DESIGN SPECIFICATION"
            />
          </div>

          <div>
            <label className="form-label">Section Title</label>
            <input
              type="text"
              value={detailsTitle}
              onChange={(e) => updateStorytelling({ detailsTitle: e.target.value })}
              className="admin-input"
              placeholder="e.g. PRODUCT DETAILS & SYMBOLISM"
            />
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label className="form-label">Section Intro / Short Narrative</label>
          <textarea
            value={detailsIntro}
            onChange={(e) => updateStorytelling({ detailsIntro: e.target.value })}
            className="admin-input"
            rows={3}
            placeholder="Detailed editorial narrative or description..."
          />
        </div>

        {/* Dynamic Content Blocks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#c8a46a', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              CONTENT BLOCKS ({blocks.length})
            </h4>
            <button
              type="button"
              onClick={handleAddBlock}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'rgba(200, 164, 106, 0.15)',
                border: '1px solid rgba(200, 164, 106, 0.3)',
                color: '#c8a46a',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>ADD CONTENT BLOCK</span>
            </button>
          </div>

          {blocks.map((block, idx) => (
            <div
              key={block.id || idx}
              style={{
                background: 'rgba(22, 22, 24, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: '3px solid #c8a46a',
                padding: '20px',
                borderRadius: '3px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#c8a46a', letterSpacing: '0.12em' }}>
                  BLOCK {String(idx + 1).padStart(2, '0')}
                </span>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleMoveBlock(idx, 'up')}
                    disabled={idx === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      padding: '4px',
                    }}
                    title="Move Up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveBlock(idx, 'down')}
                    disabled={idx === blocks.length - 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: idx === blocks.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                      cursor: idx === blocks.length - 1 ? 'not-allowed' : 'pointer',
                      padding: '4px',
                    }}
                    title="Move Down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px',
                      marginLeft: '8px',
                    }}
                    title="Delete Block"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px' }} className="pim-grid-col3">
                <div>
                  <label className="form-label">Eyebrow / Micro Label</label>
                  <input
                    type="text"
                    value={block.eyebrow || ''}
                    onChange={(e) => handleBlockChange(idx, 'eyebrow', e.target.value)}
                    className="admin-input"
                    placeholder="e.g. FABRIC ARCHITECTURE"
                  />
                </div>

                <div>
                  <label className="form-label">Heading / Title</label>
                  <input
                    type="text"
                    value={block.heading || ''}
                    onChange={(e) => handleBlockChange(idx, 'heading', e.target.value)}
                    className="admin-input"
                    placeholder="e.g. Heavyweight Combed Cotton"
                  />
                </div>

                <div>
                  <label className="form-label">Icon</label>
                  <select
                    value={block.icon || 'Layers'}
                    onChange={(e) => handleBlockChange(idx, 'icon', e.target.value)}
                    className="admin-input"
                  >
                    {AVAILABLE_ICONS.map((iconName) => (
                      <option key={iconName} value={iconName}>
                        {iconName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Block Description</label>
                <textarea
                  value={block.description || ''}
                  onChange={(e) => handleBlockChange(idx, 'description', e.target.value)}
                  className="admin-input"
                  rows={2}
                  placeholder="Supporting craftsmanship or symbolism explanation..."
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 02: TECHNICAL ARCHIVE / GARMENT SPECIFICATIONS ── */}
      <section className="admin-card" style={{ padding: '32px' }}>
        <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: '#c8a46a', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            CHAPTER 02
          </span>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            TECHNICAL ARCHIVE / GARMENT SPECIFICATIONS
          </h3>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            Manage technical garment specifications, materials, wash care, and origin items.
          </p>
        </div>

        {/* Section Header Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }} className="pim-grid-col3">
          <div>
            <label className="form-label">Archive Eyebrow</label>
            <input
              type="text"
              value={archiveEyebrow}
              onChange={(e) => updateStorytelling({ archiveEyebrow: e.target.value })}
              className="admin-input"
              placeholder="e.g. TECHNICAL ARCHIVE"
            />
          </div>

          <div>
            <label className="form-label">Archive Title</label>
            <input
              type="text"
              value={archiveTitle}
              onChange={(e) => updateStorytelling({ archiveTitle: e.target.value })}
              className="admin-input"
              placeholder="e.g. GARMENT SPECIFICATIONS"
            />
          </div>

          <div>
            <label className="form-label">Archive Badge Text</label>
            <input
              type="text"
              value={archiveBadgeText}
              onChange={(e) => updateStorytelling({ archiveBadgeText: e.target.value })}
              className="admin-input"
              placeholder="e.g. 01 / 03 • GODSMOVE ATELIER"
            />
          </div>
        </div>

        {/* Dynamic Specifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#c8a46a', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              SPECIFICATION ITEMS ({specs.length})
            </h4>
            <button
              type="button"
              onClick={handleAddSpec}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'rgba(200, 164, 106, 0.15)',
                border: '1px solid rgba(200, 164, 106, 0.3)',
                color: '#c8a46a',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              <span>ADD SPECIFICATION</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {specs.map((spec, idx) => (
              <div
                key={spec.id || idx}
                style={{
                  background: 'rgba(22, 22, 24, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '16px',
                  borderRadius: '3px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>
                    SPEC {String(idx + 1).padStart(2, '0')}
                  </span>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveSpec(idx, 'up')}
                      disabled={idx === 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        padding: '2px',
                      }}
                      title="Move Up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSpec(idx, 'down')}
                      disabled={idx === specs.length - 1}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: idx === specs.length - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                        cursor: idx === specs.length - 1 ? 'not-allowed' : 'pointer',
                        padding: '2px',
                      }}
                      title="Move Down"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSpec(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '2px',
                        marginLeft: '6px',
                      }}
                      title="Delete Specification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label className="form-label">Specification Label</label>
                    <input
                      type="text"
                      value={spec.label || ''}
                      onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                      className="admin-input"
                      placeholder="e.g. MATERIAL"
                    />
                  </div>

                  <div>
                    <label className="form-label">Specification Value</label>
                    <input
                      type="text"
                      value={spec.value || ''}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      className="admin-input"
                      placeholder="e.g. 100% Cotton (280–300 GSM)"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
