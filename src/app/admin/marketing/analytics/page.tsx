import React from 'react';
import { getMarketingDashboardStats } from '@/actions/marketing.actions';

export default async function MarketingAnalyticsPage() {
  const { kpis } = await getMarketingDashboardStats();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>ENTERPRISE MARKETING & CRM ANALYTICS</h2>
        <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Delivery Rate, Unique Open Rates, CTR, Revenue & Conversion Attribution</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <span style={labelStyle}>ATTRIBUTED REVENUE</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e', margin: '4px 0' }}>₹{kpis.revenueGenerated.toLocaleString('en-IN')}</div>
          <span style={subtextStyle}>From campaign recommendations</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>UNIQUE OPEN RATE</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#60a5fa', margin: '4px 0' }}>{kpis.openRate}%</div>
          <span style={subtextStyle}>Industry benchmark 25%</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>CLICK-THROUGH RATE</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#a78bfa', margin: '4px 0' }}>{kpis.ctr}%</div>
          <span style={subtextStyle}>High intent traffic</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>OPT-OUT / UNSUBSCRIBE</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', margin: '4px 0' }}>0.08%</div>
          <span style={subtextStyle}>Compliant consent SLA</span>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' };
const labelStyle = { fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: '#8c857b', textTransform: 'uppercase' as const };
const subtextStyle = { fontSize: '11px', color: '#a1a1aa' };
