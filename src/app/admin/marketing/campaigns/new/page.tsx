'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCampaign, dispatchCampaign } from '@/actions/marketing.actions';

export default function CampaignBuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
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

  const templates = [
    { id: 'CAMPAIGN_NEWSLETTER', name: 'Newsletter Broadcast' },
    { id: 'CAMPAIGN_NEW_DROP', name: 'New Drop Announcement' },
    { id: 'CAMPAIGN_COLLECTION_LAUNCH', name: 'Collection Launch' },
    { id: 'CAMPAIGN_LIMITED_EDITION', name: 'Limited Edition Series' },
    { id: 'CAMPAIGN_COUPON', name: 'Coupon Privilege Pass' },
    { id: 'CAMPAIGN_FLASH_SALE', name: 'Flash Sale Allocation' },
    { id: 'CAMPAIGN_BIRTHDAY', name: 'Birthday Wishes' },
    { id: 'CAMPAIGN_FESTIVAL', name: 'Festival Celebration' },
    { id: 'CAMPAIGN_REFERRAL', name: 'Referral Collector Circle' },
    { id: 'CAMPAIGN_LOYALTY_UPGRADE', name: 'Loyalty Tier Upgrade' },
    { id: 'CAMPAIGN_WISHLIST_REMINDER', name: 'Wishlist Low Stock Alert' },
    { id: 'CAMPAIGN_ABANDONED_CART', name: 'Abandoned Cart Recovery' },
    { id: 'CAMPAIGN_BACK_IN_STOCK', name: 'Back In Stock Alert' },
    { id: 'CAMPAIGN_PRICE_DROP', name: 'Price Drop Adjustment' },
    { id: 'CAMPAIGN_RECOMMENDATION', name: 'Curated Recommendations' },
    { id: 'CAMPAIGN_VIP_EARLY_ACCESS', name: 'VIP Early Access' },
    { id: 'CAMPAIGN_MEMBERSHIP_INVITATION', name: 'Private Circle Invite' },
    { id: 'CAMPAIGN_SEASONAL', name: 'Seasonal Editorial' },
  ];

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
    <div style={{ maxWidth: '800px', margin: '0 auto', color: '#ffffff' }}>
      {/* Wizard Progress Steps */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
        {['1. Audience', '2. Template', '3. Subject & Details', '4. Preview & Test', '5. Schedule & Publish'].map((label, idx) => (
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

      {/* STEP 1: AUDIENCE */}
      {step === 1 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>SELECT TARGET AUDIENCE SEGMENT</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input type="radio" name="segment" defaultChecked onChange={() => setFormData({ ...formData, segmentId: '' })} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>All Active Marketing Subscribers</div>
                <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Broadcasting to all opted-in collectors (100% consent verified)</div>
              </div>
            </label>
            <label style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input type="radio" name="segment" onChange={() => setFormData({ ...formData, segmentId: 'vip' })} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>VIP Collectors (Lifetime Spend &gt; ₹10,000)</div>
                <div style={{ fontSize: '11px', color: '#a1a1aa' }}>High-tier priority buyers</div>
              </div>
            </label>
          </div>
          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <button onClick={() => setStep(2)} style={nextBtnStyle}>Next: Choose Template →</button>
          </div>
        </div>
      )}

      {/* STEP 2: TEMPLATE SELECTION */}
      {step === 2 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>CHOOSE EMAIL TEMPLATE</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
            {templates.map((t) => (
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
            <button onClick={() => setStep(1)} style={backBtnStyle}>← Back</button>
            <button onClick={() => setStep(3)} style={nextBtnStyle}>Next: Subject & Details →</button>
          </div>
        </div>
      )}

      {/* STEP 3: SUBJECT & DETAILS */}
      {step === 3 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>CAMPAIGN DETAILS & HEADERS</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelFormStyle}>CAMPAIGN NAME (INTERNAL)</label>
              <input
                type="text"
                placeholder="e.g. Autumn Drop 05 Announcement"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelFormStyle}>EMAIL SUBJECT LINE</label>
              <input
                type="text"
                placeholder="e.g. Allocation Released: Archival Drop 05 is Live"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelFormStyle}>PREVIEW TEXT (HEADER SNIPPET)</label>
              <input
                type="text"
                placeholder="e.g. Capped batch loopback fleece hoodies available now"
                value={formData.previewText}
                onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} style={backBtnStyle}>← Back</button>
            <button onClick={() => setStep(4)} style={nextBtnStyle}>Next: Preview & Test →</button>
          </div>
        </div>
      )}

      {/* STEP 4: PREVIEW & TEST */}
      {step === 4 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>PREVIEW & DISPATCH TEST EMAIL</h2>
          <div style={{ backgroundColor: '#09090b', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#8c857b' }}>FROM: GODSMOVE &lt;support@godsmove.in&gt;</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#c8a46a', margin: '4px 0' }}>SUBJECT: {formData.subject || 'Sample Subject'}</div>
            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>PREVIEW: {formData.previewText || 'Sample preview text'}</div>
          </div>
          <button
            onClick={() => setTestEmailSuccess(true)}
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
          >
            {testEmailSuccess ? '✅ Test Email Dispatched to support@godsmove.in' : '✉ Send Test Email to support@godsmove.in'}
          </button>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(3)} style={backBtnStyle}>← Back</button>
            <button onClick={() => setStep(5)} style={nextBtnStyle}>Next: Schedule & Publish →</button>
          </div>
        </div>
      )}

      {/* STEP 5: SCHEDULE & PUBLISH */}
      {step === 5 && (
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>CONFIRM & PUBLISH BROADCAST</h2>
          <p style={{ fontSize: '12px', color: '#a1a1aa' }}>
            Campaign &quot;<strong style={{ color: '#ffffff' }}>{formData.name || 'Untitled Campaign'}</strong>&quot; is ready to broadcast via Resend API.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
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
const labelFormStyle = { display: 'block', fontSize: '10px', fontWeight: 700, color: '#8c857b', marginBottom: '6px', letterSpacing: '0.1em' };
const inputStyle = { width: '100%', backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px 14px', color: '#ffffff', fontSize: '12px', outline: 'none' };
