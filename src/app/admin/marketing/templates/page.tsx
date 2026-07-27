'use client';

import React, { useState, useEffect } from 'react';
import { uploadHtmlTemplate, getTemplateVersionHistory, rollbackTemplateVersion, sendTestEmail } from '@/actions/marketing.actions';

export default function TransactionalTemplatesPage() {
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<any>(null);
  const [selectedTemplateForUpload, setSelectedTemplateForUpload] = useState<any>(null);
  const [selectedTemplateForHistory, setSelectedTemplateForHistory] = useState<any>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);

  // HTML Upload Wizard state
  const [uploadStep, setUploadStep] = useState(1);
  const [uploadedHtml, setUploadedHtml] = useState<string>('');
  const [uploadName, setUploadName] = useState<string>('');
  const [uploadSubject, setUploadSubject] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Test Email state
  const [testEmailRecipient, setTestEmailRecipient] = useState('support@godsmove.in');
  const [testStatus, setTestStatus] = useState<string>('');

  // Preview Mode state
  const [previewTab, setPreviewTab] = useState<'DESKTOP' | 'MOBILE' | 'DARK' | 'HTML_SOURCE'>('DESKTOP');

  const templates = [
    { id: 'FIRST_TIME_REGISTRATION', name: 'Welcome to GODSMOVE (First Registration)', category: 'TRANSACTIONAL', desc: 'Personal luxury letter triggered ONCE upon first-time account creation (Google OAuth or Email)' },
    { id: 'WELCOME', name: 'Welcome Collector Circle', category: 'TRANSACTIONAL', desc: 'Archival member privilege notice' },
    { id: 'ORDER_CREATED', name: 'Order Confirmation / Allocation', category: 'TRANSACTIONAL', desc: 'Sent after successful order placement & DB commit (Reference Implementation)' },
    { id: 'ORDER_CONFIRMED', name: 'Order Confirmed Notice', category: 'TRANSACTIONAL', desc: 'Sent upon payment verification' },
    { id: 'ORDER_SHIPPED', name: 'Order Shipped / Dispatched', category: 'TRANSACTIONAL', desc: 'Sent when carrier AWB & tracking number are attached' },
    { id: 'ORDER_DELIVERED', name: 'Order Delivered', category: 'TRANSACTIONAL', desc: 'Sent upon successful delivery confirmation' },
    { id: 'ORDER_CANCELLED', name: 'Order Cancelled Notice', category: 'TRANSACTIONAL', desc: 'Sent when order is cancelled' },
    { id: 'PAYMENT_SUCCESSFUL', name: 'Payment Successful Receipt', category: 'TRANSACTIONAL', desc: 'Payment receipt confirmation' },
    { id: 'PAYMENT_FAILED', name: 'Payment Failed Notice', category: 'TRANSACTIONAL', desc: 'Payment attempt exception warning' },
    { id: 'RETURN_REQUESTED', name: 'Return Requested', category: 'TRANSACTIONAL', desc: 'Sent when customer logs return request' },
    { id: 'RETURN_APPROVED', name: 'Return Approved', category: 'TRANSACTIONAL', desc: 'Sent when return QC approves request' },
    { id: 'RETURN_REJECTED', name: 'Return Rejected', category: 'TRANSACTIONAL', desc: 'Sent when return request is rejected' },
    { id: 'REFUND_COMPLETED', name: 'Refund Settlement Completed', category: 'TRANSACTIONAL', desc: 'Sent when wallet refund is issued' },
    { id: 'WALLET_CREDITED', name: 'Wallet Balance Credited', category: 'TRANSACTIONAL', desc: 'Sent when vault credits are added' },
    { id: 'WALLET_DEBITED', name: 'Wallet Balance Applied', category: 'TRANSACTIONAL', desc: 'Sent when vault credits are redeemed' },
    { id: 'PASSWORD_RESET', name: 'Password Reset Instructions', category: 'TRANSACTIONAL', desc: 'Sent for security authentication token' },
    { id: 'EMAIL_VERIFICATION', name: 'Email Verification Notice', category: 'TRANSACTIONAL', desc: 'Email address verification link' },
    { id: 'ACCOUNT_UPDATED', name: 'Account Profile Updated', category: 'TRANSACTIONAL', desc: 'Security credential modification notice' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.html') && file.type !== 'text/html') {
      setUploadError('Invalid format. Only .html template files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadedHtml(content);
      setUploadName(`${selectedTemplateForUpload.name} (Custom Upload)`);
      setUploadSubject(`Notification: ${selectedTemplateForUpload.name}`);
      setUploadStep(2);
    };
    reader.readAsText(file);
  };

  const handleReplaceTemplate = async () => {
    if (!selectedTemplateForUpload || !uploadedHtml) return;
    setLoading(true);
    try {
      await uploadHtmlTemplate({
        templateId: selectedTemplateForUpload.id,
        name: uploadName,
        subject: uploadSubject,
        htmlContent: uploadedHtml,
        category: selectedTemplateForUpload.category,
      });
      alert(`✅ Template "${selectedTemplateForUpload.name}" updated with new active HTML version in database.`);
      setSelectedTemplateForUpload(null);
      setUploadStep(1);
      setUploadedHtml('');
    } catch (err: any) {
      alert(err.message || 'Failed to upload template');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async (templateId: string) => {
    setTestStatus('Sending via Resend API...');
    try {
      const res = await sendTestEmail({
        templateId,
        recipientEmail: testEmailRecipient,
      });
      if (res.success) {
        setTestStatus(`✅ Delivered via Resend (ID: ${res.providerMessageId})`);
      } else {
        setTestStatus(`❌ Dispatch failed: ${res.error}`);
      }
    } catch (err: any) {
      setTestStatus(`❌ Dispatch failed: ${err.message}`);
    }
  };

  const loadVersionHistory = async (templateId: string) => {
    try {
      const history = await getTemplateVersionHistory(templateId);
      setVersionHistory(history);
    } catch {
      setVersionHistory([]);
    }
  };

  useEffect(() => {
    if (selectedTemplateForHistory) {
      loadVersionHistory(selectedTemplateForHistory.id);
    }
  }, [selectedTemplateForHistory]);

  return (
    <div>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>TRANSACTIONAL EMAIL TEMPLATE LIBRARY</h2>
          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Single Active DB Template Constraint • Warm Ivory Editorial Aesthetic • Real Resend Dispatch</span>
        </div>
      </div>

      {/* Templates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {templates.map((t) => (
          <div
            key={t.id}
            style={{
              backgroundColor: '#121215',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(200, 164, 106, 0.15)',
                    color: '#c8a46a',
                    border: '1px solid #c8a46a',
                  }}
                >
                  TRANSACTIONAL
                </span>
                <button
                  onClick={() => setSelectedTemplateForHistory(t)}
                  style={{ fontSize: '10px', color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  History / Versions
                </button>
              </div>

              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>{t.name}</h3>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8c857b', marginBottom: '8px' }}>Event Key: {t.id}</div>
              <p style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: '16px', margin: '0 0 16px 0' }}>{t.desc}</p>
            </div>

            {/* TWO ACTIONS PER TEMPLATE CARD */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
              <button
                onClick={() => {
                  setSelectedTemplateForPreview(t);
                  setTestStatus('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#c8a46a',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                1. Preview & Test
              </button>

              <button
                onClick={() => {
                  setSelectedTemplateForUpload(t);
                  setUploadStep(1);
                  setUploadedHtml('');
                  setUploadError('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#c8a46a',
                  border: 'none',
                  color: '#000000',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                2. New Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: PREVIEW & TEST TEMPLATE DRAWER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedTemplateForPreview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', color: '#c8a46a' }}>
                  TRANSACTIONAL • {selectedTemplateForPreview.id}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>{selectedTemplateForPreview.name}</h2>
              </div>
              <button onClick={() => setSelectedTemplateForPreview(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Preview Modes */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['DESKTOP', 'MOBILE', 'DARK', 'HTML_SOURCE'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPreviewTab(m)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: previewTab === m ? '#c8a46a' : 'transparent',
                    color: previewTab === m ? '#000' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Preview Render Container */}
            <div style={{ backgroundColor: '#000000', padding: '20px', borderRadius: '6px', minHeight: '300px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: previewTab === 'MOBILE' ? '375px' : '100%', backgroundColor: previewTab === 'DARK' ? '#09090b' : '#FBF9F5', color: previewTab === 'DARK' ? '#ffffff' : '#1A1918', padding: '24px', borderRadius: '6px', fontSize: '12px' }}>
                {previewTab === 'HTML_SOURCE' ? (
                  <pre style={{ color: '#22c55e', fontSize: '11px', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {`<!-- GODSMOVE Luxury Editorial Template -->\n<div class="godsmove-archival-email">\n  <h2>${selectedTemplateForPreview.name}</h2>\n  <p>Warm Ivory & Deep Charcoal Editorial Styling for ${selectedTemplateForPreview.id}</p>\n</div>`}
                  </pre>
                ) : (
                  <div>
                    <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid #EAE5DB', marginBottom: '16px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.25em', color: '#1A1918' }}>G O D S M O V E</div>
                      <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', color: '#C8A46A', marginTop: '4px' }}>ISSUE // ARCHIVAL DISPATCH</div>
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A1918', margin: '0 0 12px 0' }}>{selectedTemplateForPreview.name}</h3>
                    <div style={{ backgroundColor: '#F4F0E8', borderLeft: '3px solid #C8A46A', padding: '16px', borderRadius: '4px', marginBottom: '16px' }}>
                      <p style={{ margin: 0, fontSize: '12px', lineHeight: '20px', color: '#4A4742' }}>
                        Dear Valued Collector, welcome to the GODSMOVE Archival Circle. Every piece represents craftsmanship, permanence, and intentional design.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Test Email Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#c8a46a', marginBottom: '8px' }}>DISPATCH TEST EMAIL (RESEND API & GODADDY INBOX)</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  style={{ flex: 1, backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}
                />
                <button
                  onClick={() => handleSendTest(selectedTemplateForPreview.id)}
                  style={{ backgroundColor: '#c8a46a', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Send Test Email
                </button>
              </div>
              {testStatus && <div style={{ fontSize: '11px', color: testStatus.includes('✅') ? '#22c55e' : '#ef4444', marginTop: '8px' }}>{testStatus}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: 3-STEP HTML UPLOAD WIZARD */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedTemplateForUpload && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', width: '100%', maxWidth: '650px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', color: '#c8a46a' }}>3-STEP UPLOAD WIZARD • STEP {uploadStep} OF 3</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>Upload Custom HTML for {selectedTemplateForUpload.name}</h2>
              </div>
              <button onClick={() => setSelectedTemplateForUpload(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {uploadStep === 1 && (
              <div>
                <p style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '16px' }}>
                  Select a valid <strong style={{ color: '#ffffff' }}>.html</strong> template file from your computer. Non-HTML files will be strictly rejected.
                </p>
                <input type="file" accept=".html" onChange={handleFileUpload} style={{ backgroundColor: '#09090b', color: '#ffffff', border: '1px dashed rgba(255,255,255,0.2)', padding: '20px', borderRadius: '6px', width: '100%', cursor: 'pointer' }} />
                {uploadError && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '12px' }}>{uploadError}</div>}
              </div>
            )}

            {uploadStep === 2 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>RENDER PREVIEW OF UPLOADED HTML</h3>
                <div style={{ backgroundColor: '#FBF9F5', color: '#1A1918', padding: '16px', borderRadius: '4px', maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                  <div dangerouslySetInnerHTML={{ __html: uploadedHtml }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <input type="text" placeholder="Template Name" value={uploadName} onChange={(e) => setUploadName(e.target.value)} style={{ flex: 1, backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px' }} />
                  <input type="text" placeholder="Email Subject" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} style={{ flex: 1, backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px' }} />
                </div>
                <button onClick={() => setUploadStep(3)} style={{ backgroundColor: '#c8a46a', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Proceed to Activation →</button>
              </div>
            )}

            {uploadStep === 3 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444', marginBottom: '8px' }}>REPLACE ACTIVE TEMPLATE VERSION</h3>
                <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '20px' }}>
                  Clicking <strong style={{ color: '#ffffff' }}>Replace Existing Template</strong> will archive the current active version, increment the version number, and immediately activate this uploaded HTML template for all future <strong style={{ color: '#c8a46a' }}>{selectedTemplateForUpload.id}</strong> dispatches.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={() => setSelectedTemplateForUpload(null)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleReplaceTemplate} disabled={loading} style={{ flex: 1, backgroundColor: '#c8a46a', color: '#000000', border: 'none', padding: '10px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                    {loading ? 'Activating...' : 'Replace Existing Template'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 3: VERSION HISTORY & ROLLBACK DRAWER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedTemplateForHistory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', width: '100%', maxWidth: '650px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.15em', color: '#c8a46a' }}>VERSION HISTORY & ROLLBACK</span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>{selectedTemplateForHistory.name}</h2>
              </div>
              <button onClick={() => setSelectedTemplateForHistory(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {versionHistory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#a1a1aa', padding: '24px', fontSize: '12px' }}>
                  No custom HTML upload history found. Currently running compiled React Email V1.
                </div>
              ) : (
                versionHistory.map((ver) => (
                  <div key={ver.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#09090b', padding: '12px 16px', borderRadius: '4px', marginBottom: '8px', border: ver.isActive ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>Version {ver.version}</span>
                        {ver.isActive && <span style={{ fontSize: '9px', fontWeight: 800, color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: '3px', border: '1px solid #22c55e' }}>CURRENT ACTIVE</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>Uploaded by {ver.createdBy} on {new Date(ver.createdAt).toLocaleString('en-IN')}</div>
                    </div>

                    {!ver.isActive && (
                      <button
                        onClick={async () => {
                          await rollbackTemplateVersion(ver.id);
                          loadVersionHistory(selectedTemplateForHistory.id);
                        }}
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#c8a46a', border: '1px solid #c8a46a', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Rollback / Activate
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
