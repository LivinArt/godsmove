import React from 'react';
import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { label: 'Transactional Templates', href: '/admin/marketing/templates' },
    { label: 'Template Previewer', href: '/admin/marketing/templates/preview' },
    { label: 'Audit & Debug Panel', href: '/admin/marketing/analytics' },
    { label: 'Customers Directory', href: '/admin/marketing/customers' },
    { label: 'Customer Segments', href: '/admin/marketing/segments' },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#09090b', minHeight: '100vh', color: '#ffffff' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '0.05em' }}>
              GODSMOVE TRANSACTIONAL NOTIFICATIONS & CRM
            </h1>
            <p style={{ fontSize: '12px', color: '#8c857b', margin: '4px 0 0 0' }}>
              Mission Critical Infrastructure • Active DB Template Engine • Resend Delivery • Audit History
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#a1a1aa',
                textDecoration: 'none',
                padding: '8px 14px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
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
