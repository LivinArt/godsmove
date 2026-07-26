'use client';

import React, { useState, useEffect } from 'react';
import { uploadHtmlTemplate, getTemplateVersionHistory, rollbackTemplateVersion, sendTestEmail } from '@/actions/marketing.actions';

export default function TemplatesLibraryPage() {
  const [activeTab, setActiveTab] = useState<'ALL' | 'TRANSACTIONAL' | 'MARKETING'>('ALL');
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
    // Transactional Templates
    { id: 'ORDER_CREATED', name: 'Order Confirmation', category: 'TRANSACTIONAL', desc: 'Sent after successful order placement & DB commit' },
    { id: 'ORDER_SHIPPED', name: 'Order Shipped / Dispatched', category: 'TRANSACTIONAL', desc: 'Sent when carrier AWB & tracking number are attached' },
    { id: 'ORDER_DELIVERED', name: 'Order Delivered', category: 'TRANSACTIONAL', desc: 'Sent upon successful delivery confirmation' },
    { id: 'ORDER_CANCELLED', name: 'Order Cancelled', category: 'TRANSACTIONAL', desc: 'Sent when order is cancelled' },
    { id: 'RETURN_REQUESTED', name: 'Return Requested', category: 'TRANSACTIONAL', desc: 'Sent when customer logs return request' },
    { id: 'RETURN_APPROVED', name: 'Return Approved', category: 'TRANSACTIONAL', desc: 'Sent when return QC approves request' },
    { id: 'RETURN_REJECTED', name: 'Return Rejected', category: 'TRANSACTIONAL', desc: 'Sent when return request is rejected' },
    { id: 'RETURN_COMPLETED', name: 'Return Settlement Completed', category: 'TRANSACTIONAL', desc: 'Sent when wallet refund is issued' },
    { id: 'WALLET_CREDITED', name: 'Wallet Balance Credited', category: 'TRANSACTIONAL', desc: 'Sent when vault credits are added' },
    { id: 'WALLET_DEBITED', name: 'Wallet Balance Applied', category: 'TRANSACTIONAL', desc: 'Sent when vault credits are redeemed' },
    { id: 'PASSWORD_RESET', name: 'Password Reset', category: 'TRANSACTIONAL', desc: 'Sent for authentication reset token' },
    { id: 'WELCOME', name: 'Welcome Collector', category: 'TRANSACTIONAL', desc: 'Sent on customer signup' },

    // Marketing Templates
    { id: 'CAMPAIGN_NEWSLETTER', name: 'Newsletter Broadcast', category: 'MARKETING', desc: 'Monthly design insights & brand manifesto' },
    { id: 'CAMPAIGN_NEW_DROP', name: 'New Drop Announcement', category: 'MARKETING', desc: 'Capped allocation release notification' },
    { id: 'CAMPAIGN_COLLECTION_LAUNCH', name: 'Collection Launch', category: 'MARKETING', desc: 'Seasonal collection release' },
    { id: 'CAMPAIGN_LIMITED_EDITION', name: 'Limited Edition Series', category: 'MARKETING', desc: 'Strictly numbered physical piece drop' },
    { id: 'CAMPAIGN_COUPON', name: 'Coupon Privilege Pass', category: 'MARKETING', desc: 'Promo code & privilege pass broadcast' },
    { id: 'CAMPAIGN_FLASH_SALE', name: 'Flash Sale Allocation', category: 'MARKETING', desc: 'Timed 24-hour flash sale' },
    { id: 'CAMPAIGN_BIRTHDAY', name: 'Birthday Wishes', category: 'MARKETING', desc: 'Annual birthday gift store credit' },
    { id: 'CAMPAIGN_FESTIVAL', name: 'Festival Campaign', category: 'MARKETING', desc: 'Seasonal celebration promo' },
    { id: 'CAMPAIGN_REFERRAL', name: 'Referral Collector Circle', category: 'MARKETING', desc: 'Invite friends & earn vault credits' },
    { id: 'CAMPAIGN_LOYALTY_UPGRADE', name: 'Loyalty Tier Upgrade', category: 'MARKETING', desc: 'Status elevation & tier privileges' },
    { id: 'CAMPAIGN_WISHLIST_REMINDER', name: 'Wishlist Low Stock Alert', category: 'MARKETING', desc: 'Saved piece inventory warning' },
    { id: 'CAMPAIGN_ABANDONED_CART', name: 'Abandoned Cart Recovery', category: 'MARKETING', desc: 'Reserved cart recovery reminder' },
    { id: 'CAMPAIGN_BACK_IN_STOCK', name: 'Back In Stock Alert', category: 'MARKETING', desc: 'Restock notification for saved items' },
    { id: 'CAMPAIGN_PRICE_DROP', name: 'Price Drop Adjustment', category: 'MARKETING', desc: 'Watched item price reduction' },
    { id: 'CAMPAIGN_RECOMMENDATION', name: 'Curated Recommendations', category: 'MARKETING', desc: 'AI curated product pairing' },
    { id: 'CAMPAIGN_VIP_EARLY_ACCESS', name: 'VIP Early Access Pass', category: 'MARKETING', desc: 'Advance drop access for VIPs' },
    { id: 'CAMPAIGN_MEMBERSHIP_INVITATION', name: 'Private Circle Invite', category: 'MARKETING', desc: 'Exclusive membership invitation' },
    { id: 'CAMPAIGN_SEASONAL', name: 'Seasonal Editorial', category: 'MARKETING', desc: 'High-concept seasonal fashion editorial' },
  ];

  const filteredTemplates = templates.filter((t) => {
    if (activeTab === 'TRANSACTIONAL') return t.category === 'TRANSACTIONAL';
    if (activeTab === 'MARKETING') return t.category === 'MARKETING';
    return true;
  });

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
      alert(`✅ Template "${selectedTemplateForUpload.name}" updated with new HTML version.`);
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
    setTestStatus('Sending...');
    try {
      const res = await sendTestEmail({
        templateId,
        recipientEmail: testEmailRecipient,
      });
      setTestStatus(`✅ Delivered via Resend (ID: ${res.providerMessageId})`);
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
      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>TEMPLATE REGISTRY & LIFECYCLE MANAGEMENT</h2>
          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Single Active Constraint per Event • Dynamic HTML Upload • Rollback History</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'TRANSACTIONAL', 'MARKETING'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: activeTab === tab ? '#c8a46a' : 'rgba(255, 255, 255, 0.03)',
                color: activeTab === tab ? '#000000' : '#a1a1aa',
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filteredTemplates.map((t) => (
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
                    backgroundColor: t.category === 'TRANSACTIONAL' ? 'rgba(200, 164, 106, 0.15)' : 'rgba(96, 165, 250, 0.15)',
                    color: t.category === 'TRANSACTIONAL' ? '#c8a46a' : '#60a5fa',
                    border: '1px solid currentColor',
                  }}
                >
                  {t.category}
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

            {/* ONLY TWO ACTIONS PER TEMPLATE CARD */}
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
                  {selectedTemplateForPreview.category} • {selectedTemplateForPreview.id}
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

            {/* Preview Frame */}
            <div style={{ backgroundColor: '#000000', padding: '20px', borderRadius: '6px', minHeight: '300px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: previewTab === 'MOBILE' ? '375px' : '100%', backgroundColor: previewTab === 'DARK' ? '#09090b' : '#ffffff', color: previewTab === 'DARK' ? '#ffffff' : '#000000', padding: '20px', borderRadius: '4px', fontSize: '12px' }}>
                {previewTab === 'HTML_SOURCE' ? (
                  <pre style={{ color: '#22c55e', fontSize: '11px', overflowX: 'auto' }}>
                    {`<!-- Default GODSMOVE Compiled Template -->\n<div class="luxury-email-layout">\n  <h1>${selectedTemplateForPreview.name}</h1>\n  <p>Default compiled React Email component for event ${selectedTemplateForPreview.id}</p>\n</div>`}
                  </pre>
                ) : (
                  <div>
                    <h3 style={{ color: '#c8a46a', margin: '0 0 8px 0' }}>{selectedTemplateForPreview.name}</h3>
                    <p style={{ margin: 0, lineHeight: '18px' }}>
                      Sample notification layout preview for <strong>{selectedTemplateForPreview.id}</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Email Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#c8a46a', marginBottom: '8px' }}>DISPATCH TEST EMAIL (RESEND API)</div>
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
              {testStatus && <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '8px' }}>{testStatus}</div>}
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

            {/* STEP 1: UPLOAD FILE */}
            {uploadStep === 1 && (
              <div>
                <p style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '16px' }}>
                  Select a valid <strong style={{ color: '#ffffff' }}>.html</strong> template file from your computer. Non-HTML files will be strictly rejected.
                </p>
                <input type="file" accept=".html" onChange={handleFileUpload} style={{ backgroundColor: '#09090b', color: '#ffffff', border: '1px dashed rgba(255,255,255,0.2)', padding: '20px', borderRadius: '6px', width: '100%', cursor: 'pointer' }} />
                {uploadError && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '12px' }}>{uploadError}</div>}
              </div>
            )}

            {/* STEP 2: PREVIEW RENDER */}
            {uploadStep === 2 && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>RENDER PREVIEW OF UPLOADED HTML</h3>
                <div style={{ backgroundColor: '#000000', padding: '16px', borderRadius: '4px', maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                  <div dangerouslySetInnerHTML={{ __html: uploadedHtml }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <input type="text" placeholder="Template Name" value={uploadName} onChange={(e) => setUploadName(e.target.value)} style={{ flex: 1, backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px' }} />
                  <input type="text" placeholder="Email Subject" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} style={{ flex: 1, backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px' }} />
                </div>
                <button onClick={() => setUploadStep(3)} style={{ backgroundColor: '#c8a46a', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>Proceed to Activation →</button>
              </div>
            )}

            {/* STEP 3: REPLACE CONFIRMATION */}
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
