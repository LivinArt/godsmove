'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Archive, ArchiveRestore, Trash2, Ruler, Palette } from 'lucide-react';
import type { FormVariantInput } from '@/lib/validations/product';
import { calculatePricing } from '@/lib/PricingEngine';

interface VariantManagerProps {
  variants: FormVariantInput[];
  onChange: (variants: FormVariantInput[]) => void;
  productSlug: string;
  globalCostPrice: number;
  globalSellingPrice: number;
  globalComparePrice?: number | null;
  globalGstPercentage: number;
}

const STANDARD_MEASUREMENT_FIELDS = [
  'Chest',
  'Shoulder',
  'Waist',
  'Sleeve Length',
  'Garment Length',
  'Hip',
  'Inseam',
  'Rise',
  'Neck',
  'Bottom Opening',
];

const PRESET_LUXURY_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'Charcoal', hex: '#282828' },
  { name: 'Ivory', hex: '#F5F5DC' },
  { name: 'Olive', hex: '#556B2F' },
  { name: 'Sand', hex: '#C2B280' },
  { name: 'Washed Grey', hex: '#696969' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Burgundy', hex: '#800020' },
];

export function VariantManager({
  variants,
  onChange,
  productSlug,
  globalCostPrice,
  globalSellingPrice,
  globalComparePrice,
  globalGstPercentage,
}: VariantManagerProps) {
  // Option matrix setup state
  const hasInitialColors = variants.some((v) => v.color && v.color.trim().length > 0) ?? false;
  const hasInitialSizes = variants.some((v) => v.size && v.size !== 'ONE_SIZE') ?? false;

  const [hasColorVariants, setHasColorVariants] = useState(hasInitialColors);
  const [hasSizeVariants, setHasSizeVariants] = useState(hasInitialSizes || variants.length === 0);

  // Custom measurement inputs per variant index
  const [customFieldInputs, setCustomFieldInputs] = useState<Record<number, { name: string; value: string }>>({});

  // Wizard list colors
  const [wizardColors, setWizardColors] = useState<{ name: string; hex: string }[]>(() => {
    const existing = variants.map((v) => ({ name: v.color || '', hex: v.colorHex || '#000000' })).filter((c) => c.name);
    const unique: { name: string; hex: string }[] = [];
    existing.forEach((item) => {
      if (!unique.some((x) => x.name.toLowerCase() === item.name.toLowerCase())) {
        unique.push(item);
      }
    });
    return unique.length > 0 ? unique : [{ name: 'Black', hex: '#000000' }];
  });

  // Wizard list sizes
  const [wizardSizes, setWizardSizes] = useState<string[]>(() => {
    const existing = variants.map((v) => v.size).filter((s) => s && s !== 'ONE_SIZE');
    return existing.length > 0 ? Array.from(new Set(existing)) : ['S', 'M', 'L', 'XL'];
  });

  const [customSizeInput, setCustomSizeInput] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const addCustomSize = () => {
    if (!customSizeInput) return;
    const clean = customSizeInput.trim().toUpperCase();
    if (!wizardSizes.includes(clean)) {
      setWizardSizes([...wizardSizes, clean]);
    }
    setCustomSizeInput('');
  };

  const addCustomColor = (name?: string, hex?: string) => {
    const targetName = name || newColorName;
    const targetHex = hex || newColorHex;
    if (!targetName.trim()) return;

    const cleanName = targetName.trim();
    if (!wizardColors.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setWizardColors([...wizardColors, { name: cleanName, hex: targetHex }]);
    }
    if (!name) {
      setNewColorName('');
      setNewColorHex('#000000');
    }
  };

  const removeWizardColor = (index: number) => {
    const remaining = wizardColors.filter((_, i) => i !== index);
    setWizardColors(remaining);
  };

  const removeWizardSize = (size: string) => {
    setWizardSizes(wizardSizes.filter((s) => s !== size));
  };

  // Compile wizard matrix combinations
  const compileWizardMatrix = () => {
    const activeColors = hasColorVariants ? wizardColors : [{ name: '', hex: '' }];
    const activeSizes = hasSizeVariants ? wizardSizes : ['ONE_SIZE'];

    const newMatrix: FormVariantInput[] = [];
    let pos = 0;

    activeColors.forEach((color) => {
      activeSizes.forEach((size) => {
        const colorName = color.name || null;
        const colorHex = color.hex || null;

        const matched = variants.find(
          (v) => v.size === size && (v.color?.toLowerCase() === colorName?.toLowerCase() || (!v.color && !colorName))
        );

        const baseSku = productSlug ? productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) : 'PRD';
        const colorSuffix = colorName ? colorName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3) : '';
        const generatedSku = [baseSku, colorSuffix, size].filter(Boolean).join('-');

        newMatrix.push({
          sku: matched?.sku || generatedSku,
          size: size as any,
          alphaSize: matched?.alphaSize || (size.includes('-') ? size.split('-')[0] : (isNaN(Number(size)) && size !== 'ONE_SIZE' ? size : null)),
          numericSize: matched?.numericSize || (size.includes('-') ? size.split('-')[1] : (!isNaN(Number(size)) ? size : null)),
          measurements: matched?.measurements || null,
          color: colorName,
          colorHex,
          price: matched?.price !== undefined ? Number(matched.price) : globalSellingPrice,
          comparePrice: matched?.comparePrice ? Number(matched.comparePrice) : (globalComparePrice || null),
          position: pos++,
          isActive: matched ? matched.isActive : true,
          initialStock: matched?.initialStock || 0,
        });
      });
    });

    onChange(newMatrix);
  };

  const addManualVariant = () => {
    const nextIdx = variants.length + 1;
    const baseSku = productSlug ? productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) : 'PRD';
    const newVar: FormVariantInput = {
      sku: `${baseSku}-VAR-${nextIdx}`,
      size: 'L-38',
      alphaSize: 'L',
      numericSize: '38',
      color: hasColorVariants && wizardColors.length > 0 ? wizardColors[0].name : null,
      colorHex: hasColorVariants && wizardColors.length > 0 ? wizardColors[0].hex : null,
      price: globalSellingPrice,
      comparePrice: globalComparePrice || null,
      position: variants.length,
      isActive: true,
      initialStock: 25,
      measurements: {},
    };
    onChange([...variants, newVar]);
  };

  const updateVariant = (index: number, field: keyof FormVariantInput, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  const updateVariantSizeDetails = (index: number, alpha?: string, numeric?: string) => {
    const newVariants = [...variants];
    const target = newVariants[index];
    const newAlpha = alpha !== undefined ? alpha : (target.alphaSize || '');
    const newNumeric = numeric !== undefined ? numeric : (target.numericSize || '');

    let combined = target.size;
    if (newAlpha && newNumeric) {
      combined = `${newAlpha.trim()}-${newNumeric.trim()}`;
    } else if (newAlpha) {
      combined = newAlpha.trim();
    } else if (newNumeric) {
      combined = newNumeric.trim();
    }

    newVariants[index] = {
      ...target,
      alphaSize: newAlpha || null,
      numericSize: newNumeric || null,
      size: combined,
    };
    onChange(newVariants);
  };

  const updateMeasurementValue = (variantIdx: number, measName: string, value: string) => {
    const newVariants = [...variants];
    const target = newVariants[variantIdx];
    const currentMeasurements = { ...(target.measurements as Record<string, string> || {}) };

    if (value.trim() === '') {
      delete currentMeasurements[measName];
    } else {
      currentMeasurements[measName] = value;
    }

    newVariants[variantIdx] = {
      ...target,
      measurements: Object.keys(currentMeasurements).length > 0 ? currentMeasurements : null,
    };
    onChange(newVariants);
  };

  const addCustomMeasurement = (variantIdx: number) => {
    const input = customFieldInputs[variantIdx];
    if (!input || !input.name.trim()) return;

    const nameClean = input.name.trim();
    const valClean = input.value.trim() || '—';

    updateMeasurementValue(variantIdx, nameClean, valClean);
    setCustomFieldInputs({
      ...customFieldInputs,
      [variantIdx]: { name: '', value: '' },
    });
  };

  const removeMeasurement = (variantIdx: number, measName: string) => {
    updateMeasurementValue(variantIdx, measName, '');
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, idx) => idx !== index);
    onChange(newVariants);
  };

  const toggleVariantStatus = (index: number) => {
    const newVariants = [...variants];
    newVariants[index].isActive = !newVariants[index].isActive;
    onChange(newVariants);
  };

  const generateSingleSku = (index: number) => {
    const v = variants[index];
    const baseSlug = productSlug ? productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) : 'PRD';
    const colorCode = v.color ? v.color.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3) : '';
    const skuParts = [baseSlug, colorCode, v.size].filter(Boolean);
    updateVariant(index, 'sku', skuParts.join('-'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <style>{`
        .choice-btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid var(--admin-border);
          background: transparent;
          color: var(--admin-muted);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .choice-btn.active {
          background: #c8a46a;
          color: #000;
          border-color: #c8a46a;
        }
        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--admin-border);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          color: #fff;
        }
        .tag-pill button {
          background: transparent;
          border: none;
          color: var(--admin-muted);
          cursor: pointer;
          font-size: 13px;
        }
        .tag-pill button:hover {
          color: #ef4444;
        }
        .var-card {
          background: #0f172a;
          border: 1px solid rgba(200, 164, 106, 0.2);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .meas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
      `}</style>

      {/* Option Matrix Configuration Header */}
      <div style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ruler size={16} color="#c8a46a" />
              Advanced Product Variant & Size Chart Manager
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--admin-muted)', margin: 0 }}>
              Define colors, sizes, and independent measurement profiles for every variant.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={addManualVariant}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '8px 14px', color: '#c8a46a', borderColor: 'rgba(200, 164, 106, 0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Add Single Variant
            </button>

            <button
              type="button"
              onClick={compileWizardMatrix}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '8px 14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} /> Recompile Matrix
            </button>
          </div>
        </div>

        {/* Color & Size Toggles */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--admin-muted)', fontWeight: 600 }}>Size Variants:</span>
            <button
              type="button"
              onClick={() => setHasSizeVariants(true)}
              className={`choice-btn ${hasSizeVariants ? 'active' : ''}`}
            >
              Enabled
            </button>
            <button
              type="button"
              onClick={() => setHasSizeVariants(false)}
              className={`choice-btn ${!hasSizeVariants ? 'active' : ''}`}
            >
              One Size (None)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--admin-muted)', fontWeight: 600 }}>Color Variants:</span>
            <button
              type="button"
              onClick={() => setHasColorVariants(true)}
              className={`choice-btn ${hasColorVariants ? 'active' : ''}`}
            >
              Enabled
            </button>
            <button
              type="button"
              onClick={() => setHasColorVariants(false)}
              className={`choice-btn ${!hasColorVariants ? 'active' : ''}`}
            >
              Disabled
            </button>
          </div>
        </div>

        {/* Color Management Control Panel */}
        {hasColorVariants && (
          <div style={{ background: 'rgba(200, 164, 106, 0.05)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(200, 164, 106, 0.3)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Palette size={15} color="#c8a46a" />
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#c8a46a', margin: 0 }}>
                Active Color Choices Matrix ({wizardColors.length} Colors):
              </label>
            </div>

            {/* Active Color Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
              {wizardColors.map((c, idx) => (
                <span key={idx} className="tag-pill">
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.hex, border: '1px solid rgba(255,255,255,0.3)', display: 'inline-block' }} />
                  {c.name}
                  <button type="button" onClick={() => removeWizardColor(idx)}>×</button>
                </span>
              ))}
            </div>

            {/* Quick Luxury Presets */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Presets:</span>
              {PRESET_LUXURY_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => addCustomColor(preset.name, preset.hex)}
                  className="btn-secondary"
                  style={{ fontSize: '10px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)' }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: preset.hex, display: 'inline-block' }} />
                  + {preset.name}
                </button>
              ))}
            </div>

            {/* Custom Color Creator Input */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Color Name (e.g. Onyx Black)"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                className="admin-input"
                style={{ fontSize: '11px', padding: '6px 10px', width: '180px' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--admin-surface-1)', border: '1px solid var(--admin-border)', padding: '2px 8px', borderRadius: '4px' }}>
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  style={{ width: '24px', height: '24px', border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}>{newColorHex}</span>
              </div>

              <button
                type="button"
                onClick={() => addCustomColor()}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 12px', color: '#c8a46a', borderColor: 'rgba(200,164,106,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={12} /> Add Color Choice
              </button>
            </div>
          </div>
        )}

        {/* Wizard Sizing Quick Setup Pills */}
        {hasSizeVariants && (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--admin-border)', marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '11px', marginBottom: '8px', color: '#c8a46a' }}>
              Quick Add Sizes to Matrix:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {wizardSizes.map((s) => (
                <span key={s} className="tag-pill">
                  {s}
                  <button type="button" onClick={() => removeWizardSize(s)}>×</button>
                </span>
              ))}
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  className="admin-input"
                  placeholder="e.g. L-38"
                  style={{ width: '80px', padding: '4px 8px', fontSize: '11px' }}
                />
                <button type="button" onClick={addCustomSize} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }}>
                  + Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Structured Variant Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Product Variant & Measurement Matrix ({variants.length} Variants)
          </span>
          <button
            type="button"
            onClick={() => {
              const updated = variants.map(v => ({
                ...v,
                price: globalSellingPrice,
                comparePrice: globalComparePrice || null,
              }));
              onChange(updated);
            }}
            className="btn-secondary"
            style={{ fontSize: '10px', padding: '4px 10px', color: '#c8a46a', borderColor: 'rgba(200,164,106,0.3)' }}
          >
            Reset All Prices to MRP (₹{globalSellingPrice.toLocaleString('en-IN')})
          </button>
        </div>

        {variants.map((v, idx) => {
          const measMap = (v.measurements as Record<string, string>) || {};
          const customKeys = Object.keys(measMap).filter(k => !STANDARD_MEASUREMENT_FIELDS.includes(k));
          const effectivePrice = v.price !== undefined && v.price !== null && Number(v.price) > 0 ? Number(v.price) : globalSellingPrice;
          const splits = calculatePricing(effectivePrice, globalCostPrice, globalGstPercentage);

          return (
            <div key={idx} className="var-card" style={{ opacity: v.isActive ? 1 : 0.6 }}>
              {/* Card Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span className={`badge ${v.isActive ? 'badge-green' : 'badge-red'}`}>
                    {v.isActive ? 'Active' : 'Archived'}
                  </span>
                  {v.colorHex && (
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: v.colorHex, border: '1px solid rgba(255,255,255,0.4)', display: 'inline-block' }} />
                  )}
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    Variant #{idx + 1}: <strong style={{ color: '#c8a46a' }}>{v.size || 'ONE_SIZE'}</strong> {v.color ? `(${v.color})` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => toggleVariantStatus(idx)}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {v.isActive ? <Archive size={12} /> : <ArchiveRestore size={12} />}
                    {v.isActive ? 'Archive' : 'Restore'}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeVariant(idx)}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Grid 1: Color, Sizing & Commercial Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '10px', color: '#c8a46a' }}>Color Name</label>
                  <input
                    type="text"
                    value={v.color || ''}
                    onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                    className="admin-input"
                    placeholder="e.g. Black"
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '10px', color: '#c8a46a' }}>Color Hex</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="color"
                      value={v.colorHex || '#000000'}
                      onChange={(e) => updateVariant(idx, 'colorHex', e.target.value)}
                      style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={v.colorHex || ''}
                      onChange={(e) => updateVariant(idx, 'colorHex', e.target.value)}
                      className="admin-input"
                      placeholder="#000000"
                      style={{ fontSize: '11px', padding: '6px 6px', flex: 1, fontFamily: 'monospace' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '10px', color: '#c8a46a' }}>Alphabetic Size</label>
                  <input
                    type="text"
                    value={v.alphaSize || ''}
                    onChange={(e) => updateVariantSizeDetails(idx, e.target.value, undefined)}
                    className="admin-input"
                    placeholder="e.g. L"
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '10px', color: '#c8a46a' }}>Numeric Size</label>
                  <input
                    type="text"
                    value={v.numericSize || ''}
                    onChange={(e) => updateVariantSizeDetails(idx, undefined, e.target.value)}
                    className="admin-input"
                    placeholder="e.g. 38"
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Combined Size</label>
                  <div style={{ background: 'rgba(200,164,106,0.15)', border: '1px solid rgba(200,164,106,0.3)', color: '#c8a46a', padding: '6px 10px', borderRadius: '4px', fontWeight: 700, fontSize: '13px', textAlign: 'center' }}>
                    {v.size || 'ONE_SIZE'}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>SKU Code</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                      className="admin-input"
                      style={{ fontSize: '12px', padding: '6px 8px', flex: 1 }}
                    />
                    <button type="button" onClick={() => generateSingleSku(idx)} className="btn-secondary" style={{ padding: '6px' }}>
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Selling Price (₹)</label>
                  <input
                    type="number"
                    value={v.price !== undefined && v.price !== null ? v.price : (globalSellingPrice || '')}
                    onChange={(e) => updateVariant(idx, 'price', e.target.value ? parseFloat(e.target.value) : globalSellingPrice)}
                    className="admin-input"
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Stock Qty</label>
                  <input
                    type="number"
                    value={v.initialStock === undefined ? '' : v.initialStock}
                    onChange={(e) => updateVariant(idx, 'initialStock', parseInt(e.target.value, 10) || 0)}
                    className="admin-input"
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
                </div>
              </div>

              {/* Grid 2: Structured Garment Measurements Form */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#c8a46a', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Ruler size={13} />
                    Per-Variant Garment Measurements (Size Guide)
                  </span>
                </div>

                {/* 10 Standard Fields */}
                <div className="meas-grid" style={{ marginBottom: '16px' }}>
                  {STANDARD_MEASUREMENT_FIELDS.map((fieldName) => (
                    <div key={fieldName}>
                      <label className="form-label" style={{ fontSize: '9px', color: 'var(--admin-muted)', marginBottom: '2px' }}>
                        {fieldName}
                      </label>
                      <input
                        type="text"
                        value={measMap[fieldName] || ''}
                        onChange={(e) => updateMeasurementValue(idx, fieldName, e.target.value)}
                        className="admin-input"
                        placeholder='e.g. 40"'
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Custom Measurements Section */}
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                  <label className="form-label" style={{ fontSize: '10px', color: '#c8a46a', marginBottom: '8px', display: 'block' }}>
                    Custom Measurement Fields ({customKeys.length} added):
                  </label>

                  {/* Existing Custom Fields */}
                  {customKeys.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {customKeys.map((ck) => (
                        <div key={ck} style={{ background: 'rgba(200, 164, 106, 0.1)', border: '1px solid rgba(200, 164, 106, 0.3)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fff' }}>
                          <strong>{ck}:</strong> {measMap[ck]}
                          <button
                            type="button"
                            onClick={() => removeMeasurement(idx, ck)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Custom Field Inputs */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Name (e.g. Arm Hole)"
                      value={customFieldInputs[idx]?.name || ''}
                      onChange={(e) => setCustomFieldInputs({
                        ...customFieldInputs,
                        [idx]: { ...(customFieldInputs[idx] || { name: '', value: '' }), name: e.target.value }
                      })}
                      className="admin-input"
                      style={{ fontSize: '11px', padding: '4px 8px', width: '150px' }}
                    />

                    <input
                      type="text"
                      placeholder='Value (e.g. 9.5")'
                      value={customFieldInputs[idx]?.value || ''}
                      onChange={(e) => setCustomFieldInputs({
                        ...customFieldInputs,
                        [idx]: { ...(customFieldInputs[idx] || { name: '', value: '' }), value: e.target.value }
                      })}
                      className="admin-input"
                      style={{ fontSize: '11px', padding: '4px 8px', width: '120px' }}
                    />

                    <button
                      type="button"
                      onClick={() => addCustomMeasurement(idx)}
                      className="btn-secondary"
                      style={{ fontSize: '10px', padding: '4px 10px', color: '#c8a46a', borderColor: 'rgba(200,164,106,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={12} /> Add Custom Field
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
