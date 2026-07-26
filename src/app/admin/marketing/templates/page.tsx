import React from 'react';
import Link from 'next/link';

export default function TemplatesLibraryPage() {
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>TEMPLATE REGISTRY LIBRARY</h2>
          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>30+ Production Email Templates Registered & Fully Independent</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
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
                    backgroundColor: t.category === 'TRANSACTIONAL' ? 'rgba(200, 164, 106, 0.15)' : 'rgba(96, 165, 250, 0.15)',
                    color: t.category === 'TRANSACTIONAL' ? '#c8a46a' : '#60a5fa',
                    border: '1px solid currentColor',
                  }}
                >
                  {t.category}
                </span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8c857b' }}>{t.id}</span>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>{t.name}</h3>
              <p style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: '16px', margin: '0 0 16px 0' }}>{t.desc}</p>
            </div>

            <Link
              href={`/admin/marketing/templates/preview?template=${t.id}`}
              style={{
                display: 'inline-block',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#c8a46a',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              PREVIEW & TEST TEMPLATE →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
