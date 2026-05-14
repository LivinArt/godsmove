'use client';

import { Plus, RefreshCw, Archive, ArchiveRestore } from 'lucide-react';
import type { FormVariantInput } from '@/lib/validations/product';

interface VariantManagerProps {
  variants: FormVariantInput[];
  onChange: (variants: FormVariantInput[]) => void;
  productSlug: string;
  seasonPrefix?: string; // e.g., 'SS26'
  dropPrefix?: string; // e.g., 'DROP001'
}

export function VariantManager({ variants, onChange, productSlug, seasonPrefix, dropPrefix }: VariantManagerProps) {
  const addVariant = () => {
    onChange([
      ...variants,
      {
        sku: '',
        size: 'M',
        price: 0,
        comparePrice: null,
        position: variants.length,
        isActive: true,
        initialStock: 0,
      },
    ]);
  };

  const updateVariant = (index: number, field: keyof FormVariantInput, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  const removeVariant = (index: number) => {
    const newVariants = [...variants];
    const v = newVariants[index];
    v.isActive = !v.isActive;
    onChange(newVariants);
  };

  const generateSku = (index: number) => {
    const v = variants[index];
    const prefix = [seasonPrefix, dropPrefix].filter(Boolean).join('-');
    const baseSlug = productSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4); // basic 4-char code
    const colorCode = v.color ? v.color.toUpperCase().substring(0, 3) : '';
    
    const skuParts = [prefix, baseSlug, colorCode, v.size].filter(Boolean);
    updateVariant(index, 'sku', skuParts.join('-'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="admin-table-wrap" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
        <table className="admin-table" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th>Status</th>
              <th>SKU</th>
              <th>Size</th>
              <th>Color</th>
              <th>Price (₹)</th>
              <th>Compare (₹)</th>
              <th>Stock</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant, index) => (
              <tr key={index} style={{ opacity: variant.isActive ? 1 : 0.5, filter: variant.isActive ? 'none' : 'grayscale(100%)' }}>
                <td>
                  <span className={`badge ${variant.isActive ? 'badge-green' : 'badge-red'}`}>
                    {variant.isActive ? 'Active' : 'Archived'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      placeholder="SKU"
                      className="admin-input"
                      style={{ width: '120px', padding: '6px 10px' }}
                    />
                    <button type="button" onClick={() => generateSku(index)} className="btn-secondary" style={{ padding: '6px', minWidth: '0' }} title="Auto-generate SKU">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                <td>
                  <select
                    value={variant.size}
                    onChange={(e) => updateVariant(index, 'size', e.target.value)}
                    className="admin-input admin-select"
                    style={{ width: '80px', padding: '6px 24px 6px 10px' }}
                  >
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONE_SIZE'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    value={variant.color || ''}
                    onChange={(e) => updateVariant(index, 'color', e.target.value)}
                    placeholder="Color"
                    className="admin-input"
                    style={{ width: '100px', padding: '6px 10px' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={variant.price || ''}
                    onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                    min="0"
                    placeholder="0.00"
                    className="admin-input"
                    style={{ width: '100px', padding: '6px 10px' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={variant.comparePrice || ''}
                    onChange={(e) => updateVariant(index, 'comparePrice', e.target.value ? parseFloat(e.target.value) : null)}
                    min="0"
                    placeholder="MRP"
                    className="admin-input"
                    style={{ width: '100px', padding: '6px 10px' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={variant.initialStock === undefined ? '' : variant.initialStock}
                    onChange={(e) => updateVariant(index, 'initialStock', parseInt(e.target.value, 10))}
                    min="0"
                    className="admin-input"
                    style={{ width: '80px', padding: '6px 10px' }}
                  />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="btn-secondary"
                    style={{ padding: '6px', minWidth: '0', background: 'transparent', border: 'none' }}
                    title={variant.isActive ? "Archive Variant" : "Restore Variant"}
                  >
                    {variant.isActive ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addVariant}
        className="btn-secondary"
        style={{ width: 'fit-content' }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variant
      </button>
    </div>
  );
}
