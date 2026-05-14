import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function DropsAdminPage() {
  const drops = await prisma.drop.findMany({
    include: { products: { select: { id: true, name: true, status: true } } },
    orderBy: { releaseAt: 'desc' },
  });

  const STATUS_CLASS: Record<string, string> = {
    DRAFT: 'badge badge-grey', SCHEDULED: 'badge badge-yellow',
    LIVE: 'badge badge-green', ENDED: 'badge badge-grey', ARCHIVED: 'badge badge-grey',
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Drops</h1>
          <p className="page-sub">{drops.filter(d => d.status === 'LIVE').length} live</p>
        </div>
        <Link href="/admin/drops/new" className="btn-primary">+ New Drop</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {drops.length === 0 && (
          <div className="admin-card" style={{ textAlign: 'center', padding: 48, color: 'var(--admin-muted)' }}>
            No drops yet. <Link href="/admin/drops/new" style={{ color: 'var(--admin-accent)' }}>Create Drop 001 →</Link>
          </div>
        )}
        {drops.map((drop) => (
          <div key={drop.id} className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{drop.name}</span>
                <span className={STATUS_CLASS[drop.status]}>{drop.status}</span>
                {drop.isPasswordProtected && <span className="badge badge-grey" style={{ fontSize: 10 }}>🔒 GATED</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--admin-muted)', marginBottom: 8 }}>{drop.tagline}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--admin-muted)' }}>
                {drop.releaseAt && <span>Release: {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(drop.releaseAt)}</span>}
                {drop.season && <span>Season: {drop.season}</span>}
                <span>{drop.products.length} product{drop.products.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <Link href={`/admin/drops/${drop.id}/edit`} className="btn-secondary" style={{ padding: '7px 14px', fontSize: 12, flexShrink: 0 }}>Edit</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
