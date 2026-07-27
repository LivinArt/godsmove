'use client';

import React, { useState } from 'react';
import {
  saveSegment,
  deleteSegment,
  previewSegmentCustomers,
  FilterGroup,
  FilterCondition,
} from '@/actions/communication.actions';

interface SegmentItem {
  id: string;
  name: string;
  description?: string | null;
  rulesJson: string;
  memberCount: number;
  createdAt: string | Date;
}

interface Props {
  initialSegments: SegmentItem[];
}

export default function SegmentsManagerClient({ initialSegments }: Props) {
  const [segments, setSegments] = useState<SegmentItem[]>(initialSegments);

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [segmentName, setSegmentName] = useState<string>('');
  const [segmentDesc, setSegmentDesc] = useState<string>('');
  
  // Filter Groups state
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: 'group_1',
      logic: 'AND',
      conditions: [
        { id: 'cond_1', field: 'totalSpend', operator: 'greater_than', value: '5000' },
      ],
    },
  ]);

  // Preview Customers Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewCustomers, setPreviewCustomers] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  const availableFields = [
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'gender', label: 'Gender' },
    { key: 'walletBalance', label: 'Wallet Balance (₹)' },
    { key: 'orderCount', label: 'Total Orders' },
    { key: 'totalSpend', label: 'Total Revenue / Spend (₹)' },
    { key: 'lastPurchaseDate', label: 'Last Purchase Date' },
    { key: 'firstPurchaseDate', label: 'First Purchase Date' },
    { key: 'inactivityDays', label: 'Inactivity (Days)' },
    { key: 'birthdayMonth', label: 'Birthday Month' },
    { key: 'tags', label: 'Customer Tags' },
    { key: 'profileCompletion', label: 'Profile Completion (%)' },
    { key: 'loginFrequency', label: 'Login Frequency' },
    { key: 'signupSource', label: 'Signup Source' },
    { key: 'customAttribute', label: 'Custom Attributes' },
  ];

  // Open Editor for New Segment
  const handleOpenNewSegment = () => {
    setEditingSegmentId(null);
    setSegmentName('');
    setSegmentDesc('');
    setGroups([
      {
        id: 'group_1',
        logic: 'AND',
        conditions: [{ id: 'cond_1', field: 'totalSpend', operator: 'greater_than', value: '5000' }],
      },
    ]);
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Segment
  const handleEditSegment = (seg: SegmentItem) => {
    setEditingSegmentId(seg.id);
    setSegmentName(seg.name);
    setSegmentDesc(seg.description || '');
    try {
      const parsed = JSON.parse(seg.rulesJson);
      if (Array.isArray(parsed)) {
        setGroups(parsed);
      }
    } catch {
      // Default
    }
    setIsEditorOpen(true);
  };

  // Duplicate Segment
  const handleDuplicateSegment = async (seg: SegmentItem) => {
    try {
      const newSeg = await saveSegment({
        name: `${seg.name} (Copy)`,
        description: seg.description || undefined,
        rulesJson: seg.rulesJson,
      });
      setSegments([newSeg as any, ...segments]);
      alert('Segment duplicated successfully!');
    } catch (err: any) {
      alert('Failed to duplicate segment: ' + err.message);
    }
  };

  // Delete Segment
  const handleDeleteSegment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;
    try {
      await deleteSegment(id);
      setSegments(segments.filter((s) => s.id !== id));
    } catch (err: any) {
      alert('Failed to delete segment: ' + err.message);
    }
  };

  // Add Filter Condition
  const handleAddCondition = (groupId: string) => {
    setGroups(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            conditions: [
              ...g.conditions,
              { id: 'cond_' + Date.now(), field: 'city', operator: 'equals', value: '' },
            ],
          };
        }
        return g;
      })
    );
  };

  // Remove Filter Condition
  const handleRemoveCondition = (groupId: string, condId: string) => {
    setGroups(
      groups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            conditions: g.conditions.filter((c) => c.id !== condId),
          };
        }
        return g;
      })
    );
  };

  // Add Filter Group
  const handleAddGroup = () => {
    setGroups([
      ...groups,
      {
        id: 'group_' + Date.now(),
        logic: 'OR',
        conditions: [{ id: 'cond_' + Date.now(), field: 'city', operator: 'equals', value: '' }],
      },
    ]);
  };

  // Save Segment Handler
  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentName.trim()) {
      alert('Segment name is required.');
      return;
    }

    try {
      const saved = await saveSegment({
        id: editingSegmentId || undefined,
        name: segmentName,
        description: segmentDesc,
        rulesJson: JSON.stringify(groups),
      });

      if (editingSegmentId) {
        setSegments(segments.map((s) => (s.id === editingSegmentId ? (saved as any) : s)));
      } else {
        setSegments([saved as any, ...segments]);
      }

      setIsEditorOpen(false);
      alert('Customer Segment saved successfully!');
    } catch (err: any) {
      alert('Failed to save segment: ' + err.message);
    }
  };

  // Preview Customers
  const handlePreviewCustomers = async (rulesJson: string) => {
    setIsPreviewOpen(true);
    setIsPreviewLoading(true);
    try {
      const customers = await previewSegmentCustomers(rulesJson);
      setPreviewCustomers(customers);
    } catch (err: any) {
      alert('Failed to load preview: ' + err.message);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            DYNAMIC CUSTOMER SEGMENTS
          </h2>
          <p style={{ fontSize: '12px', color: '#8c857b', margin: '4px 0 0 0' }}>
            Unlimited nested filter conditions with real-time reach calculation
          </p>
        </div>
        <button
          onClick={handleOpenNewSegment}
          style={{ padding: '10px 18px', fontSize: '12px', fontWeight: 800, backgroundColor: '#c8a46a', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Create New Segment
        </button>
      </div>

      {/* Segments Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {segments.map((seg) => (
          <div
            key={seg.id}
            style={{
              backgroundColor: '#121215',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>{seg.name}</h3>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                  {seg.memberCount} Customers
                </span>
              </div>

              <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0 0 16px 0', minHeight: '36px' }}>
                {seg.description || 'Dynamic filter group segment'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
              <button
                onClick={() => handlePreviewCustomers(seg.rulesJson)}
                style={btnSecondaryStyle}
              >
                👥 Preview ({seg.memberCount})
              </button>
              <button
                onClick={() => handleEditSegment(seg)}
                style={btnSecondaryStyle}
              >
                ✏ Edit Rules
              </button>
              <button
                onClick={() => handleDuplicateSegment(seg)}
                style={btnSecondaryStyle}
              >
                📋 Duplicate
              </button>
              <button
                onClick={() => handleDeleteSegment(seg.id)}
                style={{ ...btnSecondaryStyle, color: '#ef4444' }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEGMENT BUILDER MODAL ──────────────────────────────────────────── */}
      {isEditorOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {editingSegmentId ? 'EDIT SEGMENT RULES' : 'CREATE CUSTOMER SEGMENT'}
                </h3>
                <span style={{ fontSize: '11px', color: '#8c857b' }}>Unlimited AND/OR Filter Groups</span>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSegment} style={{ padding: '20px 0 0 0' }}>
              {/* Segment Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#c8a46a', marginBottom: '6px' }}>SEGMENT NAME</label>
                  <input
                    type="text"
                    required
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="e.g. High Value Collectors (Bandra)"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#8c857b', marginBottom: '6px' }}>DESCRIPTION</label>
                  <input
                    type="text"
                    value={segmentDesc}
                    onChange={(e) => setSegmentDesc(e.target.value)}
                    placeholder="e.g. Customers with > ₹10,000 spend in Mumbai"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Filter Groups Builder */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>FILTER CONDITIONS & GROUPS</label>
                  <button
                    type="button"
                    onClick={handleAddGroup}
                    style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', border: '1px solid rgba(96, 165, 250, 0.4)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + Add Filter Group
                  </button>
                </div>

                {groups.map((group, groupIdx) => (
                  <div
                    key={group.id}
                    style={{
                      backgroundColor: '#18181b',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#c8a46a' }}>GROUP #{groupIdx + 1}</span>
                        <select
                          value={group.logic}
                          onChange={(e) => {
                            const newLogic = e.target.value as 'AND' | 'OR';
                            setGroups(groups.map((g) => (g.id === group.id ? { ...g, logic: newLogic } : g)));
                          }}
                          style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 800, backgroundColor: '#09090b', color: '#60a5fa', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                        >
                          <option value="AND">AND (Match All)</option>
                          <option value="OR">OR (Match Any)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddCondition(group.id)}
                        style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        + Add Condition
                      </button>
                    </div>

                    {/* Conditions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {group.conditions.map((cond) => (
                        <div key={cond.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr 40px', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={cond.field}
                            onChange={(e) => {
                              const newField = e.target.value;
                              setGroups(groups.map((g) => g.id === group.id ? {
                                ...g,
                                conditions: g.conditions.map((c) => c.id === cond.id ? { ...c, field: newField } : c),
                              } : g));
                            }}
                            style={inputStyle}
                          >
                            {availableFields.map((f) => (
                              <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                          </select>

                          <select
                            value={cond.operator}
                            onChange={(e) => {
                              const newOp = e.target.value as any;
                              setGroups(groups.map((g) => g.id === group.id ? {
                                ...g,
                                conditions: g.conditions.map((c) => c.id === cond.id ? { ...c, operator: newOp } : c),
                              } : g));
                            }}
                            style={inputStyle}
                          >
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not Equals</option>
                            <option value="contains">Contains</option>
                            <option value="greater_than">Greater Than (&gt;)</option>
                            <option value="less_than">Less Than (&lt;)</option>
                          </select>

                          <input
                            type="text"
                            value={cond.value}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setGroups(groups.map((g) => g.id === group.id ? {
                                ...g,
                                conditions: g.conditions.map((c) => c.id === cond.id ? { ...c, value: newVal } : c),
                              } : g));
                            }}
                            placeholder="Value..."
                            style={inputStyle}
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveCondition(group.id, cond.id)}
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', height: '38px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  style={btnSecondaryStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={btnPrimaryStyle}
                >
                  Save Segment Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PREVIEW CUSTOMERS MODAL ────────────────────────────────────────── */}
      {isPreviewOpen && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '700px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  SEGMENT MEMBER PREVIEW
                </h3>
                <span style={{ fontSize: '11px', color: '#8c857b' }}>Live Target Customer Reach</span>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 0', maxHeight: '400px', overflowY: 'auto' }}>
              {isPreviewLoading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#c8a46a' }}>Loading segment members...</div>
              ) : previewCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>No customers match the active segment rules.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#8c857b' }}>
                      <th style={{ padding: '8px' }}>Customer Name</th>
                      <th style={{ padding: '8px' }}>Email</th>
                      <th style={{ padding: '8px' }}>Orders</th>
                      <th style={{ padding: '8px' }}>Lifetime Spend</th>
                      <th style={{ padding: '8px' }}>Vault Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewCustomers.map((cust) => (
                      <tr key={cust.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e4e4e7' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 700 }}>{cust.name}</td>
                        <td style={{ padding: '10px 8px' }}>{cust.email}</td>
                        <td style={{ padding: '10px 8px' }}>{cust.orderCount}</td>
                        <td style={{ padding: '10px 8px' }}>₹{cust.totalSpend.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px 8px', color: '#c8a46a' }}>₹{cust.walletBalance.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px 12px', fontSize: '12px', backgroundColor: '#09090b', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', color: '#ffffff', outline: 'none' };
const btnPrimaryStyle = { padding: '10px 18px', fontSize: '12px', fontWeight: 800, backgroundColor: '#c8a46a', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const btnSecondaryStyle = { padding: '8px 12px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#e4e4e7', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '24px', color: '#ffffff' };
