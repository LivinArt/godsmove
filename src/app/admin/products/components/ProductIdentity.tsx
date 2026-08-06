'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface ProductIdentityProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  categories: any[];
  drops: any[];
  collections?: any[];
  slugStatus: 'idle' | 'checking' | 'available' | 'taken';
  setSlugStatus: (status: 'idle' | 'checking' | 'available' | 'taken') => void;
  setShowCatModal?: (val: boolean) => void;
  setShowDropModal?: (val: boolean) => void;
  setShowColModal?: (val: boolean) => void;
}

export function ProductIdentity({
  formData,
  onChange,
  setFormData,
  categories,
  drops,
  collections = [],
  slugStatus,
  setSlugStatus,
  setShowCatModal,
  setShowDropModal,
  setShowColModal
}: ProductIdentityProps) {
  
  const generateSlug = () => {
    if (!formData.name) return;
    const generated = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric chars
      .replace(/\s+/g, '-')         // replace spaces with hyphens
      .replace(/-+/g, '-');         // collapse duplicate hyphens
    
    setFormData((prev: any) => ({ ...prev, slug: generated }));
    setSlugStatus('idle'); // Reset slug availability check state
  };

  return (
    <section className="admin-card" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
        1. Core Identity & Indexing
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label className="form-label">Product Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            className="admin-input"
            placeholder="e.g. Signature Heavyweight Hooded Sweatshirt"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }} className="pim-grid-col2-button">
          <div>
            <label className="form-label">
              URL Handle (Slug)
              {slugStatus === 'checking' && <span style={{ color: 'var(--admin-accent)', marginLeft: '8px', fontSize: '10px' }}>Checking handle...</span>}
              {slugStatus === 'available' && <span style={{ color: '#22c55e', marginLeft: '8px', fontSize: '10px' }}>Handle unique</span>}
              {slugStatus === 'taken' && <span style={{ color: '#ef4444', marginLeft: '8px', fontSize: '10px' }}>Handle taken / already allocated</span>}
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={onChange}
              className="admin-input"
              placeholder="e.g. signature-heavyweight-hooded-sweatshirt"
              required
            />
          </div>
          <button
            type="button"
            onClick={generateSlug}
            className="btn-secondary"
            style={{ height: '42px', padding: '0 16px', fontSize: '12px', fontWeight: 600 }}
          >
            Auto-Generate
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="pim-grid-col2">
          {/* CATEGORY SELECTOR + INLINE CREATE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Product Category</label>
              {setShowCatModal && (
                <button
                  type="button"
                  onClick={() => setShowCatModal(true)}
                  style={{
                    background: 'none', border: 'none', color: '#c8a46a',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', padding: 0
                  }}
                >
                  <Plus size={12} /> Create New Category
                </button>
              )}
            </div>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={onChange}
              className="admin-input admin-select"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* COLLECTION SELECTOR + INLINE CREATE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Select Collection</label>
              {setShowColModal && (
                <button
                  type="button"
                  onClick={() => setShowColModal(true)}
                  style={{
                    background: 'none', border: 'none', color: '#c8a46a',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', padding: 0
                  }}
                >
                  <Plus size={12} /> Add New Collection
                </button>
              )}
            </div>
            <select
              name="collectionName"
              value={formData.collectionName || ''}
              onChange={onChange}
              className="admin-input admin-select"
            >
              <option value="">No Collection (Default Catalog)</option>
              {(collections || []).map((c: any) => {
                const cName = typeof c === 'string' ? c : (c.name || c);
                return (
                  <option key={cName} value={cName}>
                    {cName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="pim-grid-col2">
          {/* DROP / DESTINATION SELECTOR + INLINE CREATE */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Associated Release Drop / Destination <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {setShowDropModal && (
                <button
                  type="button"
                  onClick={() => setShowDropModal(true)}
                  style={{
                    background: 'none', border: 'none', color: '#c8a46a',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', padding: 0
                  }}
                >
                  <Plus size={12} /> Create New Drop
                </button>
              )}
            </div>
            <select
              name="dropSelect"
              value={formData.isExclusiveRack ? 'EXCLUSIVE_RACK' : (formData.dropId || '')}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'EXCLUSIVE_RACK') {
                  setFormData((prev: any) => ({
                    ...prev,
                    dropId: '',
                    channel: 'EXCLUSIVE_RACK',
                    isExclusiveRack: true,
                  }));
                } else {
                  setFormData((prev: any) => ({
                    ...prev,
                    dropId: val,
                    channel: 'DROP',
                    isExclusiveRack: false,
                  }));
                }
              }}
              className="admin-input admin-select"
              required
            >
              <option value="">Select Destination Drop / Rack...</option>
              <option value="EXCLUSIVE_RACK">EXCLUSIVE RACK (Vault Destination)</option>
              <optgroup label="Release Drops">
                {drops.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.status})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="form-label">Luxury Brand Brandmark</label>
            <input
              type="text"
              name="brand"
              value={formData.brand || 'GODSMOVE'}
              onChange={onChange}
              className="admin-input"
              placeholder="GODSMOVE"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div>
            <label className="form-label">Publishing status</label>
            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              className="admin-input admin-select"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Published (Live Catalog)</option>
              <option value="HIDDEN">Preview / Hidden</option>
              <option value="ARCHIVED">Archived</option>
              <option value="SOLD_OUT">Sold Out</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
