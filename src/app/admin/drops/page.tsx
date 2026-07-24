import { getDrops } from '@/actions/drop.actions';
import Link from 'next/link';
import { DropsTable } from './components/DropsTable';

export const metadata = {
  title: 'Drops · GODSMOVE Admin',
};

export default async function DropsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; featured?: string }>;
}) {
  const { q, status, featured } = await searchParams;

  const drops = await getDrops({
    search: q,
    status: status,
    isFeatured: featured === 'true' ? true : undefined,
  });

  // Stats
  const live      = drops.filter((d) => d.status === 'LIVE').length;
  const scheduled = drops.filter((d) => d.status === 'SCHEDULED').length;
  const draft     = drops.filter((d) => d.status === 'DRAFT').length;
  const featured_ = drops.filter((d) => d.isFeatured).length;

  const filterLink = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.status) sp.set('status', params.status);
    if (params.featured) sp.set('featured', params.featured);
    const s = sp.toString();
    return `/admin/drops${s ? `?${s}` : ''}`;
  };

  const statusTabs = [
    { label: 'All',       value: undefined },
    { label: 'Live',      value: 'LIVE' },
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Draft',     value: 'DRAFT' },
    { label: 'Ended',     value: 'ENDED' },
    { label: 'Archived',  value: 'ARCHIVED' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Drops</h1>
          <p className="page-sub">
            {drops.length} total · {live} live · {scheduled} scheduled · {draft} draft
          </p>
        </div>
        <Link href="/admin/drops/new" className="btn-primary">
          + New Drop
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-label">Live Now</div>
          <div className="stat-value">{live}</div>
          <div className="stat-sub">Active drops</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scheduled</div>
          <div className="stat-value">{scheduled}</div>
          <div className="stat-sub">Upcoming releases</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Draft</div>
          <div className="stat-value">{draft}</div>
          <div className="stat-sub">In preparation</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Featured</div>
          <div className="stat-value">{featured_}</div>
          <div className="stat-sub">On homepage</div>
        </div>
      </div>

      {/* Search + filters */}
      <div
        className="admin-card"
        style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {/* Search bar */}
        <form method="GET" style={{ position: 'relative' }}>
          {status && <input type="hidden" name="status" value={status} />}
          {featured && <input type="hidden" name="featured" value={featured} />}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              position: 'absolute',
              left: 13,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--admin-muted)',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search drops by name, slug, or tagline…"
            className="admin-input"
            style={{ paddingLeft: 36 }}
          />
        </form>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--admin-muted)',
              marginRight: 4,
            }}
          >
            Status:
          </span>
          {statusTabs.map((tab) => {
            const isActive = status === tab.value || (!status && !tab.value);
            return (
              <Link
                key={tab.label}
                href={filterLink({ q, status: tab.value, featured })}
                style={{
                  padding: '4px 14px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: isActive ? 'var(--admin-accent)' : 'var(--admin-border-2)',
                  background: isActive ? 'var(--admin-accent-dim)' : 'transparent',
                  color: isActive ? 'var(--admin-accent)' : 'var(--admin-muted)',
                  textDecoration: 'none',
                  transition: 'all 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </Link>
            );
          })}

          {/* Featured filter */}
          <Link
            href={filterLink({ q, status, featured: featured === 'true' ? undefined : 'true' })}
            style={{
              padding: '4px 14px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid',
              borderColor: featured === 'true' ? 'var(--admin-accent)' : 'var(--admin-border-2)',
              background: featured === 'true' ? 'var(--admin-accent-dim)' : 'transparent',
              color: featured === 'true' ? 'var(--admin-accent)' : 'var(--admin-muted)',
              textDecoration: 'none',
              transition: 'all 0.12s',
              whiteSpace: 'nowrap',
            }}
          >
            ⭐ Featured only
          </Link>
        </div>
      </div>

      {/* Table */}
      <DropsTable drops={drops} />
    </div>
  );
}
