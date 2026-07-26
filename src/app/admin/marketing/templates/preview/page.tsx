'use client';

import React, { useState, useEffect } from 'react';
import { getActiveTemplatePreview, sendTestEmail } from '@/actions/marketing.actions';

export default function StandaloneTemplatePreviewerPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState('ORDER_CREATED');
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [loading, setLoading] = useState(false);

  // Test Email state
  const [testEmailRecipient, setTestEmailRecipient] = useState('support@godsmove.in');
  const [testStatus, setTestStatus] = useState<string>('');
  const [providerMsgId, setProviderMsgId] = useState<string>('');

  const templatesList = [
    { id: 'ORDER_CREATED', name: 'Order Confirmation' },
    { id: 'ORDER_CONFIRMED', name: 'Order Confirmed' },
    { id: 'ORDER_SHIPPED', name: 'Order Shipped' },
    { id: 'ORDER_DELIVERED', name: 'Order Delivered' },
    { id: 'ORDER_CANCELLED', name: 'Order Cancelled' },
    { id: 'RETURN_REQUESTED', name: 'Return Requested' },
    { id: 'RETURN_APPROVED', name: 'Return Approved' },
    { id: 'RETURN_REJECTED', name: 'Return Rejected' },
    { id: 'REFUND_COMPLETED', name: 'Refund Settlement Completed' },
    { id: 'WALLET_CREDITED', name: 'Wallet Balance Credited' },
    { id: 'WALLET_DEBITED', name: 'Wallet Balance Applied' },
    { id: 'PASSWORD_RESET', name: 'Password Reset' },
    { id: 'EMAIL_VERIFICATION', name: 'Email Verification' },
    { id: 'WELCOME', name: 'Welcome Collector' },
  ];

  const loadActivePreview = async (templateId: string) => {
    setLoading(true);
    setTestStatus('');
    try {
      const data = await getActiveTemplatePreview(templateId);
      setPreviewData(data);
    } catch {
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivePreview(selectedTemplateId);
  }, [selectedTemplateId]);

  const handleSendTest = async () => {
    setTestStatus('Sending via Resend API...');
    setProviderMsgId('');
    try {
      const res = await sendTestEmail({
        templateId: selectedTemplateId,
        recipientEmail: testEmailRecipient,
      });

      if (res.success) {
        setTestStatus('✅ Delivered via Resend API (Inbox: support@godsmove.in)');
        setProviderMsgId(res.providerMessageId);
      } else {
        setTestStatus(`❌ Dispatch failed: ${res.error}`);
      }
    } catch (err: any) {
      setTestStatus(`❌ Dispatch failed: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121215', padding: '16px 24px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, color: '#8c857b', letterSpacing: '0.1em' }}>SELECT TRANSACTIONAL TEMPLATE:</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={{ backgroundColor: '#09090b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
          >
            {templatesList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id})
              </option>
            ))}
          </select>
        </div>

        {/* Viewport, Theme & Source Toggles */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPreviewDevice('desktop')}
            style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: previewDevice === 'desktop' ? '#c8a46a' : 'transparent', color: previewDevice === 'desktop' ? '#000' : '#fff', cursor: 'pointer' }}
          >
            💻 Desktop
          </button>
          <button
            onClick={() => setPreviewDevice('mobile')}
            style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: previewDevice === 'mobile' ? '#c8a46a' : 'transparent', color: previewDevice === 'mobile' ? '#000' : '#fff', cursor: 'pointer' }}
          >
            📱 Mobile (375px)
          </button>
          <button
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#fff', cursor: 'pointer' }}
          >
            {themeMode === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
          <button
            onClick={() => setShowHtmlSource(!showHtmlSource)}
            style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', border: '1px solid #c8a46a', backgroundColor: showHtmlSource ? '#c8a46a' : 'transparent', color: showHtmlSource ? '#000' : '#c8a46a', cursor: 'pointer' }}
          >
            {showHtmlSource ? 'Visual Render' : 'HTML Source'}
          </button>
        </div>
      </div>

      {/* METADATA SUMMARY BAR */}
      {previewData && (
        <div style={{ backgroundColor: '#121215', padding: '14px 20px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#c8a46a', padding: '2px 6px', backgroundColor: 'rgba(200,164,106,0.1)', borderRadius: '3px', marginRight: '8px' }}>
              {previewData.isCustomHtml ? `CUSTOM HTML V${previewData.version}` : `REACT EMAIL V${previewData.version}`}
            </span>
            <strong style={{ color: '#ffffff' }}>{previewData.subject}</strong>
          </div>
          <div style={{ color: '#a1a1aa', fontSize: '11px' }}>
            Sender: <span style={{ color: '#ffffff' }}>{previewData.sender}</span>
          </div>
        </div>
      )}

      {/* RENDER FRAME CONTAINER */}
      <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#000000', padding: '32px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', minHeight: '550px' }}>
        {loading ? (
          <div style={{ color: '#a1a1aa', padding: '40px', fontSize: '13px' }}>Loading active template version from database...</div>
        ) : previewData ? (
          <div
            style={{
              width: previewDevice === 'mobile' ? '375px' : '650px',
              backgroundColor: themeMode === 'dark' ? '#09090b' : '#ffffff',
              color: themeMode === 'dark' ? '#ffffff' : '#000000',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              transition: 'width 0.3s ease',
              padding: '24px',
            }}
          >
            {showHtmlSource ? (
              <pre style={{ fontSize: '11px', color: '#22c55e', overflowX: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>
                {previewData.html}
              </pre>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
            )}
          </div>
        ) : null}
      </div>

      {/* REAL TEST EMAIL DISPATCH FOOTER */}
      <div style={{ marginTop: '24px', backgroundColor: '#121215', padding: '20px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#c8a46a', marginBottom: '8px' }}>REAL TEST EMAIL DISPATCH (RESEND API & GOADDY INBOX VERIFICATION)</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="email"
            value={testEmailRecipient}
            onChange={(e) => setTestEmailRecipient(e.target.value)}
            style={{ flex: 1, backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px 14px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
          />
          <button
            onClick={handleSendTest}
            style={{ backgroundColor: '#c8a46a', color: '#000000', border: 'none', padding: '10px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
          >
            🚀 Send Real Test Email
          </button>
        </div>

        {testStatus && (
          <div style={{ marginTop: '14px', padding: '12px', borderRadius: '4px', backgroundColor: testStatus.includes('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: testStatus.includes('✅') ? '1px solid #22c55e' : '1px solid #ef4444', fontSize: '12px' }}>
            <div style={{ fontWeight: 800, color: testStatus.includes('✅') ? '#22c55e' : '#ef4444' }}>{testStatus}</div>
            {providerMsgId && <div style={{ fontSize: '11px', color: '#c8a46a', marginTop: '4px', fontFamily: 'monospace' }}>RESEND PROVIDER MESSAGE ID: {providerMsgId}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
