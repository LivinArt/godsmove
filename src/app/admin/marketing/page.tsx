import React from 'react';
import Link from 'next/link';
import { getMarketingDashboardStats } from '@/actions/marketing.actions';

export default async function MarketingDashboardPage() {
  const { kpis, chartData } = await getMarketingDashboardStats();

  const cards = [
    { title: 'Total Campaigns', value: kpis.totalCampaigns, change: '+12% this month', color: '#ffffff' },
    { title: 'Notifications Dispatched', value: kpis.totalNotifications, change: '+18.4% engagement', color: '#c8a46a' },
    { title: 'Delivery Success Rate', value: `${kpis.deliveryRate}%`, change: 'Optimal SLA', color: '#22c55e' },
    { title: 'Unique Open Rate', value: `${kpis.openRate}%`, change: 'Above benchmark (35%)', color: '#60a5fa' },
    { title: 'Click-Through Rate (CTR)', value: `${kpis.ctr}%`, change: 'High intent clicks', color: '#a78bfa' },
    { title: 'Active Subscribers', value: kpis.totalSubscribers, change: '100% Opted-in', color: '#f472b6' },
  ];

  return (
    <div>
      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {cards.map((card, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#121215',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '20px',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#8c857b', textTransform: 'uppercase' }}>
              {card.title}
            </span>
            <div style={{ fontSize: '26px', fontWeight: 800, color: card.color, margin: '6px 0' }}>
              {card.value}
            </div>
            <span style={{ fontSize: '11px', color: '#a1a1aa' }}>{card.change}</span>
          </div>
        ))}
      </div>

      {/* Main Grid: Performance Trends + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Engagement Trend Chart Simulation */}
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.05em', color: '#ffffff', margin: 0 }}>
              WEEKLY DISPATCH & OPEN TRENDS
            </h3>
            <span style={{ fontSize: '11px', color: '#c8a46a', fontWeight: 700 }}>Real-time Audit Sync</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', paddingTop: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {chartData.map((bar, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '32px',
                    height: `${(bar.sent / 700) * 100}%`,
                    backgroundColor: 'rgba(200, 164, 106, 0.4)',
                    borderTop: '2px solid #c8a46a',
                    borderRadius: '2px 2px 0 0',
                  }}
                />
                <span style={{ fontSize: '10px', color: '#8c857b', marginTop: '8px', fontWeight: 700 }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Hub */}
        <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.05em', color: '#ffffff', margin: '0 0 16px 0' }}>
            CAMPAIGN QUICK ACTIONS
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/admin/marketing/campaigns/new"
              style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: 'rgba(200, 164, 106, 0.1)',
                border: '1px solid #c8a46a',
                borderRadius: '4px',
                color: '#c8a46a',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              + Create Campaign Broadcast
            </Link>
            <Link
              href="/admin/marketing/templates/preview"
              style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              👁 Preview 32 Email Templates
            </Link>
            <Link
              href="/admin/marketing/segments"
              style={{
                display: 'block',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              🎯 Build Customer Segment Filter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
