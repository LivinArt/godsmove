'use client';

import React, { useState } from 'react';

export default function TemplatePreviewerPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('ORDER_CREATED');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  const templatesList = [
    { id: 'ORDER_CREATED', name: 'Order Confirmation' },
    { id: 'ORDER_SHIPPED', name: 'Order Shipped' },
    { id: 'ORDER_DELIVERED', name: 'Order Delivered' },
    { id: 'ORDER_CANCELLED', name: 'Order Cancelled' },
    { id: 'RETURN_REQUESTED', name: 'Return Requested' },
    { id: 'RETURN_APPROVED', name: 'Return Approved' },
    { id: 'RETURN_REJECTED', name: 'Return Rejected' },
    { id: 'RETURN_COMPLETED', name: 'Return Settlement Completed' },
    { id: 'WALLET_CREDITED', name: 'Wallet Balance Credited' },
    { id: 'WALLET_DEBITED', name: 'Wallet Balance Applied' },
    { id: 'PASSWORD_RESET', name: 'Password Reset' },
    { id: 'WELCOME', name: 'Welcome Collector' },
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

  return (
    <div>
      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121215', padding: '16px 24px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, color: '#8c857b', letterSpacing: '0.1em' }}>SELECT TEMPLATE:</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{ backgroundColor: '#09090b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
          >
            {templatesList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id})
              </option>
            ))}
          </select>
        </div>

        {/* Viewport & Theme Toggles */}
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
        </div>
      </div>

      {/* Frame Container */}
      <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#000000', padding: '32px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', minHeight: '600px' }}>
        <div
          style={{
            width: previewDevice === 'mobile' ? '375px' : '640px',
            backgroundColor: themeMode === 'dark' ? '#09090b' : '#ffffff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            transition: 'width 0.3s ease',
            padding: '24px',
          }}
        >
          {/* Sample Rendered Payload Display */}
          <div style={{ borderBottom: '1px solid rgba(200, 164, 106, 0.3)', paddingBottom: '12px', marginBottom: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', color: '#c8a46a' }}>GODSMOVE ARCHIVAL EMAIL PREVIEW</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: themeMode === 'dark' ? '#ffffff' : '#000000', marginTop: '4px' }}>
              Template: {selectedTemplate}
            </div>
            <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>
              From: GODSMOVE &lt;support@godsmove.in&gt;
            </div>
          </div>

          <div style={{ color: themeMode === 'dark' ? '#d4d4d8' : '#18181b', fontSize: '13px', lineHeight: '22px' }}>
            <p><strong>Recipient:</strong> Valued Collector (support@godsmove.in)</p>
            <p><strong>Sample Subject:</strong> Allocation Dispatch Notice — GODSMOVE</p>
            <div style={{ margin: '24px 0', padding: '20px', backgroundColor: themeMode === 'dark' ? '#121215' : '#f4f4f5', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#c8a46a', marginBottom: '8px' }}>STATEMENT PIECE ALLOCATION CONFIRMED</div>
              <p style={{ margin: 0, fontSize: '12px' }}>
                Your order allocation piece has been logged with our archival logistics unit. Precision craftsmanship and technical quality audit complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
