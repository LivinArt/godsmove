'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Archive, ArchiveRestore, Trash2, Ruler, Palette, Check, Layers } from 'lucide-react';
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

interface ColorConfig {
  colorName: string;
  colorHex: string;
  sizes: string[];
}

const STANDARD_MEASUREMENT_FIELDS = [
  'Chest',
  'Shoulder',
  'Waist',
  'Sleeve Length',
  'Garment Length',
  'Hip',
  'Bottom Opening',
  'Neck',
  'Rise',
  'Inseam',
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

const PRESET_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

const PRESET_CUSTOM_MEASUREMENTS = [
  'Arm Hole',
  'Pocket Width',
  'Pocket Length',
  'Bicep',
  'Cuff',
  'Hem',
  'Thigh',
  'Calf',
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
  // Option Toggles
  const hasInitialColors = variants.some((v) => v.color && v.color.trim().length > 0);
  const hasInitialSizes = variants.some((v) => v.size && v.size !== 'ONE_SIZE') || variants.length === 0;

  const [hasColorVariants, setHasColorVariants] = useState(hasInitialColors);
  const [hasSizeVariants, setHasSizeVariants] = useState(hasInitialSizes);

  // Active matrix tab filter: 'ALL' or variant key (e.g. '0', '1')
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Color-wise size state structure
  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>(() => {
    if (hasInitialColors) {
      const colorMap = new Map<string, { hex: string; sizes: string[] }>();
      variants.forEach((v) => {
        if (!v.color) return;
        const colorKey = v.color.trim();
        if (!colorMap.has(colorKey)) {
          colorMap.set(colorKey, { hex: v.colorHex || '#000000', sizes: [] });
        }
        const existing = colorMap.get(colorKey)!;
        if (v.size && v.size !== 'ONE_SIZE' && !existing.sizes.includes(v.size)) {
          existing.sizes.push(v.size);
        }
      });
      const result: ColorConfig[] = [];
      colorMap.forEach((val, key) => {
        result.push({ colorName: key, colorHex: val.hex, sizes: val.sizes });
      });
      return result.length > 0 ? result : [{ colorName: 'Black', colorHex: '#000000', sizes: ['S', 'M', 'L', 'XL'] }];
    }
    return [{ colorName: 'Black', colorHex: '#000000', sizes: ['S', 'M', 'L', 'XL'] }];
  });

  // Size-only state structure (when Color variants disabled)
  const [sizeOnlyList, setSizeOnlyList] = useState<string[]>(() => {
    const existing = variants.map((v) => v.size).filter((s) => s && s !== 'ONE_SIZE');
    return existing.length > 0 ? Array.from(new Set(existing)) : ['S', 'M', 'L', 'XL'];
  });

  // Color & Size Input states
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [customSizeInputPerColor, setCustomSizeInputPerColor] = useState<Record<string, string>>({});
  const [customSizeInputGlobal, setCustomSizeInputGlobal] = useState('');

  // Custom measurement inputs per variant index
  const [customFieldInputs, setCustomFieldInputs] = useState<Record<number, { name: string; value: string }>>({});

  // Matrix Auto-Sync Helper
  const syncMatrix = (colorsEnabled: boolean, sizesEnabled: boolean, colors: ColorConfig[], sizesOnly: string[]) => {
    const targetCombos: { color: string | null; colorHex: string | null; size: string }[] = [];

    if (!sizesEnabled && !colorsEnabled) {
      targetCombos.push({ color: null, colorHex: null, size: 'ONE_SIZE' });
    } else if (!colorsEnabled) {
      const activeSizes = sizesOnly.length > 0 ? sizesOnly : ['ONE_SIZE'];
      activeSizes.forEach((s) => {
        targetCombos.push({ color: null, colorHex: null, size: s });
      });
    } else {
      colors.forEach((c) => {
        const activeSizes = sizesEnabled && c.sizes.length > 0 ? c.sizes : ['ONE_SIZE'];
        activeSizes.forEach((s) => {
          targetCombos.push({ color: c.colorName, colorHex: c.colorHex, size: s });
        });
      });
    }

    const updatedVariants: FormVariantInput[] = targetCombos.map((combo, idx) => {
      const existing = variants.find(
        (v) =>
          v.size === combo.size &&
          ((v.color?.toLowerCase() === combo.color?.toLowerCase()) || (!v.color && !combo.color))
      );

      if (existing) {
        return {
          ...existing,
          position: idx,
          colorHex: combo.colorHex || existing.colorHex || null,
        };
      }

      const baseSku = productSlug ? productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) : 'PRD';
      const colorCode = combo.color ? combo.color.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3) : '';
      const generatedSku = [baseSku, colorCode, combo.size].filter(Boolean).join('-');

      return {
        sku: generatedSku,
        size: combo.size as any,
        alphaSize: combo.size.includes('-') ? combo.size.split('-')[0] : (isNaN(Number(combo.size)) && combo.size !== 'ONE_SIZE' ? combo.size : null),
        numericSize: combo.size.includes('-') ? combo.size.split('-')[1] : (!isNaN(Number(combo.size)) ? combo.size : null),
        measurements: {},
        color: combo.color,
        colorHex: combo.colorHex,
        price: globalSellingPrice,
        comparePrice: globalComparePrice || null,
        position: idx,
        isActive: true,
        initialStock: 0,
      };
    });

    onChange(updatedVariants);
  };

  // Color Management Handlers
  const addColorChoice = (name?: string, hex?: string) => {
    const targetName = (name || newColorName).trim();
    const targetHex = hex || newColorHex;
    if (!targetName) return;

    if (!colorConfigs.some((c) => c.colorName.toLowerCase() === targetName.toLowerCase())) {
      const updated = [...colorConfigs, { colorName: targetName, colorHex: targetHex, sizes: ['S', 'M', 'L', 'XL'] }];
      setColorConfigs(updated);
      syncMatrix(hasColorVariants, hasSizeVariants, updated, sizeOnlyList);
    }
    if (!name) {
      setNewColorName('');
      setNewColorHex('#000000');
    }
  };

  const removeColorChoice = (colorIndex: number) => {
    const updated = colorConfigs.filter((_, idx) => idx !== colorIndex);
    setColorConfigs(updated);
    syncMatrix(hasColorVariants, hasSizeVariants, updated, sizeOnlyList);
  };

  const toggleSizeForColor = (colorIndex: number, size: string) => {
    const updated = [...colorConfigs];
    const target = updated[colorIndex];
    if (target.sizes.includes(size)) {
      target.sizes = target.sizes.filter((s) => s !== size);
    } else {
      target.sizes = [...target.sizes, size];
    }
    setColorConfigs(updated);
    syncMatrix(hasColorVariants, hasSizeVariants, updated, sizeOnlyList);
  };

  const addCustomSizeToColor = (colorIndex: number) => {
    const colorName = colorConfigs[colorIndex].colorName;
    const val = (customSizeInputPerColor[colorName] || '').trim().toUpperCase();
    if (!val) return;

    const updated = [...colorConfigs];
    const target = updated[colorIndex];
    if (!target.sizes.includes(val)) {
      target.sizes = [...target.sizes, val];
      setColorConfigs(updated);
      syncMatrix(hasColorVariants, hasSizeVariants, updated, sizeOnlyList);
    }
    setCustomSizeInputPerColor({ ...customSizeInputPerColor, [colorName]: '' });
  };

  // Size-Only Mode Handlers
  const toggleGlobalSize = (size: string) => {
    let updated: string[];
    if (sizeOnlyList.includes(size)) {
      updated = sizeOnlyList.filter((s) => s !== size);
    } else {
      updated = [...sizeOnlyList, size];
    }
    setSizeOnlyList(updated);
    syncMatrix(hasColorVariants, hasSizeVariants, colorConfigs, updated);
  };

  const addCustomGlobalSize = () => {
    const val = customSizeInputGlobal.trim().toUpperCase();
    if (!val) return;
    if (!sizeOnlyList.includes(val)) {
      const updated = [...sizeOnlyList, val];
      setSizeOnlyList(updated);
      syncMatrix(hasColorVariants, hasSizeVariants, colorConfigs, updated);
    }
    setCustomSizeInputGlobal('');
  };

  // Toggle Color/Size Modes
  const handleToggleColorVariants = (enabled: boolean) => {
    setHasColorVariants(enabled);
    syncMatrix(enabled, hasSizeVariants, colorConfigs, sizeOnlyList);
  };

  const handleToggleSizeVariants = (enabled: boolean) => {
    setHasSizeVariants(enabled);
    syncMatrix(hasColorVariants, enabled, colorConfigs, sizeOnlyList);
  };

  // Variant Data Mutation Functions
  const updateVariant = (index: number, field: keyof FormVariantInput, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  const updateMeasurementValue = (variantIdx: number, measName: string, value: string) => {
    const newVariants = [...variants];
    const target = newVariants[variantIdx];
    const currentMeasurements = { ...(target.measurements as Record<string, string> || {}) };

    if (value === '') {
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

  const addCustomMeasurement = (variantIdx: number, presetName?: string) => {
    const inputName = presetName || customFieldInputs[variantIdx]?.name;
    const inputValue = presetName ? '' : customFieldInputs[variantIdx]?.value;
    if (!inputName || !inputName.trim()) return;

    const nameClean = inputName.trim();
    const valClean = (inputValue || '').trim();

    updateMeasurementValue(variantIdx, nameClean, valClean);
    if (!presetName) {
      setCustomFieldInputs({
        ...customFieldInputs,
        [variantIdx]: { name: '', value: '' },
      });
    }
  };

  const removeMeasurement = (variantIdx: number, measName: string) => {
    updateMeasurementValue(variantIdx, measName, '');
  };

  const removeVariant = (index: number) => {
    const target = variants[index];
    const newVariants = variants.filter((_, idx) => idx !== index);
    onChange(newVariants);

    // Also update color/size states to stay in sync
    if (target.color && hasColorVariants) {
      setColorConfigs((prev) =>
        prev.map((c) => {
          if (c.colorName.toLowerCase() === target.color!.toLowerCase()) {
            return { ...c, sizes: c.sizes.filter((s) => s !== target.size) };
          }
          return c;
        })
      );
    } else if (!hasColorVariants) {
      setSizeOnlyList((prev) => prev.filter((s) => s !== target.size));
    }
  };

  const toggleVariantStatus = (index: number) => {
    const newVariants = [...variants];
    newVariants[index].isActive = !newVariants[index].isActive;
    onChange(newVariants);
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
        .size-pill {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid var(--admin-border);
          background: rgba(255,255,255,0.03);
          color: var(--admin-muted);
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .size-pill.selected {
          background: rgba(200, 164, 106, 0.15);
          color: #c8a46a;
          border-color: #c8a46a;
        }
        .var-card {
          background: #0f172a;
          border: 1px solid rgba(200, 164, 106, 0.25);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .meas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 10px;
        }
        .matrix-tab {
          padding: 8px 14px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid var(--admin-border);
          background: transparent;
          color: var(--admin-muted);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .matrix-tab.active {
          background: #c8a46a;
          color: #000;
          border-color: #c8a46a;
        }
      `}</style>

      {/* Control Header & Option Toggles */}
      <div style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', padding: '20px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ruler size={16} color="#c8a46a" />
              Advanced Apparel Variant & Size Chart Management
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--admin-muted)', margin: 0 }}>
              Color-wise size configuration with independent variant measurement profiles.
            </p>
          </div>
        </div>

        {/* Variant Mode Selectors */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--admin-muted)', fontWeight: 600 }}>Size Variants:</span>
            <button
              type="button"
              onClick={() => handleToggleSizeVariants(true)}
              className={`choice-btn ${hasSizeVariants ? 'active' : ''}`}
            >
              Enabled
            </button>
            <button
              type="button"
              onClick={() => handleToggleSizeVariants(false)}
              className={`choice-btn ${!hasSizeVariants ? 'active' : ''}`}
            >
              One Size (None)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--admin-muted)', fontWeight: 600 }}>Color Variants:</span>
            <button
              type="button"
              onClick={() => handleToggleColorVariants(true)}
              className={`choice-btn ${hasColorVariants ? 'active' : ''}`}
            >
              Enabled
            </button>
            <button
              type="button"
              onClick={() => handleToggleColorVariants(false)}
              className={`choice-btn ${!hasColorVariants ? 'active' : ''}`}
            >
              Disabled
            </button>
          </div>
        </div>

        {/* SCENARIO 2: COLOR + SIZE VARIANTS setup */}
        {hasColorVariants && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(200, 164, 106, 0.05)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(200, 164, 106, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Palette size={15} color="#c8a46a" />
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#c8a46a', margin: 0 }}>
                  Add Color Choice ({colorConfigs.length} Active Colors):
                </label>
              </div>

              {/* Quick Luxury Presets */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Quick Presets:</span>
                {PRESET_LUXURY_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => addColorChoice(preset.name, preset.hex)}
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
                  onClick={() => addColorChoice()}
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 12px', color: '#c8a46a', borderColor: 'rgba(200,164,106,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} /> Add Color Choice
                </button>
              </div>
            </div>

            {/* COLOR-WISE SIZE CARDS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#c8a46a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Independent Size Configuration Per Color:
              </span>

              {colorConfigs.map((colorCfg, cIdx) => (
                <div key={cIdx} style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: colorCfg.colorHex, border: '1px solid rgba(255,255,255,0.4)', display: 'inline-block' }} />
                      <strong style={{ fontSize: '13px', color: '#ffffff' }}>{colorCfg.colorName}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>({colorCfg.sizes.length} Sizes Selected)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeColorChoice(cIdx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={12} /> Remove Color
                    </button>
                  </div>

                  {/* Quick Add Sizes for THIS Color */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--admin-muted)', fontWeight: 600 }}>Quick Add Sizes:</span>
                    {PRESET_SIZES.map((sz) => {
                      const isSel = colorCfg.sizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => toggleSizeForColor(cIdx, sz)}
                          className={`size-pill ${isSel ? 'selected' : ''}`}
                        >
                          {isSel ? <Check size={12} /> : null}
                          {sz}
                        </button>
                      );
                    })}

                    <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                      <input
                        type="text"
                        placeholder="Custom (e.g. L-38)"
                        value={customSizeInputPerColor[colorCfg.colorName] || ''}
                        onChange={(e) => setCustomSizeInputPerColor({ ...customSizeInputPerColor, [colorCfg.colorName]: e.target.value })}
                        className="admin-input"
                        style={{ width: '110px', padding: '4px 8px', fontSize: '11px' }}
                      />
                      <button
                        type="button"
                        onClick={() => addCustomSizeToColor(cIdx)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '10px', color: '#c8a46a' }}
                      >
                        + Add Size
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCENARIO 1: SIZE-ONLY VARIANTS setup */}
        {!hasColorVariants && hasSizeVariants && (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px 18px', borderRadius: '6px', border: '1px solid var(--admin-border)', marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '11px', marginBottom: '10px', color: '#c8a46a', display: 'block', fontWeight: 700 }}>
              Quick Add Sizes to Matrix:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {PRESET_SIZES.map((sz) => {
                const isSel = sizeOnlyList.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleGlobalSize(sz)}
                    className={`size-pill ${isSel ? 'selected' : ''}`}
                  >
                    {isSel ? <Check size={12} /> : null}
                    {sz}
                  </button>
                );
              })}

              <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                <input
                  type="text"
                  value={customSizeInputGlobal}
                  onChange={(e) => setCustomSizeInputGlobal(e.target.value)}
                  className="admin-input"
                  placeholder="e.g. L-38"
                  style={{ width: '100px', padding: '4px 8px', fontSize: '11px' }}
                />
                <button type="button" onClick={addCustomGlobalSize} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '10px', color: '#c8a46a' }}>
                  + Add Size
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MATRIX & MEASUREMENT PROFILES VIEW */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} color="#c8a46a" />
              Product Variant & Measurement Matrix ({variants.length} Variants)
            </span>
            <p style={{ fontSize: '11px', color: 'var(--admin-muted)', margin: '2px 0 0 0' }}>
              Automatically generated. Click a variant tab to edit its measurement profile.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const updated = variants.map((v) => ({
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

        {/* VARIANT TABS BAR */}
        {variants.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`matrix-tab ${activeTab === 'ALL' ? 'active' : ''}`}
            >
              All Variants ({variants.length})
            </button>
            {variants.map((v, idx) => {
              const label = v.color ? `${v.color} - ${v.size}` : v.size;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(String(idx))}
                  className={`matrix-tab ${activeTab === String(idx) ? 'active' : ''}`}
                >
                  {v.colorHex && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: v.colorHex, display: 'inline-block' }} />
                  )}
                  TAB {label}
                </button>
              );
            })}
          </div>
        )}

        {/* VARIANT CARDS RENDERING */}
        {variants.map((v, idx) => {
          // If a specific tab is active, hide other variant cards
          if (activeTab !== 'ALL' && activeTab !== String(idx)) return null;

          const measMap = (v.measurements as Record<string, string>) || {};
          const customKeys = Object.keys(measMap).filter((k) => !STANDARD_MEASUREMENT_FIELDS.includes(k));
          const labelName = v.color ? `${v.color} - ${v.size}` : v.size;

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
                    Variant Tab: <strong style={{ color: '#c8a46a' }}>{labelName}</strong>
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

              {/* Commercial Details Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>SKU Code</label>
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                    className="admin-input"
                    style={{ fontSize: '12px', padding: '6px 8px' }}
                  />
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

              {/* Structured Garment Measurements Form for THIS Variant */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#c8a46a', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Ruler size={13} />
                    Independent Garment Measurements for {labelName}
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
                        value={measMap[fieldName] !== undefined ? measMap[fieldName] : ''}
                        onChange={(e) => updateMeasurementValue(idx, fieldName, e.target.value)}
                        className="admin-input"
                        placeholder='e.g. 42'
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

                  {/* Quick Custom Field Presets */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--admin-muted)' }}>Presets:</span>
                    {PRESET_CUSTOM_MEASUREMENTS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => addCustomMeasurement(idx, preset)}
                        className="btn-secondary"
                        style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(255,255,255,0.03)' }}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {/* Add Custom Field Inputs */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Name (e.g. Arm Hole)"
                      value={customFieldInputs[idx]?.name || ''}
                      onChange={(e) =>
                        setCustomFieldInputs({
                          ...customFieldInputs,
                          [idx]: { ...(customFieldInputs[idx] || { name: '', value: '' }), name: e.target.value },
                        })
                      }
                      className="admin-input"
                      style={{ fontSize: '11px', padding: '4px 8px', width: '150px' }}
                    />

                    <input
                      type="text"
                      placeholder='Value (e.g. 18)'
                      value={customFieldInputs[idx]?.value || ''}
                      onChange={(e) =>
                        setCustomFieldInputs({
                          ...customFieldInputs,
                          [idx]: { ...(customFieldInputs[idx] || { name: '', value: '' }), value: e.target.value },
                        })
                      }
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
