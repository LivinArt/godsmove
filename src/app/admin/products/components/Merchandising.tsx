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
  const isExclusiveRack = formData.isExclusiveRack || formData.channel === 'EXCLUSIVE_RACK';

  return (
    <section className="admin-card" style={{ padding: '32px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px', color: '#fff' }}>
        3. Merchandising & Badge Curation
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Single Feature on Homepage Checkbox */}
        <div style={{ padding: '20px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="showOnHomepage"
              name="showOnHomepage"
              checked={Boolean(formData.showOnHomepage)}
              onChange={onChange}
              style={{ width: '16px', height: '16px', accentColor: '#c8a46a', cursor: 'pointer' }}
            />
            <label htmlFor="showOnHomepage" style={{ fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Feature on Homepage
            </label>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--admin-muted)', marginTop: '8px', margin: '8px 0 0 26px' }}>
            {isExclusiveRack
              ? 'When checked, this Exclusive Rack product will be highlighted in the Homepage Vault section.'
              : 'When checked, this Drop product will appear in Homepage Releases (New Arrivals).'}
          </p>
        </div>

        {/* Badge Curation */}
        <div style={{ padding: '20px', background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: '4px' }}>
          <label className="form-label" style={{ marginBottom: '8px' }}>Editorial Product Badge</label>
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

          {badgeType === 'Custom' && (
            <div style={{ marginTop: '12px' }}>
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
        </div>
      </div>
    </section>
  );
}
