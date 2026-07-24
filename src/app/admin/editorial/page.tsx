import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const TYPE_CLASS: Record<string, string> = {
  EDITORIAL: 'badge badge-blue', MOODBOARD: 'badge badge-green',
  OBSERVATION: 'badge badge-yellow', ARTIFACT: 'badge badge-grey', CAMPAIGN: 'badge badge-blue',
};

export default async function EditorialAdminPage() {
  const [posts, contentKeys] = await Promise.all([
    prisma.archivePost.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.homepageContent.findMany({ orderBy: { key: 'asc' } }),
  ]);

  const published = posts.filter(p => p.status === 'PUBLISHED');
  const drafts = posts.filter(p => p.status === 'DRAFT');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Editorial / CMS</h1>
          <p className="page-sub">{published.length} published · {drafts.length} draft</p>
        </div>
        <Link href="/admin/editorial/new" className="btn-primary">+ New Post</Link>
      </div>

      {/* Homepage CMS keys */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.01em' }}>Homepage Content</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Key</th><th>Value</th><th>Last Updated</th><th></th></tr></thead>
            <tbody>
              {contentKeys.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-muted)' }}>No content keys. They&apos;ll appear here once set from the storefront data.</td></tr>
              )}
              {contentKeys.map(k => (
                <tr key={k.id}>
                  <td><span className="mono" style={{ color: 'var(--admin-accent)' }}>{k.key}</span></td>
                  <td style={{ fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.value}</td>
                  <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(k.updatedAt)}</td>
                  <td><Link href={`/admin/editorial/content/${k.key}`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archive posts */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Archive Posts</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Published</th><th></th></tr></thead>
            <tbody>
              {posts.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>No archive posts yet.</td></tr>
              )}
              {posts.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-muted)', fontFamily: 'var(--admin-mono)' }}>{p.slug}</div>
                  </td>
                  <td><span className={TYPE_CLASS[p.type] ?? 'badge badge-grey'} style={{ fontSize: 10 }}>{p.type}</span></td>
                  <td>
                    <span className={p.status === 'PUBLISHED' ? 'badge badge-green' : p.status === 'DRAFT' ? 'badge badge-grey' : 'badge badge-yellow'}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                    {p.publishedAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(p.publishedAt) : '—'}
                  </td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/admin/editorial/${p.id}/edit`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>Edit</Link>
                    {p.status === 'PUBLISHED' && (
                      <Link href={`/archive/${p.slug}`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} target="_blank">View ↗</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
