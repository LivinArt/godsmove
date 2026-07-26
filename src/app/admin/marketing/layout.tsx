import Link from 'next/link';
import React from 'react';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { label: 'Dashboard', href: '/admin/marketing' },
    { label: 'Campaigns', href: '/admin/marketing/campaigns' },
    { label: 'Templates Library', href: '/admin/marketing/templates' },
    { label: 'Template Preview', href: '/admin/marketing/templates/preview' },
    { label: 'Customer Segments', href: '/admin/marketing/segments' },
    { label: 'Customer CRM', href: '/admin/marketing/customers' },
    { label: 'Analytics', href: '/admin/marketing/analytics' },
    { label: 'Drafts', href: '/admin/marketing/drafts' },
    { label: 'Archive', href: '/admin/marketing/archive' },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#ffffff', minHeight: '100vh', backgroundColor: '#09090b' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', color: '#c8a46a', textTransform: 'uppercase' }}>
            GODSMOVE ENTERPRISE CRM
          </span>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: '4px 0 0 0' }}>
            Marketing & Customer Engagement Platform
          </h1>
        </div>
        <Link
          href="/admin/marketing/campaigns/new"
          style={{
            backgroundColor: '#c8a46a',
            color: '#000000',
            padding: '10px 20px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          + CREATE CAMPAIGN
        </Link>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '12px',
          marginBottom: '28px',
        }}
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              color: '#a1a1aa',
              fontSize: '12px',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '4px',
              textDecoration: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
