import React from 'react';
import { getCampaigns } from '@/actions/marketing.actions';

export default async function MarketingArchivePage() {
  const archived = await getCampaigns('ARCHIVED');

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>CAMPAIGN ARCHIVE</h2>
        <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Archived broadcasts and historical campaign records</span>
      </div>

      <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
        <table width="100%" cellPadding="12" cellSpacing="0" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#8c857b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th>Campaign Name</th>
              <th>Subject</th>
              <th>Template</th>
              <th>Status</th>
              <th>Archived Date</th>
            </tr>
          </thead>
          <tbody>
            {archived.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#a1a1aa', padding: '32px' }}>
                  No archived campaigns found.
                </td>
              </tr>
            ) : (
              archived.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#ffffff' }}>
                  <td style={{ fontWeight: 700 }}>{a.name}</td>
                  <td style={{ color: '#a1a1aa' }}>{a.subject}</td>
                  <td style={{ color: '#c8a46a', fontSize: '11px', fontFamily: 'monospace' }}>{a.templateId}</td>
                  <td>
                    <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 800, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#a1a1aa' }}>
                      ARCHIVED
                    </span>
                  </td>
                  <td style={{ color: '#a1a1aa' }}>{new Date(a.updatedAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
