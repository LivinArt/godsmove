'use client';

import React, { useState, useEffect } from 'react';
import { executeCustomerQuickAction, executeBulkCustomerAction } from '@/actions/marketing.actions';

export default function MarketingCustomersPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'CAMPAIGNS' | 'NOTIFICATIONS' | 'WALLET' | 'TAGS' | 'NOTES'>('TIMELINE');
  const [loading, setLoading] = useState(false);

  // Quick Action modal state
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionPayload, setActionPayload] = useState<any>({});

  // Sample Customer CRM List
  const customers = [
    { id: 'usr_1', firstName: 'Livin', lastName: 'Art', email: 'livinarttech@gmail.com', phone: '+919876543210', spend: 28500, wallet: 1500, orders: 4, marketingEmails: true, role: 'VIP', city: 'Mumbai' },
    { id: 'usr_2', firstName: 'Aarav', lastName: 'Sharma', email: 'aarav@example.com', phone: '+919811223344', spend: 14200, wallet: 500, orders: 2, marketingEmails: true, role: 'MEMBER', city: 'Delhi' },
    { id: 'usr_3', firstName: 'Ananya', lastName: 'Verma', email: 'ananya@example.com', phone: '+919899001122', spend: 8900, wallet: 0, orders: 1, marketingEmails: true, role: 'MEMBER', city: 'Bengaluru' },
    { id: 'usr_4', firstName: 'Rohan', lastName: 'Mehta', email: 'rohan@example.com', phone: '+919711223344', spend: 32000, wallet: 2500, orders: 5, marketingEmails: true, role: 'VIP', city: 'Mumbai' },
    { id: 'usr_5', firstName: 'Priya', lastName: 'Nair', email: 'priya@example.com', phone: '+919654321098', spend: 0, wallet: 0, orders: 0, marketingEmails: false, role: 'NEW', city: 'Chennai' },
  ];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExecuteQuickAction = async () => {
    if (!selectedCustomer || !actionType) return;
    setLoading(true);
    try {
      await executeCustomerQuickAction({
        action: actionType as any,
        profileId: selectedCustomer.id,
        payload: actionPayload,
      });
      alert(`✅ Action ${actionType} executed for ${selectedCustomer.email}`);
      setActionType(null);
      setActionPayload({});
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: any) => {
    if (selectedIds.length === 0) {
      alert('Please select at least one customer.');
      return;
    }
    setLoading(true);
    try {
      const res = await executeBulkCustomerAction({
        action,
        targetScope: 'SELECTED',
        selectedProfileIds: selectedIds,
        payload: { subject: 'Bulk Dispatch Notice', message: 'Greetings from GODSMOVE.' },
      });
      alert(`✅ Bulk action ${action} executed for ${res.count} customers.`);
      setSelectedIds([]);
    } catch (err: any) {
      alert(err.message || 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header & Bulk Actions Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>CUSTOMER ENGAGEMENT CRM DIRECTORY</h2>
          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Timeline History • Vault Credit Balances • Quick Actions & Bulk Selection</span>
        </div>

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#121215', padding: '6px 16px', borderRadius: '6px', border: '1px solid #c8a46a' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#c8a46a' }}>{selectedIds.length} SELECTED</span>
            <button onClick={() => handleBulkAction('SEND_NEWSLETTER')} disabled={loading} style={bulkBtnStyle}>Send Newsletter</button>
            <button onClick={() => handleBulkAction('SEND_COUPON')} disabled={loading} style={bulkBtnStyle}>Send Coupon</button>
            <button onClick={() => handleBulkAction('ASSIGN_TAG')} disabled={loading} style={bulkBtnStyle}>Assign Tag</button>
          </div>
        )}
      </div>

      {/* CUSTOMER DIRECTORY TABLE */}
      <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
        <table width="100%" cellPadding="12" cellSpacing="0" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#8c857b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th style={{ width: '40px' }}><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === customers.length} /></th>
              <th>Customer</th>
              <th>Email</th>
              <th>City</th>
              <th>Orders</th>
              <th>Lifetime Spend</th>
              <th>Vault Credits</th>
              <th>Consent</th>
              <th>Engagement Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#ffffff' }}>
                <td><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => handleToggleSelect(c.id)} /></td>
                <td style={{ fontWeight: 700 }}>
                  {c.firstName} {c.lastName}
                  {c.role === 'VIP' && <span style={{ fontSize: '9px', fontWeight: 800, color: '#c8a46a', backgroundColor: 'rgba(200,164,106,0.1)', padding: '1px 4px', borderRadius: '2px', marginLeft: '6px' }}>VIP</span>}
                </td>
                <td style={{ color: '#a1a1aa' }}>{c.email}</td>
                <td style={{ color: '#a1a1aa' }}>{c.city}</td>
                <td>{c.orders}</td>
                <td style={{ color: '#22c55e', fontWeight: 700 }}>₹{c.spend.toLocaleString('en-IN')}</td>
                <td style={{ color: '#c8a46a', fontWeight: 700 }}>₹{c.wallet.toLocaleString('en-IN')}</td>
                <td>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: c.marketingEmails ? '#22c55e' : '#ef4444' }}>
                    {c.marketingEmails ? 'OPTED IN' : 'OPTED OUT'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => setSelectedCustomer(c)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#c8a46a', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Engagement Drawer →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CUSTOMER ENGAGEMENT DRAWER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 100 }}>
          <div style={{ backgroundColor: '#121215', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', width: '100%', maxWidth: '650px', height: '100vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', color: '#c8a46a' }}>CUSTOMER ENGAGEMENT DRAWER</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>{selectedCustomer.firstName} {selectedCustomer.lastName}</h2>
                <div style={{ fontSize: '11px', color: '#a1a1aa' }}>{selectedCustomer.email} • {selectedCustomer.phone}</div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Quick Actions Bar */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button onClick={() => setActionType('SEND_EMAIL')} style={quickBtnStyle}>✉ Send Email</button>
              <button onClick={() => setActionType('SEND_COUPON')} style={quickBtnStyle}>🎟 Send Coupon</button>
              <button onClick={() => setActionType('SEND_VIP_INVITE')} style={quickBtnStyle}>⭐ Send VIP Pass</button>
              <button onClick={() => setActionType('TAG_CUSTOMER')} style={quickBtnStyle}>🏷 Tag Customer</button>
              <button onClick={() => setActionType('ADD_NOTE')} style={quickBtnStyle}>📝 Add Admin Note</button>
            </div>

            {/* QUICK ACTION EXECUTION FORM */}
            {actionType && (
              <div style={{ backgroundColor: '#09090b', padding: '16px', borderRadius: '6px', border: '1px solid #c8a46a', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#c8a46a', margin: '0 0 10px 0' }}>EXECUTE QUICK ACTION: {actionType}</h4>
                {actionType === 'SEND_EMAIL' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="text" placeholder="Subject" onChange={(e) => setActionPayload({ ...actionPayload, subject: e.target.value })} style={inputStyle} />
                    <textarea placeholder="Message Content..." onChange={(e) => setActionPayload({ ...actionPayload, message: e.target.value })} style={inputStyle} />
                  </div>
                )}
                {actionType === 'SEND_COUPON' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Coupon Code (e.g. VIP20)" onChange={(e) => setActionPayload({ ...actionPayload, code: e.target.value })} style={inputStyle} />
                  </div>
                )}
                {actionType === 'TAG_CUSTOMER' && (
                  <input type="text" placeholder="Tag Name (e.g. High_Spender)" onChange={(e) => setActionPayload({ ...actionPayload, tagName: e.target.value })} style={inputStyle} />
                )}
                {actionType === 'ADD_NOTE' && (
                  <textarea placeholder="Admin note..." onChange={(e) => setActionPayload({ ...actionPayload, note: e.target.value })} style={inputStyle} />
                )}
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => setActionType(null)} style={{ flex: 1, backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '4px', fontSize: '11px' }}>Cancel</button>
                  <button onClick={handleExecuteQuickAction} disabled={loading} style={{ flex: 1, backgroundColor: '#c8a46a', color: '#000', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>Execute</button>
                </div>
              </div>
            )}

            {/* ENGAGEMENT TABS */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px', marginBottom: '16px' }}>
              {(['TIMELINE', 'CAMPAIGN_HISTORY', 'NOTIFICATIONS', 'WALLET', 'TAGS'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: activeTab === t ? '#c8a46a' : 'transparent',
                    color: activeTab === t ? '#000000' : '#a1a1aa',
                    cursor: 'pointer',
                  }}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
              <div style={{ backgroundColor: '#09090b', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: '4px' }}>Order Allocation Logged</div>
                <div>Completed order #GM-8812 • Total ₹14,200 via Razorpay</div>
                <div style={{ fontSize: '10px', color: '#8c857b', marginTop: '4px' }}>Yesterday at 4:30 PM</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const bulkBtnStyle = { backgroundColor: 'rgba(200, 164, 106, 0.15)', color: '#c8a46a', border: '1px solid #c8a46a', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' };
const quickBtnStyle = { backgroundColor: 'rgba(255,255,255,0.04)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' };
const inputStyle = { width: '100%', backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px', color: '#ffffff', fontSize: '12px', outline: 'none' };
