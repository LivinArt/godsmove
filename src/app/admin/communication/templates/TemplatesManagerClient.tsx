'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  getSystemTemplateDetails,
  sendTestEmailAction,
  rollbackTemplateVersion,
} from '@/actions/communication.actions';
import { NotificationEvent } from '@/notifications/types/notification.types';

interface TemplateCard {
  id: NotificationEvent;
  name: string;
  trigger: string;
  category: string;
  variables: string[];
  status: string;
  version: string;
  lastUpdated: string | Date;
  subject: string;
  isCustom: boolean;
}

interface Props {
  cards: TemplateCard[];
}

export default function TemplatesManagerClient({ cards }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Preview Modal state
  const [previewTemplateId, setPreviewTemplateId] = useState<NotificationEvent | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  // Send Test Modal state
  const [sendTestTemplateId, setSendTestTemplateId] = useState<NotificationEvent | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string>('support@godsmove.in');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [sendTestResult, setSendTestResult] = useState<{ success: boolean; messageId?: string; error?: string } | null>(null);

  // History Drawer state
  const [historyTemplateId, setHistoryTemplateId] = useState<NotificationEvent | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  const categories = ['ALL', 'ONBOARDING', 'ORDER', 'PAYMENT', 'DELIVERY', 'WALLET', 'RETURN', 'ACCOUNT'];

  const filteredCards = cards.filter((c) => activeCategory === 'ALL' || c.category === activeCategory);

  // Handle Preview Click
  const handleOpenPreview = async (templateId: NotificationEvent) => {
    setPreviewTemplateId(templateId);
    setIsPreviewLoading(true);
    try {
      const res = await getSystemTemplateDetails(templateId);
      setPreviewData(res);
    } catch (err: any) {
      alert('Failed to load email preview: ' + err.message);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Handle Send Test Click
  const handleOpenSendTest = (templateId: NotificationEvent) => {
    setSendTestTemplateId(templateId);
    setSendTestResult(null);
  };

  const handleExecuteSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendTestTemplateId) return;
    setIsSendingTest(true);
    setSendTestResult(null);
    try {
      const res = await sendTestEmailAction(sendTestTemplateId, recipientEmail);
      setSendTestResult({
        success: true,
        messageId: res.providerMessageId,
      });
    } catch (err: any) {
      setSendTestResult({
        success: false,
        error: err.message || 'Failed to dispatch test email',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Handle Version History Click
  const handleOpenHistory = async (templateId: NotificationEvent) => {
    setHistoryTemplateId(templateId);
    setIsHistoryLoading(true);
    try {
      const res = await getSystemTemplateDetails(templateId);
      setHistoryList(res.history || []);
    } catch (err: any) {
      alert('Failed to load version history: ' + err.message);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!confirm('Are you sure you want to activate this historical version?')) return;
    try {
      await rollbackTemplateVersion(versionId);
      alert('Template successfully rolled back!');
      if (historyTemplateId) {
        handleOpenHistory(historyTemplateId);
      }
    } catch (err: any) {
      alert('Rollback failed: ' + err.message);
    }
  };

  return (
    <div>
      {/* Top Banner Notice */}
      <div style={{ backgroundColor: '#121215', border: '1px solid rgba(200, 164, 106, 0.3)', borderRadius: '6px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#c8a46a', letterSpacing: '0.05em' }}>
            SYSTEM TEMPLATES POLICY
          </span>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '4px 0 0 0' }}>
            All 20 transactional emails are system-managed event triggers. System templates can be edited and versioned, but cannot be added or deleted.
          </p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 12px', borderRadius: '4px' }}>
          20 / 20 SYSTEM TEMPLATES READY
        </span>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '4px',
              cursor: 'pointer',
              border: activeCategory === cat ? '1px solid #c8a46a' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: activeCategory === cat ? 'rgba(200, 164, 106, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: activeCategory === cat ? '#c8a46a' : '#a1a1aa',
              letterSpacing: '0.05em',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 20 System Email Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredCards.map((card) => (
          <div
            key={card.id}
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
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#8c857b', letterSpacing: '0.1em' }}>{card.category}</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>{card.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#c8a46a', backgroundColor: 'rgba(200, 164, 106, 0.1)', border: '1px solid rgba(200, 164, 106, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                    {card.version}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: card.isCustom ? '#22c55e' : '#60a5fa', backgroundColor: card.isCustom ? 'rgba(34, 197, 94, 0.1)' : 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    {card.isCustom ? 'ACTIVE' : 'DEFAULT'}
                  </span>
                </div>
              </div>

              {/* Trigger Info */}
              <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0 0 14px 0', minHeight: '36px' }}>
                <strong>Trigger:</strong> {card.trigger}
              </p>

              {/* Subject & Updated info */}
              <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px', padding: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#e4e4e7', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong>Subject:</strong> {card.subject}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a', marginTop: '4px' }}>
                  Updated: {new Date(card.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => handleOpenPreview(card.id)}
                style={btnSecondaryStyle}
              >
                👁 Preview
              </button>
              <button
                onClick={() => handleOpenSendTest(card.id)}
                style={btnSecondaryStyle}
              >
                ✈ Send Test
              </button>
              <Link
                href={`/admin/communication/templates/edit/${card.id}`}
                style={{ ...btnPrimaryStyle, textAlign: 'center', textDecoration: 'none' }}
              >
                ✏ Edit Template
              </Link>
              <button
                onClick={() => handleOpenHistory(card.id)}
                style={btnSecondaryStyle}
              >
                📜 History
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── PREVIEW MODAL ──────────────────────────────────────────────────── */}
      {previewTemplateId && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: previewDevice === 'desktop' ? '900px' : '480px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  INBOX PREVIEW — {previewTemplateId}
                </h3>
                <span style={{ fontSize: '11px', color: '#8c857b' }}>Exact Brand Inbox Rendering (Fixed Brand Styling)</span>
              </div>

              {/* Device Switcher */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: previewDevice === 'desktop' ? '#c8a46a' : 'rgba(255, 255, 255, 0.05)',
                    color: previewDevice === 'desktop' ? '#000000' : '#ffffff',
                    border: 'none',
                  }}
                >
                  🖥 Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: previewDevice === 'mobile' ? '#c8a46a' : 'rgba(255, 255, 255, 0.05)',
                    color: previewDevice === 'mobile' ? '#000000' : '#ffffff',
                    border: 'none',
                  }}
                >
                  📱 Mobile
                </button>
                <button
                  onClick={() => setPreviewTemplateId(null)}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer', marginLeft: '12px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Email Body Container */}
            <div style={{ padding: '20px 0' }}>
              {isPreviewLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#c8a46a', fontWeight: 700 }}>
                  Rendering exact email HTML...
                </div>
              ) : previewData ? (
                <div>
                  {/* Email Subject Line Header */}
                  <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#71717a' }}>From: {previewData.sender}</div>
                    <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 800, marginTop: '2px' }}>
                      Subject: {previewData.subject}
                    </div>
                  </div>

                  {/* Rendered Email Frame */}
                  <div style={{ width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                    <iframe
                      title="Email Preview"
                      srcDoc={previewData.renderedHtml}
                      style={{
                        width: previewDevice === 'desktop' ? '100%' : '375px',
                        height: '550px',
                        border: previewDevice === 'mobile' ? '12px solid #27272a' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: previewDevice === 'mobile' ? '28px' : '6px',
                        backgroundColor: '#000000',
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── SEND TEST MODAL ────────────────────────────────────────────────── */}
      {sendTestTemplateId && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '480px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  SEND TEST EMAIL
                </h3>
                <span style={{ fontSize: '11px', color: '#8c857b' }}>{sendTestTemplateId}</span>
              </div>
              <button
                onClick={() => setSendTestTemplateId(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteSendTest} style={{ padding: '20px 0 0 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#c8a46a', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  RECIPIENT EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="admin@godsmove.in"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '13px',
                    backgroundColor: '#18181b',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '4px',
                    color: '#ffffff',
                    outline: 'none',
                  }}
                />
              </div>

              {sendTestResult && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    backgroundColor: sendTestResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: sendTestResult.success ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    color: sendTestResult.success ? '#22c55e' : '#ef4444',
                    fontSize: '12px',
                  }}
                >
                  {sendTestResult.success ? (
                    <div>
                      <div style={{ fontWeight: 800 }}>✅ Test Email Dispatched Successfully!</div>
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#a1a1aa' }}>
                        Provider Message ID: <strong style={{ color: '#ffffff' }}>{sendTestResult.messageId}</strong>
                      </div>
                    </div>
                  ) : (
                    <div>❌ {sendTestResult.error}</div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setSendTestTemplateId(null)}
                  style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, backgroundColor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#a1a1aa', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  style={{ padding: '10px 20px', fontSize: '12px', fontWeight: 800, backgroundColor: '#c8a46a', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {isSendingTest ? 'Sending Test...' : 'Send Test Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VERSION HISTORY DRAWER ─────────────────────────────────────────── */}
      {historyTemplateId && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '600px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  VERSION HISTORY — {historyTemplateId}
                </h3>
                <span style={{ fontSize: '11px', color: '#8c857b' }}>1-Click Rollback to Previous Published Versions</span>
              </div>
              <button
                onClick={() => setHistoryTemplateId(null)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 0', maxHeight: '450px', overflowY: 'auto' }}>
              {isHistoryLoading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#c8a46a' }}>Loading version history...</div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#71717a' }}>No custom versions published yet. Using active compiled React Email template.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {historyList.map((ver) => (
                    <div
                      key={ver.id}
                      style={{
                        backgroundColor: '#18181b',
                        border: ver.isActive ? '1px solid #c8a46a' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>v{ver.version}.0</span>
                          {ver.isActive && (
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                              CURRENTLY ACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
                          Subject: {ver.subject}
                        </div>
                        <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>
                          Created: {new Date(ver.createdAt).toLocaleString('en-IN')} by {ver.createdBy || 'ADMIN'}
                        </div>
                      </div>

                      {!ver.isActive && (
                        <button
                          onClick={() => handleRollback(ver.id)}
                          style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(200, 164, 106, 0.1)', color: '#c8a46a', border: '1px solid #c8a46a', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Rollback to Version
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimaryStyle = { padding: '8px 12px', fontSize: '11px', fontWeight: 800, backgroundColor: '#c8a46a', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const btnSecondaryStyle = { padding: '8px 12px', fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#e4e4e7', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '24px', color: '#ffffff' };
