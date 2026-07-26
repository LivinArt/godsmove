'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Archive, ArchiveRestore } from 'lucide-react';
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

export function VariantManager({
  variants,
  onChange,
  productSlug,
  globalCostPrice,
  globalSellingPrice,
  globalComparePrice,
  globalGstPercentage
}: VariantManagerProps) {
  // Option matrix setup state
  const hasInitialColors = variants.some((v) => v.color) ?? false;
  const hasInitialSizes = variants.some((v) => v.size && v.size !== 'ONE_SIZE') ?? false;

  const [hasColorVariants, setHasColorVariants] = useState(hasInitialColors);
  const [hasSizeVariants, setHasSizeVariants] = useState(hasInitialSizes || variants.length === 0);

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

  const addCustomColor = () => {
    if (!newColorName.trim()) return;
    const cleanName = newColorName.trim();
    if (!wizardColors.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setWizardColors([...wizardColors, { name: cleanName, hex: newColorHex }]);
    }
    setNewColorName('');
  };

  const removeWizardColor = (index: number) => {
    setWizardColors(wizardColors.filter((_, i) => i !== index));
  };

  const removeWizardSize = (size: string) => {
    setWizardSizes(wizardSizes.filter((s) => s !== size));
  };

  // Compile wizard matrix combinations — Inherit product selling price
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

        const baseSku = productSlug ? productSlug.toUpperCase().substring(0, 5) : 'PRD';
        const colorSuffix = colorName ? colorName.toUpperCase().substring(0, 3) : '';
        const generatedSku = [baseSku, colorSuffix, size].filter(Boolean).join('-');

        newMatrix.push({
          sku: matched?.sku || generatedSku,
          size: size as any,
          color: colorName,
          colorHex,
          price: globalSellingPrice,
          comparePrice: globalComparePrice || null,
          position: pos++,
          isActive: matched ? matched.isActive : true,
          initialStock: matched?.initialStock || 0,
        });
      });
    });

    onChange(newMatrix);
  };

  // Compile matrix when structure or wizard choices change
  useEffect(() => {
    compileWizardMatrix();
  }, [hasColorVariants, hasSizeVariants, wizardColors, wizardSizes]);

  const updateVariant = (index: number, field: keyof FormVariantInput, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  const toggleVariantStatus = (index: number) => {
    const newVariants = [...variants];
    newVariants[index].isActive = !newVariants[index].isActive;
    onChange(newVariants);
  };

  const generateSingleSku = (index: number) => {
    const v = variants[index];
    const baseSlug = productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    const colorCode = v.color ? v.color.toUpperCase().substring(0, 3) : '';
    const skuParts = [baseSlug, colorCode, v.size].filter(Boolean);
    updateVariant(index, 'sku', skuParts.join('-'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <style>{`
        .choice-btn {
          padding: 10px 20px;
          border-radius: 2px;
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
          background: #fff;
          color: #000;
          border-color: #fff;
        }
        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--admin-surface-2);
          border: 1px solid var(--admin-border);
          padding: 4px 10px;
          border-radius: 2px;
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

        /* Responsive layout variables */
        .v-table-container {
          display: block;
          width: 100%;
          overflow-x: hidden;
        }
        .v-table {
          width: 100%;
          border-collapse: collapse;
        }
        .v-table th, .v-table td {
          padding: 12px;
          border-bottom: 1px solid var(--admin-border);
          text-align: left;
          vertical-align: middle;
        }
        .v-mobile-cards {
          display: none;
        }

        @media (max-width: 1024px) {
          .v-table-container {
            display: none;
          }
          .v-mobile-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            width: 100%;
          }
        }

        @media (max-width: 680px) {
          .v-mobile-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* STEP 3A: Structure Definition Toggles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="pim-grid-col2">
        <div style={{ padding: '20px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '2px' }}>
          <label className="form-label" style={{ marginBottom: '12px' }}>Does this product have Colours?</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className={`choice-btn ${hasColorVariants ? 'active' : ''}`}
              onClick={() => setHasColorVariants(true)}
            >
              Yes
            </button>
            <button
              type="button"
              className={`choice-btn ${!hasColorVariants ? 'active' : ''}`}
              onClick={() => setHasColorVariants(false)}
            >
              No
            </button>
          </div>
        </div>

        <div style={{ padding: '20px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '2px' }}>
          <label className="form-label" style={{ marginBottom: '12px' }}>Does this product have Sizes?</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className={`choice-btn ${hasSizeVariants ? 'active' : ''}`}
              onClick={() => setHasSizeVariants(true)}
            >
              Yes
            </button>
            <button
              type="button"
              className={`choice-btn ${!hasSizeVariants ? 'active' : ''}`}
              onClick={() => setHasSizeVariants(false)}
            >
              No
            </button>
          </div>
        </div>
      </div>

      {/* STEP 3B: Wizard Lists */}
      {hasColorVariants && (
        <div style={{ padding: '24px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '2px' }}>
          <label className="form-label" style={{ marginBottom: '8px' }}>Colours List</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {wizardColors.map((color, idx) => (
              <span key={idx} className="tag-pill">
                <span style={{ display: 'inline-block', width: '8px', height: '8px', background: color.hex, borderRadius: '50%' }} />
                <span>{color.name}</span>
                <button type="button" onClick={() => removeWizardColor(idx)}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', maxWidth: '400px' }}>
            <input
              type="text"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Colour name, e.g. Ivory"
              className="admin-input"
              style={{ flex: 2 }}
            />
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              style={{ width: '42px', height: '42px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
            <button type="button" onClick={addCustomColor} className="btn-secondary" style={{ flex: 1 }}>
              Add
            </button>
          </div>
        </div>
      )}

      {hasSizeVariants && (
        <div style={{ padding: '24px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '2px' }}>
          <label className="form-label" style={{ marginBottom: '8px' }}>Sizes List</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {wizardSizes.map((size) => (
              <span key={size} className="tag-pill">
                <span>{size}</span>
                <button type="button" onClick={() => removeWizardSize(size)}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', maxWidth: '300px' }}>
            <input
              type="text"
              value={customSizeInput}
              onChange={(e) => setCustomSizeInput(e.target.value)}
              placeholder="Size, e.g. XXL"
              className="admin-input"
              style={{ flex: 2 }}
            />
            <button type="button" onClick={addCustomSize} className="btn-secondary" style={{ flex: 1 }}>
              Add
            </button>
          </div>
        </div>
      )}

      {/* STEP 3C: Responsive Matrix list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--admin-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Variant SKU Matrix ({variants.length} combinations generated)
          </span>
          {globalSellingPrice > 0 && (
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
              style={{ fontSize: '10px', padding: '6px 12px', color: '#c8a46a', borderColor: 'rgba(200,164,106,0.3)' }}
            >
              Reset All to Product MRP (₹{globalSellingPrice.toLocaleString('en-IN')})
            </button>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="v-table-container">
          <table className="v-table">
            <thead>
              <tr style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)' }}>
                <th style={{ width: '80px' }}>Status</th>
                <th>SKU Code</th>
                <th style={{ width: '70px' }}>Size</th>
                <th style={{ width: '80px' }}>Colour</th>
                <th style={{ width: '120px' }}>Selling Price</th>
                <th style={{ width: '120px' }}>Compare Price</th>
                <th style={{ width: '80px' }}>Stock</th>
                <th style={{ width: '170px' }}>Taxes & Margins</th>
                <th style={{ width: '50px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => {
                const effectivePrice = v.price !== undefined && v.price !== null && Number(v.price) > 0
                  ? Number(v.price)
                  : globalSellingPrice;
                const effectiveComparePrice = v.comparePrice !== undefined && v.comparePrice !== null
                  ? v.comparePrice
                  : (globalComparePrice || null);

                const isOverridden = effectivePrice !== globalSellingPrice || effectiveComparePrice !== (globalComparePrice || null);
                const splits = calculatePricing(effectivePrice, globalCostPrice, globalGstPercentage);

                return (
                  <tr key={idx} style={{ opacity: v.isActive ? 1 : 0.4 }}>
                    <td>
                      <span className={`badge ${v.isActive ? 'badge-green' : 'badge-red'}`}>
                        {v.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                          className="admin-input"
                          style={{ fontSize: '12px', padding: '6px 8px', maxWidth: '130px', textOverflow: 'ellipsis' }}
                          placeholder="SKU"
                        />
                        <button type="button" onClick={() => generateSingleSku(idx)} className="btn-secondary" style={{ padding: '6px', minWidth: '0' }}>
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </td>
                    <td><span style={{ fontSize: '12px', fontWeight: 600 }}>{v.size}</span></td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#fff' }}>
                        {v.color || 'None'}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={v.price !== undefined && v.price !== null ? v.price : (globalSellingPrice || '')}
                        onChange={(e) => updateVariant(idx, 'price', e.target.value ? parseFloat(e.target.value) : globalSellingPrice)}
                        className="admin-input"
                        style={{ padding: '6px 8px', fontSize: '12px', borderColor: isOverridden ? 'rgba(200,164,106,0.6)' : undefined }}
                        placeholder={`₹ ${globalSellingPrice || 'Price'}`}
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={v.comparePrice !== undefined && v.comparePrice !== null ? v.comparePrice : (globalComparePrice || '')}
                        onChange={(e) => updateVariant(idx, 'comparePrice', e.target.value ? parseFloat(e.target.value) : null)}
                        className="admin-input"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                        placeholder={`₹ ${globalComparePrice || 'MRP'}`}
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={v.initialStock === undefined ? '' : v.initialStock}
                        onChange={(e) => updateVariant(idx, 'initialStock', parseInt(e.target.value, 10) || 0)}
                        className="admin-input"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                        placeholder="Qty"
                        min="0"
                      />
                    </td>
                    <td>
                      <div style={{ fontSize: '9px', color: 'var(--admin-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>GST ({globalGstPercentage}%): ₹{splits.gstAmount} | Rev: ₹{splits.netRevenue}</span>
                        <span style={{ color: splits.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                          Profit: ₹{splits.profit} ({splits.margin}%)
                        </span>
                        {isOverridden && (
                          <span style={{ color: '#c8a46a', fontWeight: 600 }}>Custom Price Override</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => toggleVariantStatus(idx)}
                        className="btn-secondary"
                        style={{ padding: '6px', minWidth: '0', border: 'none', background: 'transparent' }}
                      >
                        {v.isActive ? <Archive size={14} /> : <ArchiveRestore size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet Cards View */}
        <div className="v-mobile-cards">
          {variants.map((v, idx) => {
            const splits = calculatePricing(globalSellingPrice, globalCostPrice, globalGstPercentage);
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--admin-surface-2)',
                  border: '1px solid var(--admin-border)',
                  padding: '16px',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  opacity: v.isActive ? 1 : 0.5
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${v.isActive ? 'badge-green' : 'badge-red'}`}>
                    {v.isActive ? 'Active' : 'Archived'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleVariantStatus(idx)}
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {v.isActive ? <Archive size={12} /> : <ArchiveRestore size={12} />}
                    <span>{v.isActive ? 'Archive' : 'Restore'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>SKU Code</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                        className="admin-input"
                        style={{ fontSize: '12px', padding: '6px 8px', flex: 1 }}
                      />
                      <button type="button" onClick={() => generateSingleSku(idx)} className="btn-secondary" style={{ padding: '6px', minWidth: '0' }}>
                        <RefreshCw size={12} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Size</label>
                    <div style={{ background: 'var(--admin-border)', border: '1px solid var(--admin-border)', padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: '#fff', borderRadius: '2px', textAlign: 'center' }}>
                      {v.size}
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Colour</label>
                    <div style={{ background: 'var(--admin-border)', border: '1px solid var(--admin-border)', padding: '8px 12px', fontSize: '12px', color: '#fff', borderRadius: '2px', textAlign: 'center' }}>
                      {v.color || 'None'}
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Selling Price</label>
                    <input
                      type="number"
                      value={v.price !== undefined && v.price !== null ? v.price : (globalSellingPrice || '')}
                      onChange={(e) => updateVariant(idx, 'price', e.target.value ? parseFloat(e.target.value) : globalSellingPrice)}
                      className="admin-input"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                      placeholder={`₹ ${globalSellingPrice || 'Price'}`}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Compare Price</label>
                    <input
                      type="number"
                      value={v.comparePrice !== undefined && v.comparePrice !== null ? v.comparePrice : (globalComparePrice || '')}
                      onChange={(e) => updateVariant(idx, 'comparePrice', e.target.value ? parseFloat(e.target.value) : null)}
                      className="admin-input"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                      placeholder={`₹ ${globalComparePrice || 'MRP'}`}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '9px', marginBottom: '2px' }}>Initial Stock</label>
                    <input
                      type="number"
                      value={v.initialStock === undefined ? '' : v.initialStock}
                      onChange={(e) => updateVariant(idx, 'initialStock', parseInt(e.target.value, 10) || 0)}
                      className="admin-input"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                      placeholder="Stock Qty"
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', borderRadius: '2px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--admin-muted)' }}>
                      <span>GST amount ({splits.gstRate}%):</span>
                      <span style={{ color: '#fff' }}>₹{splits.gstAmount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--admin-muted)' }}>
                      <span>Net taxable revenue:</span>
                      <span style={{ color: '#fff' }}>₹{splits.netRevenue}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600 }}>
                      <span>Profit Margin:</span>
                      <span style={{ color: splits.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                        ₹{splits.profit} ({splits.margin}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
