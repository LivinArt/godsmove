import React from 'react';
import Link from 'next/link';
import { getMarketingDashboardStats } from '@/actions/marketing.actions';

export const dynamic = 'force-dynamic';

export default async function MarketingDashboardPage() {
  const { kpis } = await getMarketingDashboardStats();

  return (
    <div>
      {/* Transactional Overview KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <span style={labelStyle}>TOTAL DISPATCHED TRANSACTIONAL EMAILS</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>{kpis.totalNotifications}</div>
          <span style={subtextStyle}>Logged in NotificationHistory</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>SUCCESSFUL DELIVERY RATE</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e', margin: '4px 0' }}>{kpis.deliveryRate}%</div>
          <span style={subtextStyle}>Resend API Verified Delivery</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>ACTIVE SUBSCRIBERS</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#c8a46a', margin: '4px 0' }}>{kpis.totalSubscribers}</div>
          <span style={subtextStyle}>Registered Customer Directory</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>CUSTOM SEGMENTS</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#60a5fa', margin: '4px 0' }}>{kpis.totalSegments}</div>
          <span style={subtextStyle}>Rule-based Customer Groups</span>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0' }}>TRANSACTIONAL TEMPLATES</h3>
          <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 20px 0' }}>
            Manage active database HTML versions for Order Confirmation, Welcome Email, Password Reset, Return Notifications, and Vault Credits.
          </p>
          <Link href="/admin/marketing/templates" style={linkBtnStyle}>Manage Templates →</Link>
        </div>

        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0' }}>AUDIT & DEBUG PANEL</h3>
          <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 20px 0' }}>
            Inspect Resend Provider Message IDs, timestamp dispatches, error logs, and perform 1-click notification retries.
          </p>
          <Link href="/admin/marketing/analytics" style={linkBtnStyle}>Open Debug Panel →</Link>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' };
const labelStyle = { fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: '#8c857b', textTransform: 'uppercase' as const };
const subtextStyle = { fontSize: '11px', color: '#a1a1aa' };
const linkBtnStyle = { display: 'inline-block', backgroundColor: 'rgba(200,164,106,0.1)', color: '#c8a46a', border: '1px solid #c8a46a', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, textDecoration: 'none' };
