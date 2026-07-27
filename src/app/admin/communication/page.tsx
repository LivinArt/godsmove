import React from 'react';
import Link from 'next/link';
import { getCommunicationDashboardStats } from '@/actions/communication.actions';

export const dynamic = 'force-dynamic';

export default async function CommunicationDashboardPage() {
  const stats = await getCommunicationDashboardStats();

  return (
    <div>
      {/* Overview KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <span style={labelStyle}>SYSTEM TEMPLATES</span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>{stats.totalSystemTemplates}</div>
          <span style={subtextStyle}>20 Event-Driven System Templates</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>SUCCESSFUL DELIVERY RATE</span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#22c55e', margin: '4px 0' }}>{stats.deliveryRate}%</div>
          <span style={subtextStyle}>Resend API Verified Delivery</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>TOTAL DISPATCHED LEDGER LOGS</span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#c8a46a', margin: '4px 0' }}>{stats.totalNotifications}</div>
          <span style={subtextStyle}>NotificationHistory Database Records</span>
        </div>

        <div style={cardStyle}>
          <span style={labelStyle}>CUSTOMER SEGMENTS</span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#60a5fa', margin: '4px 0' }}>{stats.totalSegments}</div>
          <span style={subtextStyle}>Dynamic Rule-Based Groups</span>
        </div>
      </div>

      {/* Primary Command Centre Launchpads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div style={launchpadStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>TRANSACTIONAL SYSTEM EMAILS</h3>
              <span style={{ fontSize: '11px', color: '#c8a46a', fontWeight: 700 }}>20 FIXED SYSTEM TEMPLATES</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 20px 0' }}>
            Manage active system templates (Welcome, Order Confirmation, Payment Confirmed, Shipped, Delivered, Wallet Credit/Debit, Returns, Invoice Request). Includes brand-controlled inbox preview, 1-click test email dispatching, and version rollback.
          </p>
          <Link href="/admin/communication/templates" style={linkBtnStyle}>Open System Templates →</Link>
        </div>

        <div style={launchpadStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>CUSTOMER SEGMENTATION</h3>
              <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 700 }}>UNLIMITED DYNAMIC FILTERS</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 20px 0' }}>
            Build dynamic customer groups with unlimited AND/OR conditions across City, State, Orders, Wallet Balance, Revenue, Inactivity, and Custom Attributes. Save, edit, duplicate, and preview live reach.
          </p>
          <Link href="/admin/communication/segments" style={linkBtnStyle}>Open Segment Builder →</Link>
        </div>

        <div style={launchpadStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>EMAIL LEDGER & AUDIT TRAIL</h3>
              <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 700 }}>LIVE PROVIDER DISPATCH LOGS</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 20px 0' }}>
            Audit every dispatched email with exact Resend Provider Message IDs, timestamps, status (`SENT`/`FAILED`), idempotency keys, and attachment logs with 1-click manual retry.
          </p>
          <Link href="/admin/communication/ledger" style={linkBtnStyle}>View Delivery Ledger →</Link>
        </div>

        <div style={launchpadStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>COMMUNICATION ANALYTICS</h3>
              <span style={{ fontSize: '11px', color: '#a855f7', fontWeight: 700 }}>SYSTEM HEALTH & METRICS</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '20px', margin: '0 0 20px 0' }}>
            Monitor delivery success rates, event breakdown, provider latency, error distribution, and transactional email volume trends across all customer touchpoints.
          </p>
          <Link href="/admin/communication/analytics" style={linkBtnStyle}>View Analytics →</Link>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '20px' };
const labelStyle = { fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', color: '#8c857b', textTransform: 'uppercase' as const };
const subtextStyle = { fontSize: '11px', color: '#a1a1aa' };
const launchpadStyle = { backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', padding: '24px' };
const linkBtnStyle = { display: 'inline-block', backgroundColor: 'rgba(200,164,106,0.1)', color: '#c8a46a', border: '1px solid #c8a46a', padding: '10px 18px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, textDecoration: 'none' };
