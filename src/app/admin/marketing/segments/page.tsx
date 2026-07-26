import React from 'react';
import { getSegments } from '@/actions/marketing.actions';

export default async function SegmentsPage() {
  const segments = await getSegments();

  const defaultSystemSegments = [
    { name: 'All Customers', desc: 'Complete registered customer directory', count: 1250, badge: 'System' },
    { name: 'VIP High Value Collectors', desc: 'Lifetime Spend > ₹10,000 & Order Count >= 3', count: 184, badge: 'System' },
    { name: 'New Signups (Last 30 Days)', desc: 'Newly registered members who have not ordered yet', count: 320, badge: 'System' },
    { name: 'Abandoned Cart Collectors', desc: 'Had active cart session in the last 7 days', count: 64, badge: 'System' },
    { name: 'High Vault Credit Balance', desc: 'Wallet credit balance > ₹1,000', count: 92, badge: 'System' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>CUSTOMER SEGMENTATION ENGINE</h2>
          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Dynamic rule-based audience builder (AND / OR / Nested Groups)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {defaultSystemSegments.map((s, idx) => (
          <div key={idx} style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#c8a46a', padding: '2px 6px', backgroundColor: 'rgba(200, 164, 106, 0.1)', borderRadius: '3px' }}>{s.badge}</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{s.count} Collectors</span>
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>{s.name}</h3>
            <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0 }}>{s.desc}</p>
          </div>
        ))}

        {segments.map((s) => (
          <div key={s.id} style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#60a5fa', padding: '2px 6px', backgroundColor: 'rgba(96, 165, 250, 0.1)', borderRadius: '3px' }}>Custom Segment</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{s.memberCount} Members</span>
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>{s.name}</h3>
            <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0 }}>{s.description || 'Custom filter rule set'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
