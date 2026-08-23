import { getAdminDashboardData } from '@/actions/admin-operations.actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge badge-yellow',
  CONFIRMED: 'badge badge-blue',
  PACKED: 'badge badge-blue',
  READY_FOR_PICKUP: 'badge badge-blue',
  PICKED_UP: 'badge badge-blue',
  PROCESSING: 'badge badge-blue',
  IN_TRANSIT: 'badge badge-green',
  SHIPPED: 'badge badge-green',
  DELIVERED: 'badge badge-green',
  COMPLETED: 'badge badge-green',
  CANCELLED: 'badge badge-red',
  RETURNED: 'badge badge-yellow',
  REFUNDED: 'badge badge-red',
};

import { getSiteMode } from '@/actions/site-config.actions';
import StorefrontLaunchControl from '@/components/admin/StorefrontLaunchControl';

export default async function AdminPage() {
  const [data, siteMode] = await Promise.all([
    getAdminDashboardData(),
    getSiteMode(),
  ]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Control</h1>
          <p className="page-sub">GODSMOVE live commerce metrics & logs dashboard</p>
        </div>
      </div>

      {/* ── STOREFRONT LAUNCH SWITCH ─────────────────────────────── */}
      <StorefrontLaunchControl initialSiteMode={siteMode} />

      {/* ── METRICS SUMMARY GRID ─────────────────────────────── */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-label">Revenue Today</div>
          <div className="stat-value">{formatINR(data.revenueToday)}</div>
          <div className="stat-sub">PAID orders today</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Revenue (Month)</div>
          <div className="stat-value">{formatINR(data.revenueThisMonth)}</div>
          <div className="stat-sub">Current calendar month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Order Value</div>
          <div className="stat-value">{formatINR(data.averageOrderValue)}</div>
          <div className="stat-sub">PAID orders revenue / count</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">New Customers</div>
          <div className="stat-value">{data.newCustomers}</div>
          <div className="stat-sub">Registrations this month</div>
        </div>
      </div>

      {/* ── DETAILED STATUS ROW ─────────────────────────────── */}
      <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', marginBottom: 14 }}>
        Orders & Logs Lifecycle
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 32 }}>
        <div className="stat-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--admin-muted)' }}>TODAY</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{data.ordersToday}</div>
        </div>
        <div className="stat-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--admin-muted)' }}>PENDING</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: data.ordersPending > 0 ? 'var(--admin-warning)' : 'inherit' }}>
            {data.ordersPending}
          </div>
        </div>
        <div className="stat-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--admin-muted)' }}>PACKED</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{data.ordersPacked}</div>
        </div>
        <div className="stat-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--admin-muted)' }}>TRANSIT</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{data.ordersTransit}</div>
        </div>
        <div className="stat-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--admin-muted)' }}>DELIVERED</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-accent)' }}>{data.ordersDelivered}</div>
        </div>
        <div className="stat-card" style={{ padding: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--admin-muted)' }}>CANCELLED</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: 'var(--admin-danger)' }}>{data.ordersCancelled}</div>
        </div>
      </div>

      {/* ── CORE OPERATIONS ALERTS ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {/* Returns */}
        <div
          className="admin-card"
          style={{
            borderColor: data.pendingReturns > 0 ? 'var(--admin-warning)' : 'var(--admin-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="stat-label">Pending Returns</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: data.pendingReturns > 0 ? 'var(--admin-warning)' : 'inherit' }}>
              {data.pendingReturns} request{data.pendingReturns === 1 ? '' : 's'}
            </div>
            <div className="stat-sub">{data.pendingExchanges} active exchanges in system</div>
          </div>
          <Link href="/admin/returns" className="btn-secondary" style={{ fontSize: 12 }}>
            Review →
          </Link>
        </div>

        {/* Inventory */}
        <div
          className="admin-card"
          style={{
            borderColor: data.outOfStock > 0 ? 'var(--admin-danger)' : data.lowStock > 0 ? 'var(--admin-warning)' : 'var(--admin-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div className="stat-label">Warehouse Inventory Alerts</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: data.outOfStock > 0 ? 'var(--admin-danger)' : 'inherit' }}>
              {data.outOfStock} Out of Stock
            </div>
            <div className="stat-sub">{data.lowStock} items currently low stock</div>
          </div>
          <Link href="/admin/inventory" className="btn-secondary" style={{ fontSize: 12 }}>
            Audit Stock →
          </Link>
        </div>
      </div>

      {/* ── FINANCIAL CREDIT METRICS ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', padding: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Store Credits Issued</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--admin-accent)', marginTop: 4 }}>
              {formatINR(data.walletCreditsIssued)}
            </div>
          </div>
        </div>
        <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', padding: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)', textTransform: 'uppercase' }}>Store Credits Redeemed</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--admin-info)', marginTop: 4 }}>
              {formatINR(data.walletCreditsRedeemed)}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVITY LIST TABLES ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Recent Orders */}
        <div>
          <div className="flex-between mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Order Log</h2>
            <Link href="/admin/orders" className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
              View all
            </Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: 32 }}>
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/orders/${o.id}`} className="mono" style={{ color: 'var(--admin-accent)', fontWeight: 700, textDecoration: 'none' }}>
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {o.profile ? `${o.profile.firstName ?? ''} ${o.profile.lastName ?? ''}`.trim() : o.email}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatINR(o.total)}</td>
                      <td>
                        <span className={STATUS_BADGE[o.status] ?? 'badge badge-grey'}>{o.status.replace('_', ' ')}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{formatDate(o.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity: Returns & Customers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Recent Returns */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Returns</h2>
              <Link href="/admin/returns" className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                All
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recentReturns.length === 0 ? (
                <div className="admin-card" style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: 24, fontSize: 13 }}>
                  No returns logs.
                </div>
              ) : (
                data.recentReturns.map((r) => (
                  <Link key={r.id} href={`/admin/returns/${r.id}`} className="admin-card-sm" style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="mono" style={{ color: 'var(--admin-accent)', fontSize: 12 }}>{r.orderNumber}</span>
                      <span className={`badge ${r.type === 'EXCHANGE' ? 'badge-blue' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                        {r.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--admin-text)', fontWeight: 600 }}>
                      {r.profile.firstName} {r.profile.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 2 }}>{formatDate(r.createdAt)}</div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Signups */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, marginBottom: 16 }}>Recent Signups</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recentCustomers.map((c) => (
                <div key={c.id} className="admin-card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--admin-surface-2)',
                      border: '1px solid var(--admin-border-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--admin-accent)',
                    }}
                  >
                    {(c.firstName?.[0] || c.email[0]).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {c.firstName || c.lastName ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : 'Unnamed'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{c.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
