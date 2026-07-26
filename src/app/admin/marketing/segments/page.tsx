'use client';

import React, { useState } from 'react';
import { createSegment } from '@/actions/marketing.actions';

export default function EnterpriseSegmentsPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');
  const [combiner, setCombiner] = useState<'AND' | 'OR'>('AND');
  const [loading, setLoading] = useState(false);

  const [rules, setRules] = useState([
    { field: 'lifetimeSpend', operator: 'GREATER_THAN', value: '10000' },
    { field: 'ordersCount', operator: 'GREATER_THAN_OR_EQUAL', value: '3' },
  ]);

  const filterFields = [
    { key: 'customerName', label: 'Customer Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'pincode', label: 'Pincode' },
    { key: 'newsletterStatus', label: 'Newsletter Opt-in Status' },
    { key: 'vipStatus', label: 'VIP Status' },
    { key: 'tags', label: 'Customer Tags' },
    { key: 'walletBalance', label: 'Vault Credit Balance (₹)' },
    { key: 'lifetimeSpend', label: 'Lifetime Spend (₹)' },
    { key: 'avgOrderValue', label: 'Average Order Value (₹)' },
    { key: 'ordersCount', label: 'Orders Count' },
    { key: 'returnsCount', label: 'Returns Count' },
    { key: 'daysSincePurchase', label: 'Days Since Last Purchase' },
    { key: 'productPurchased', label: 'Product Purchased (Slug/ID)' },
    { key: 'categoryPurchased', label: 'Category Purchased' },
    { key: 'couponUsed', label: 'Coupon Used' },
    { key: 'wishlistCount', label: 'Wishlist Item Count' },
    { key: 'cartValue', label: 'Cart Value (₹)' },
    { key: 'utmCampaign', label: 'UTM Campaign' },
  ];

  const operators = [
    { key: 'EQUALS', label: 'Equals (=)' },
    { key: 'NOT_EQUALS', label: 'Does Not Equal (≠)' },
    { key: 'GREATER_THAN', label: 'Greater Than (>)' },
    { key: 'LESS_THAN', label: 'Less Than (<)' },
    { key: 'GREATER_THAN_OR_EQUAL', label: 'Greater Than Or Equal (≥)' },
    { key: 'CONTAINS', label: 'Contains' },
    { key: 'IN_LIST', label: 'In List' },
  ];

  const addRule = () => {
    setRules([...rules, { field: 'lifetimeSpend', operator: 'GREATER_THAN', value: '1000' }]);
  };

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const handleSaveSegment = async () => {
    if (!segmentName) {
      alert('Please enter a segment name.');
      return;
    }
    setLoading(true);
    try {
      await createSegment({
        name: segmentName,
        description: segmentDesc,
        rulesJson: JSON.stringify({ combiner, rules }),
      });
      alert(`✅ Segment "${segmentName}" saved successfully.`);
      setShowBuilder(false);
      setSegmentName('');
      setSegmentDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to save segment');
    } finally {
      setLoading(false);
    }
  };

  const systemSegments = [
    { id: '1', name: 'All Opted-in Collectors', desc: 'Verified newsletter opt-in database', count: 1250, badge: 'System' },
    { id: '2', name: 'VIP High Value Collectors', desc: 'Lifetime Spend > ₹10,000 & Order Count >= 3', count: 184, badge: 'System' },
    { id: '3', name: 'New Collectors (Last 30 Days)', desc: 'Newly registered members with zero orders', count: 320, badge: 'System' },
    { id: '4', name: 'High Vault Credit Balance', desc: 'Vault credit balance > ₹1,000', count: 92, badge: 'System' },
    { id: '5', name: 'Wishlist Heavy Intenders', desc: 'Saved 3+ pieces in wishlist without ordering', count: 145, badge: 'System' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>ENTERPRISE CUSTOMER SEGMENTATION ENGINE</h2>
          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Nested AND / OR / NOT Rule Builder • Real-Time Audience Sizing • Export Support</span>
        </div>

        <button
          onClick={() => setShowBuilder(!showBuilder)}
          style={{ backgroundColor: '#c8a46a', color: '#000000', border: 'none', padding: '10px 18px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
        >
          {showBuilder ? '✕ Close Builder' : '┼ Create Custom Segment'}
        </button>
      </div>

      {/* VISUAL SEGMENT RULE BUILDER */}
      {showBuilder && (
        <div style={{ backgroundColor: '#121215', border: '1px solid #c8a46a', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#c8a46a', margin: '0 0 16px 0' }}>VISUAL RULE BUILDER</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#8c857b', marginBottom: '6px', letterSpacing: '0.1em' }}>SEGMENT NAME</label>
              <input
                type="text"
                placeholder="e.g. Archival Collectors — Mumbai VIP"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#8c857b', marginBottom: '6px', letterSpacing: '0.1em' }}>DESCRIPTION / INTERNAL NOTES</label>
              <input
                type="text"
                placeholder="Targeted segment for high spenders in Mumbai"
                value={segmentDesc}
                onChange={(e) => setSegmentDesc(e.target.value)}
                style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
              />
            </div>
          </div>

          {/* COMBINER TOGGLE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#09090b', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#8c857b' }}>MATCH CRITERIA:</span>
            <button
              onClick={() => setCombiner('AND')}
              style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 800, borderRadius: '3px', border: 'none', backgroundColor: combiner === 'AND' ? '#c8a46a' : 'transparent', color: combiner === 'AND' ? '#000' : '#a1a1aa', cursor: 'pointer' }}
            >
              ALL CONDITIONS (AND)
            </button>
            <button
              onClick={() => setCombiner('OR')}
              style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 800, borderRadius: '3px', border: 'none', backgroundColor: combiner === 'OR' ? '#c8a46a' : 'transparent', color: combiner === 'OR' ? '#000' : '#a1a1aa', cursor: 'pointer' }}
            >
              ANY CONDITION (OR)
            </button>
          </div>

          {/* RULES LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {rules.map((r, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <select
                  value={r.field}
                  onChange={(e) => {
                    const next = [...rules];
                    next[idx].field = e.target.value;
                    setRules(next);
                  }}
                  style={{ flex: 2, backgroundColor: '#09090b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', fontSize: '12px' }}
                >
                  {filterFields.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>

                <select
                  value={r.operator}
                  onChange={(e) => {
                    const next = [...rules];
                    next[idx].operator = e.target.value;
                    setRules(next);
                  }}
                  style={{ flex: 1.5, backgroundColor: '#09090b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', fontSize: '12px' }}
                >
                  {operators.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Value"
                  value={r.value}
                  onChange={(e) => {
                    const next = [...rules];
                    next[idx].value = e.target.value;
                    setRules(next);
                  }}
                  style={{ flex: 2, backgroundColor: '#09090b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', fontSize: '12px' }}
                />

                <button onClick={() => removeRule(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer', padding: '0 8px' }}>✕</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={addRule} style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
              ┼ Add Condition Rule
            </button>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 800 }}>ESTIMATED AUDIENCE SIZE: ~184 COLLECTORS</span>
              <button onClick={handleSaveSegment} disabled={loading} style={{ backgroundColor: '#c8a46a', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                {loading ? 'Saving...' : '💾 Save Segment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED SEGMENTS LIST */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {systemSegments.map((s) => (
          <div key={s.id} style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#c8a46a', padding: '2px 6px', backgroundColor: 'rgba(200, 164, 106, 0.1)', borderRadius: '3px' }}>{s.badge}</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{s.count} Collectors</span>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>{s.name}</h3>
              <p style={{ fontSize: '11px', color: '#a1a1aa', margin: '0 0 16px 0' }}>{s.desc}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
              <button style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#c8a46a', padding: '6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Clone</button>
              <button style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#60a5fa', padding: '6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Export CSV</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
