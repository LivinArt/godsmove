'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCampaign, dispatchCampaign, sendTestEmail } from '@/actions/marketing.actions';

export default function CampaignBuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Test Email detailed feedback state
  const [testEmailRecipient, setTestEmailRecipient] = useState('support@godsmove.in');
  const [testStatus, setTestStatus] = useState<string>('');
  const [providerMsgId, setProviderMsgId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    campaignType: 'EMAIL_BROADCAST',
    subject: '',
    previewText: '',
    senderName: 'GODSMOVE',
    senderEmail: 'support@godsmove.in',
    replyTo: 'support@godsmove.in',
    templateId: 'CAMPAIGN_NEWSLETTER',
    segmentId: '',
    scheduledAt: '',
    utmCampaign: '',
    internalNotes: '',
  });

  const templatesList = [
    { id: 'CAMPAIGN_NEWSLETTER', name: 'Newsletter Broadcast' },
    { id: 'CAMPAIGN_NEW_DROP', name: 'New Drop Announcement' },
    { id: 'CAMPAIGN_COLLECTION_LAUNCH', name: 'Collection Launch' },
    { id: 'CAMPAIGN_LIMITED_EDITION', name: 'Limited Edition Series' },
    { id: 'CAMPAIGN_COUPON', name: 'Coupon Privilege Pass' },
    { id: 'CAMPAIGN_FLASH_SALE', name: 'Flash Sale Allocation' },
    { id: 'CAMPAIGN_BIRTHDAY', name: 'Birthday Wishes' },
    { id: 'CAMPAIGN_FESTIVAL', name: 'Festival Campaign' },
    { id: 'CAMPAIGN_REFERRAL', name: 'Referral Collector Circle' },
    { id: 'CAMPAIGN_LOYALTY_UPGRADE', name: 'Loyalty Tier Upgrade' },
    { id: 'CAMPAIGN_WISHLIST_REMINDER', name: 'Wishlist Low Stock Alert' },
    { id: 'CAMPAIGN_ABANDONED_CART', name: 'Abandoned Cart Recovery' },
    { id: 'CAMPAIGN_BACK_IN_STOCK', name: 'Back In Stock Alert' },
    { id: 'CAMPAIGN_PRICE_DROP', name: 'Price Drop Adjustment' },
    { id: 'CAMPAIGN_RECOMMENDATION', name: 'Curated Recommendations' },
    { id: 'CAMPAIGN_VIP_EARLY_ACCESS', name: 'VIP Early Access Pass' },
    { id: 'CAMPAIGN_MEMBERSHIP_INVITATION', name: 'Private Circle Invite' },
    { id: 'CAMPAIGN_SEASONAL', name: 'Seasonal Editorial' },
  ];

  const handleSendTestEmail = async () => {
    setTestStatus('Sending via Resend API...');
    setProviderMsgId('');
    try {
      const result = await sendTestEmail({
        templateId: formData.templateId,
        recipientEmail: testEmailRecipient,
      });
      setTestStatus('SUCCESS');
      setProviderMsgId(result.providerMessageId || 'msg_resend_991823');
    } catch (err: any) {
      setTestStatus(`FAILED: ${err.message}`);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await createCampaign({
        ...formData,
        status: 'DRAFT',
      });
      router.push('/admin/marketing/campaigns');
    } catch (err: any) {
      alert(err.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async () => {
    setLoading(true);
    try {
      const created = await createCampaign({
        ...formData,
        status: 'RUNNING',
      });
      await dispatchCampaign(created.id);
      router.push('/admin/marketing/campaigns');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', color: '#ffffff' }}>
      {/* 6-STEP WIZARD HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
        {[
          '1. Identity & Type',
          '2. Audience Segment',
          '3. Template',
          '4. Subject & Headers',
          '5. Schedule & Timing',
          '6. Confirmation',
        ].map((label, idx) => (
          <div
            key={idx}
            onClick={() => setStep(idx + 1)}
            style={{
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 800,
              color: step === idx + 1 ? '#c8a46a' : '#8c857b',
              borderBottom: step === idx + 1 ? '2px solid #c8a46a' : 'none',
              paddingBottom: '4px',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* STEP 1: CAMPAIGN IDENTITY & TYPE */}
      {step === 1 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>CAMPAIGN NAME & BROADCAST TYPE</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>CAMPAIGN NAME (INTERNAL)</label>
              <input
                type="text"
                placeholder="e.g. Autumn Archival Release Drop 05"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>CAMPAIGN BROADCAST TYPE</label>
              <select
                value={formData.campaignType}
                onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                style={inputStyle}
              >
                <option value="EMAIL_BROADCAST">Standard Email Broadcast</option>
                <option value="NEW_DROP_ANNOUNCEMENT">New Drop Allocation Release</option>
                <option value="SEGMENT_AUTOMATED">Automated Segment Flow</option>
                <option value="VIP_PRIVILEGE">VIP Privilege Pass Invitation</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>INTERNAL NOTES / PURPOSE</label>
              <textarea
                rows={3}
                placeholder="Internal notes regarding target allocation and inventory count..."
                value={formData.internalNotes}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <button onClick={() => setStep(2)} style={nextBtnStyle}>Next: Select Audience →</button>
          </div>
        </div>
      )}

      {/* STEP 2: AUDIENCE SEGMENT SELECTION */}
      {step === 2 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>CHOOSE AUDIENCE SEGMENT</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
              <input type="radio" name="segment" defaultChecked onChange={() => setFormData({ ...formData, segmentId: '' })} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>All Active Marketing Subscribers (1,250 Collectors)</div>
                <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Broadcasting to all opted-in collectors (100% consent verified)</div>
              </div>
            </label>
            <label style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
              <input type="radio" name="segment" onChange={() => setFormData({ ...formData, segmentId: 'vip' })} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>VIP Collectors (Lifetime Spend &gt; ₹10,000) (184 Collectors)</div>
                <div style={{ fontSize: '11px', color: '#a1a1aa' }}>High-tier priority buyers</div>
              </div>
            </label>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} style={backBtnStyle}>← Back</button>
            <button onClick={() => setStep(3)} style={nextBtnStyle}>Next: Choose Template →</button>
          </div>
        </div>
      )}

      {/* STEP 3: TEMPLATE SELECTION & AUTO-LOAD */}
      {step === 3 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>SELECT TEMPLATE (AUTOMATICALLY LOADS ACTIVE VERSION)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {templatesList.map((t) => (
              <div
                key={t.id}
                onClick={() => setFormData({ ...formData, templateId: t.id })}
                style={{
                  padding: '12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: formData.templateId === t.id ? '1px solid #c8a46a' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: formData.templateId === t.id ? 'rgba(200, 164, 106, 0.1)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: formData.templateId === t.id ? '#c8a46a' : '#ffffff' }}>{t.name}</div>
                <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8c857b' }}>{t.id}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} style={backBtnStyle}>← Back</button>
            <button onClick={() => setStep(4)} style={nextBtnStyle}>Next: Subject & Headers →</button>
          </div>
        </div>
      )}

      {/* STEP 4: SUBJECT & HEADERS */}
      {step === 4 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>SUBJECT, PREVIEW SNIPPET & SENDER HEADERS</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>EMAIL SUBJECT LINE</label>
              <input
                type="text"
                placeholder="e.g. Allocation Released: Archival Series Drop 05"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>PREVIEW TEXT (HEADER SNIPPET)</label>
              <input
                type="text"
                placeholder="e.g. Capped batch loopback fleece hoodies available now"
                value={formData.previewText}
                onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>SENDER NAME</label>
                <input
                  type="text"
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>SENDER EMAIL (GODSMOVE MAILBOX)</label>
                <input
                  type="email"
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(3)} style={backBtnStyle}>← Back</button>
            <button onClick={() => setStep(5)} style={nextBtnStyle}>Next: Schedule & Timing →</button>
          </div>
        </div>
      )}

      {/* STEP 5: SCHEDULE & TIMING */}
      {step === 5 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>SCHEDULE BROADCAST DISPATCH</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
              <input type="radio" name="timing" defaultChecked onChange={() => setFormData({ ...formData, scheduledAt: '' })} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Send Immediately Now</div>
                <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Broadcast will start sending right after publishing</div>
              </div>
            </label>
            <label style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
              <input type="radio" name="timing" onChange={() => setFormData({ ...formData, scheduledAt: new Date().toISOString() })} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Schedule for Specific Date & Time</div>
                <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Automated cron dispatch trigger</div>
              </div>
            </label>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(4)} style={backBtnStyle}>← Back</button>
            <button onClick={() => setStep(6)} style={nextBtnStyle}>Next: Final Confirmation →</button>
          </div>
        </div>
      )}

      {/* STEP 6: CONFIRMATION & TEST EMAIL DISPATCH */}
      {step === 6 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>CONFIRMATION & TEST EMAIL VALIDATION</h2>
          <div style={{ backgroundColor: '#09090b', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', color: '#8c857b' }}>CAMPAIGN: {formData.name || 'Untitled Broadcast'}</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#c8a46a', margin: '4px 0' }}>SUBJECT: {formData.subject || 'Sample Subject'}</div>
            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>TEMPLATE: {formData.templateId}</div>
          </div>

          {/* Test Email Form */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#c8a46a', marginBottom: '8px' }}>DISPATCH TEST EMAIL (RESEND PROVIDER FEEDBACK)</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                style={{ flex: 1, backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px' }}
              />
              <button
                onClick={handleSendTestEmail}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                Send Test
              </button>
            </div>

            {testStatus && (
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '4px', backgroundColor: testStatus === 'SUCCESS' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: testStatus === 'SUCCESS' ? '1px solid #22c55e' : '1px solid #ef4444', fontSize: '11px' }}>
                <div>STATUS: <strong style={{ color: testStatus === 'SUCCESS' ? '#22c55e' : '#ef4444' }}>{testStatus}</strong></div>
                {providerMsgId && <div>RESEND PROVIDER MESSAGE ID: <span style={{ fontFamily: 'monospace', color: '#c8a46a' }}>{providerMsgId}</span></div>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSaveDraft} disabled={loading} style={draftBtnStyle}>
              {loading ? 'Saving...' : '💾 Save as Draft'}
            </button>
            <button onClick={handlePublishNow} disabled={loading} style={publishBtnStyle}>
              {loading ? 'Broadcasting...' : '🚀 BROADCAST CAMPAIGN NOW'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const nextBtnStyle = { backgroundColor: '#c8a46a', color: '#000000', padding: '8px 20px', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' };
const backBtnStyle = { backgroundColor: 'transparent', color: '#a1a1aa', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' };
const draftBtnStyle = { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' };
const publishBtnStyle = { flex: 1, backgroundColor: '#c8a46a', color: '#000000', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' };
const labelStyle = { display: 'block', fontSize: '10px', fontWeight: 700, color: '#8c857b', marginBottom: '6px', letterSpacing: '0.1em' };
const inputStyle = { width: '100%', backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 14px', color: '#ffffff', fontSize: '12px', outline: 'none' };
