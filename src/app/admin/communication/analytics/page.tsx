import React from 'react';
import { getCommunicationDashboardStats, getEmailLedger } from '@/actions/communication.actions';

export const dynamic = 'force-dynamic';

export default async function CommunicationAnalyticsPage() {
  const stats = await getCommunicationDashboardStats();
  const ledgerData = await getEmailLedger(1, 100);

  // Calculate event breakdown
  const eventCounts: Record<string, number> = {};
  ledgerData.records.forEach((r) => {
    eventCounts[r.eventType] = (eventCounts[r.eventType] || 0) + 1;
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
          COMMUNICATION SYSTEM ANALYTICS
        </h2>
        <p style={{ fontSize: '12px', color: '#8c857b', margin: '4px 0 0 0' }}>
          Real-time metrics on deliverability, dispatch frequency, and event breakdown
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <span style={labelStyle}>TOTAL DISPATCH VOLUME</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>{stats.totalNotifications}</div>
          <span style={subtextStyle}>Dispatched Email Notifications</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>DELIVERY SUCCESS RATE</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e', margin: '4px 0' }}>{stats.deliveryRate}%</div>
          <span style={subtextStyle}>Resend API Verified</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>SYSTEM TEMPLATES</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#c8a46a', margin: '4px 0' }}>20</div>
          <span style={subtextStyle}>Fixed System Templates</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>ACTIVE SUBSCRIBERS</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#60a5fa', margin: '4px 0' }}>{stats.totalSubscribers}</div>
          <span style={subtextStyle}>Opted-in Customer Reach</span>
        </div>
      </div>

      {/* Breakdown by Event Type */}
      <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', margin: '0 0 16px 0' }}>
          DISPATCH VOLUME BY EVENT TYPE
        </h3>

        {Object.keys(eventCounts).length === 0 ? (
          <div style={{ color: '#71717a', fontSize: '12px' }}>No dispatches logged in NotificationHistory yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {Object.entries(eventCounts).map(([evt, count]) => (
              <div key={evt} style={{ backgroundColor: '#18181b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{evt}</span>
                  <div style={{ fontSize: '11px', color: '#8c857b', marginTop: '2px' }}>System Event Trigger</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#c8a46a' }}>{count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' };
const labelStyle = { fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: '#8c857b', textTransform: 'uppercase' as const };
const subtextStyle = { fontSize: '11px', color: '#a1a1aa' };
