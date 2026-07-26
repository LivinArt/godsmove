'use client';

import React, { useState, useEffect } from 'react';
import { getNotificationAuditHistory, retryNotificationDispatch } from '@/actions/marketing.actions';

export default function ProductionDebugPanelPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLogForHtml, setSelectedLogForHtml] = useState<any>(null);
  const [retryStatus, setRetryStatus] = useState<string>('');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await getNotificationAuditHistory(1, 50);
      setHistory(data.history);
      setTotal(data.total);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleRetry = async (id: string) => {
    setRetryStatus(`Retrying notification ID: ${id}...`);
    try {
      await retryNotificationDispatch(id);
      setRetryStatus(`✅ Retry successful for ID: ${id}`);
      loadAuditLogs();
    } catch (err: any) {
      setRetryStatus(`❌ Retry failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>TRANSACTIONAL NOTIFICATION AUDIT & DEBUG PANEL</h2>
          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Real-time Resend Delivery Log • Message IDs • Payload Auditing & Retry Engine ({total} Records)</span>
        </div>

        <button
          onClick={loadAuditLogs}
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#c8a46a', border: '1px solid #c8a46a', padding: '6px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
        >
          🔄 Refresh Audit Log
        </button>
      </div>

      {retryStatus && (
        <div style={{ padding: '12px', borderRadius: '4px', backgroundColor: 'rgba(200, 164, 106, 0.1)', border: '1px solid #c8a46a', color: '#c8a46a', fontSize: '12px', marginBottom: '20px' }}>
          {retryStatus}
        </div>
      )}

      {/* AUDIT LOGS TABLE */}
      <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
        <table width="100%" cellPadding="12" cellSpacing="0" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#8c857b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th>Event Key</th>
              <th>Recipient</th>
              <th>Subject Line</th>
              <th>Provider ID (Resend)</th>
              <th>Status</th>
              <th>Dispatched Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#a1a1aa', padding: '32px' }}>
                  Loading production audit logs from database...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#a1a1aa', padding: '32px' }}>
                  No transactional notification history logged yet. Run a test send or trigger an event to inspect dispatches.
                </td>
              </tr>
            ) : (
              history.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#ffffff' }}>
                  <td style={{ fontWeight: 700, color: '#c8a46a', fontFamily: 'monospace' }}>{log.eventType}</td>
                  <td style={{ color: '#a1a1aa' }}>{log.email}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.subject || 'Standard Transactional Dispatch'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px', color: '#60a5fa' }}>{log.providerMessageId || 'N/A'}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 800,
                        backgroundColor: log.status === 'SENT' || log.status === 'DELIVERED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: log.status === 'SENT' || log.status === 'DELIVERED' ? '#22c55e' : '#ef4444',
                        border: '1px solid currentColor',
                      }}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td style={{ color: '#8c857b', fontSize: '11px' }}>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setSelectedLogForHtml(log)}
                        style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleRetry(log.id)}
                        style={{ backgroundColor: 'rgba(200, 164, 106, 0.1)', color: '#c8a46a', border: '1px solid #c8a46a', padding: '4px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Retry Send
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* INSPECT LOG MODAL */}
      {selectedLogForHtml && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', width: '100%', maxWidth: '650px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', color: '#c8a46a' }}>NOTIFICATION LOG DETAILS</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>{selectedLogForHtml.eventType}</h3>
              </div>
              <button onClick={() => setSelectedLogForHtml(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#ffffff' }}>
              <div><strong>Recipient:</strong> <span style={{ color: '#a1a1aa' }}>{selectedLogForHtml.email}</span></div>
              <div><strong>Provider:</strong> <span style={{ color: '#a1a1aa' }}>{selectedLogForHtml.provider} (Resend)</span></div>
              <div><strong>Provider Message ID:</strong> <span style={{ color: '#c8a46a', fontFamily: 'monospace' }}>{selectedLogForHtml.providerMessageId || 'N/A'}</span></div>
              <div><strong>Status:</strong> <span style={{ color: selectedLogForHtml.status === 'SENT' ? '#22c55e' : '#ef4444' }}>{selectedLogForHtml.status}</span></div>
              <div><strong>Dispatched At:</strong> <span style={{ color: '#a1a1aa' }}>{new Date(selectedLogForHtml.createdAt).toLocaleString('en-IN')}</span></div>

              {selectedLogForHtml.error && (
                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '4px', border: '1px solid #ef4444', color: '#ef4444', marginTop: '10px' }}>
                  <strong>Error Log:</strong> {selectedLogForHtml.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
