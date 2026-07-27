'use client';

import React, { useState } from 'react';
import { retryNotificationDispatch } from '@/actions/marketing.actions';

interface LedgerRecord {
  id: string;
  eventType: string;
  email: string;
  provider: string;
  providerMessageId?: string | null;
  status: string;
  attachmentNames: string[];
  idempotencyKey?: string | null;
  createdAt: string | Date;
  error?: string | null;
}

interface Props {
  records: LedgerRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export default function LedgerClient({ records: initialRecords, total, page, totalPages }: Props) {
  const [records, setRecords] = useState<LedgerRecord[]>(initialRecords);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('ALL');

  const filteredRecords = records.filter(
    (r) => eventFilter === 'ALL' || r.eventType === eventFilter
  );

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await retryNotificationDispatch(id);
      alert('Notification re-dispatched successfully!');
    } catch (err: any) {
      alert('Retry failed: ' + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            EMAIL DELIVERY LEDGER & AUDIT TRAIL
          </h2>
          <p style={{ fontSize: '12px', color: '#8c857b', margin: '4px 0 0 0' }}>
            Live database audit of every transactional email dispatch, provider ID, and idempotency key ({total} Total Records)
          </p>
        </div>

        {/* Filter */}
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 700, backgroundColor: '#121215', color: '#c8a46a', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', outline: 'none' }}
        >
          <option value="ALL">Filter by Event (ALL)</option>
          <option value="ORDER_CREATED">ORDER_CREATED</option>
          <option value="ORDER_CONFIRMED">ORDER_CONFIRMED</option>
          <option value="INVOICE_REQUEST">INVOICE_REQUEST</option>
          <option value="WALLET_CREDITED">WALLET_CREDITED</option>
          <option value="WALLET_DEBITED">WALLET_DEBITED</option>
          <option value="WELCOME">WELCOME</option>
          <option value="PROFILE_UPDATED">PROFILE_UPDATED</option>
          <option value="ORDER_SHIPPED">ORDER_SHIPPED</option>
          <option value="ORDER_DELIVERED">ORDER_DELIVERED</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.02)', textAlign: 'left', color: '#8c857b' }}>
              <th style={{ padding: '14px 16px' }}>Event</th>
              <th style={{ padding: '14px 16px' }}>Recipient</th>
              <th style={{ padding: '14px 16px' }}>Provider</th>
              <th style={{ padding: '14px 16px' }}>Resend Provider Msg ID</th>
              <th style={{ padding: '14px 16px' }}>Attachments</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Dispatched At</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
                  No delivery logs recorded matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#e4e4e7' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#ffffff' }}>{r.eventType}</td>
                  <td style={{ padding: '14px 16px' }}>{r.email}</td>
                  <td style={{ padding: '14px 16px', color: '#a1a1aa' }}>{r.provider}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#60a5fa' }}>
                    {r.providerMessageId || 'N/A'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '11px', color: '#c8a46a' }}>
                    {r.attachmentNames && r.attachmentNames.length > 0 ? r.attachmentNames.join(', ') : 'None'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: r.status === 'SENT' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: r.status === 'SENT' ? '#22c55e' : '#ef4444',
                        border: r.status === 'SENT' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#71717a', fontSize: '11px' }}>
                    {new Date(r.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRetry(r.id)}
                      disabled={retryingId === r.id}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: 'rgba(200, 164, 106, 0.1)',
                        color: '#c8a46a',
                        border: '1px solid #c8a46a',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      {retryingId === r.id ? 'Retrying...' : '↻ Retry'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
