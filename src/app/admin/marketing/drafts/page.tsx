import React from 'react';
import Link from 'next/link';
import { getCampaigns } from '@/actions/marketing.actions';

export default async function MarketingDraftsPage() {
  const drafts = await getCampaigns('DRAFT');

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>CAMPAIGN DRAFTS</h2>
        <span style={{ fontSize: '12px', color: '#a1a1aa' }}>In-progress campaign drafts ready for review & broadcast</span>
      </div>

      <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
        <table width="100%" cellPadding="12" cellSpacing="0" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#8c857b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th>Draft Name</th>
              <th>Subject</th>
              <th>Template</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drafts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#a1a1aa', padding: '32px' }}>
                  No draft campaigns currently stored.
                </td>
              </tr>
            ) : (
              drafts.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#ffffff' }}>
                  <td style={{ fontWeight: 700 }}>{d.name}</td>
                  <td style={{ color: '#a1a1aa' }}>{d.subject}</td>
                  <td style={{ color: '#c8a46a', fontSize: '11px', fontFamily: 'monospace' }}>{d.templateId}</td>
                  <td style={{ color: '#a1a1aa' }}>{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <Link href={`/admin/marketing/campaigns/new?id=${d.id}`} style={{ color: '#c8a46a', textDecoration: 'none', fontSize: '11px', fontWeight: 700 }}>
                      Edit Draft →
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
