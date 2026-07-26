import React from 'react';
import Link from 'next/link';
import { getCampaigns } from '@/actions/marketing.actions';

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status || 'ALL';
  const campaigns = await getCampaigns(statusFilter);

  const statuses = ['ALL', 'DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];

  return (
    <div>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/marketing/campaigns?status=${s}`}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '4px',
              textDecoration: 'none',
              backgroundColor: statusFilter === s ? '#c8a46a' : 'rgba(255, 255, 255, 0.03)',
              color: statusFilter === s ? '#000000' : '#a1a1aa',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Campaigns Table */}
      <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
        <table width="100%" cellPadding="12" cellSpacing="0" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#8c857b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th>Campaign Name</th>
              <th>Subject</th>
              <th>Template</th>
              <th>Target Segment</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#a1a1aa', padding: '32px' }}>
                  No campaigns found for status: {statusFilter}.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#ffffff' }}>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td style={{ color: '#a1a1aa' }}>{c.subject}</td>
                  <td style={{ color: '#c8a46a', fontSize: '11px', fontFamily: 'monospace' }}>{c.templateId}</td>
                  <td>{c.segment?.name || 'All Marketing Subscribers'}</td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 800,
                        backgroundColor:
                          c.status === 'COMPLETED' ? 'rgba(34, 197, 94, 0.15)' :
                          c.status === 'RUNNING' ? 'rgba(96, 165, 250, 0.15)' :
                          c.status === 'DRAFT' ? 'rgba(244, 114, 182, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                        color:
                          c.status === 'COMPLETED' ? '#22c55e' :
                          c.status === 'RUNNING' ? '#60a5fa' :
                          c.status === 'DRAFT' ? '#f472b6' : '#a1a1aa',
                        border: '1px solid currentColor',
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ color: '#a1a1aa' }}>{c.sentCount}</td>
                  <td>
                    <Link
                      href={`/admin/marketing/templates/preview?template=${c.templateId}`}
                      style={{ color: '#c8a46a', textDecoration: 'none', fontSize: '11px', fontWeight: 700 }}
                    >
                      Preview →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
