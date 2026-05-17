import { getDiscounts } from '@/actions/discount.actions';
import Link from 'next/link';
import { DiscountsTable } from './components/DiscountsTable';

export const metadata = {
  title: 'Discounts · GODSMOVE Admin',
};

export default async function DiscountsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; active?: string }>;
}) {
  const { q, status, active } = await searchParams;

  const discounts = await getDiscounts({
    search: q,
    status: status,
    isActive: active === 'true' ? true : active === 'false' ? false : undefined,
  });

  const activeCount = discounts.filter((d) => d.isActive).length;
  const liveCount = discounts.filter((d) => d.status === 'ACTIVE').length;
  const scheduledCount = discounts.filter((d) => d.status === 'SCHEDULED').length;

  const filterLink = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.status) sp.set('status', params.status);
    if (params.active) sp.set('active', params.active);
    const s = sp.toString();
    return `/admin/discounts${s ? `?${s}` : ''}`;
  };

  const statusTabs = [
    { label: 'All',       value: undefined },
    { label: 'Active',    value: 'ACTIVE' },
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Expired',   value: 'EXPIRED' },
    { label: 'Draft',     value: 'DRAFT' },
    { label: 'Archived',  value: 'ARCHIVED' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Discounts</h1>
          <p className="page-sub">
            {discounts.length} total · {liveCount} currently live · {scheduledCount} scheduled
          </p>
        </div>
        <Link href="/admin/discounts/new" className="btn-primary">
          + New Discount
        </Link>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-label">Live Now</div>
          <div className="stat-value">{liveCount}</div>
          <div className="stat-sub">Active campaigns</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scheduled</div>
          <div className="stat-value">{scheduledCount}</div>
          <div className="stat-sub">Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Enabled</div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-sub">isActive flag set</div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <form method="GET" style={{ position: 'relative' }}>
          {status && <input type="hidden" name="status" value={status} />}
          {active && <input type="hidden" name="active" value={active} />}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search by code or name..."
            className="admin-input"
            style={{ paddingLeft: 36 }}
          />
        </form>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', marginRight: 4 }}>
            Status:
          </span>
          {statusTabs.map((tab) => {
            const isActiveTab = status === tab.value || (!status && !tab.value);
            return (
              <Link
                key={tab.label}
                href={filterLink({ q, status: tab.value, active })}
                style={{
                  padding: '4px 14px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: isActiveTab ? 'var(--admin-accent)' : 'var(--admin-border-2)',
                  background: isActiveTab ? 'var(--admin-accent-dim)' : 'transparent',
                  color: isActiveTab ? 'var(--admin-accent)' : 'var(--admin-muted)',
                  textDecoration: 'none',
                  transition: 'all 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </Link>
            );
          })}

          <Link
            href={filterLink({ q, status, active: active === 'true' ? undefined : 'true' })}
            style={{
              padding: '4px 14px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid',
              borderColor: active === 'true' ? 'var(--admin-accent)' : 'var(--admin-border-2)',
              background: active === 'true' ? 'var(--admin-accent-dim)' : 'transparent',
              color: active === 'true' ? 'var(--admin-accent)' : 'var(--admin-muted)',
              textDecoration: 'none',
              transition: 'all 0.12s',
              whiteSpace: 'nowrap',
              marginLeft: 'auto'
            }}
          >
            ⚡ Enabled only
          </Link>
        </div>
      </div>

      <DiscountsTable discounts={discounts.map(d => ({
        ...d,
        value: d.value.toString() // Serialize Decimal to string
      }))} />
    </div>
  );
}
