import React from 'react';
import Link from 'next/link';

export default function CommunicationLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { label: 'Dashboard', href: '/admin/communication' },
    { label: 'Customer Segments', href: '/admin/communication/segments' },
    { label: 'Transactional Emails', href: '/admin/communication/templates' },
    { label: 'Email Ledger', href: '/admin/communication/ledger' },
    { label: 'Communication Analytics', href: '/admin/communication/analytics' },
  ];

  return (
    <div style={{ padding: '28px', backgroundColor: '#09090b', minHeight: '100vh', color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '0.05em' }}>
                GODSMOVE COMMUNICATION PLATFORM V2
              </h1>
              <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: 'rgba(200, 164, 106, 0.15)', color: '#c8a46a', border: '1px solid rgba(200, 164, 106, 0.4)', padding: '2px 8px', borderRadius: '12px', letterSpacing: '0.1em' }}>
                ENTERPRISE
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#8c857b', margin: '6px 0 0 0', letterSpacing: '0.02em' }}>
              Single Source of Truth • Event-Driven System Templates • Resend Delivery Engine • Audit Ledger
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#e4e4e7',
                textDecoration: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}
