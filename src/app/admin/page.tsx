import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getDashboardData() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    ordersToday,
    revenue30d,
    pendingOrders,
    pendingReturns,
    lowStockItems,
    recentOrders,
    recentReturns,
  ] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: 'PAID' } }),
    prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: last30 },
      },
    }),
    prisma.order.count({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } },
    }),
    prisma.returnRequest.count({ where: { status: 'PENDING' } }),
    prisma.inventory.count({
      where: {
        // Available stock below lowStockAt threshold
        AND: [
          { totalStock: { gt: 0 } },
        ],
      },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        items: { select: { productName: true, quantity: true }, take: 1 },
      },
    }),
    prisma.returnRequest.findMany({
      take: 5,
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNumber: true } },
        profile: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  return {
    totalOrders,
    ordersToday,
    revenue30d: Number(revenue30d._sum.total ?? 0),
    pendingOrders,
    pendingReturns,
    lowStockItems,
    recentOrders,
    recentReturns,
  };
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge badge-yellow',
  CONFIRMED: 'badge badge-blue',
  PROCESSING: 'badge badge-blue',
  SHIPPED: 'badge badge-green',
  DELIVERED: 'badge badge-green',
  CANCELLED: 'badge badge-red',
  EXCHANGE_REQUESTED: 'badge badge-yellow',
  RETURN_REQUESTED: 'badge badge-yellow',
};

export default async function AdminPage() {
  const data = await getDashboardData();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">GODSMOVE operations dashboard</p>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Revenue (30d)</div>
          <div className="stat-value">{formatINR(data.revenue30d)}</div>
          <div className="stat-sub">Confirmed orders only</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Orders Today</div>
          <div className="stat-value">{data.ordersToday}</div>
          <div className="stat-sub">{data.totalOrders} total all-time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Orders</div>
          <div className="stat-value">{data.pendingOrders}</div>
          <div className="stat-sub">Awaiting fulfillment</div>
        </div>
        <div className="stat-card" style={data.pendingReturns > 0 ? { borderColor: 'var(--admin-warning)' } : {}}>
          <div className="stat-label">Pending Returns</div>
          <div className="stat-value" style={data.pendingReturns > 0 ? { color: 'var(--admin-warning)' } : {}}>
            {data.pendingReturns}
          </div>
          <div className="stat-sub">Require review</div>
        </div>
      </div>

      {/* ── ALERTS ────────────────────────────── */}
      {data.pendingReturns > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <span>⚠</span>
          <span>
            {data.pendingReturns} return request{data.pendingReturns > 1 ? 's' : ''} awaiting admin review.{' '}
            <Link href="/admin/returns" style={{ color: 'inherit', fontWeight: 700 }}>
              Review now →
            </Link>
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>

        {/* ── RECENT ORDERS ──────────────────── */}
        <div>
          <div className="flex-between mb-4">
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Orders</h2>
            <Link href="/admin/orders" className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
              View all
            </Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: 40 }}>
                      No orders yet
                    </td>
                  </tr>
                )}
                {data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} style={{ color: 'var(--admin-accent)', fontWeight: 600, fontFamily: 'var(--admin-mono)', fontSize: 12 }}>
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {order.profile
                        ? `${order.profile.firstName ?? ''} ${order.profile.lastName ?? ''}`.trim()
                        : order.email}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--admin-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.items[0]?.productName}{order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                    </td>
                    <td>
                      <span className={STATUS_BADGE[order.status] ?? 'badge badge-grey'}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatINR(Number(order.total))}</td>
                    <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PENDING RETURNS ────────────────── */}
        <div>
          <div className="flex-between mb-4">
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Pending Returns</h2>
            <Link href="/admin/returns" className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
              View all
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recentReturns.length === 0 ? (
              <div className="admin-card" style={{ textAlign: 'center', color: 'var(--admin-muted)', fontSize: 13, padding: 32 }}>
                No pending returns
              </div>
            ) : (
              data.recentReturns.map((ret) => (
                <Link
                  key={ret.id}
                  href={`/admin/returns/${ret.id}`}
                  className="admin-card-sm"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--admin-mono)', color: 'var(--admin-accent)' }}>
                      {ret.order.orderNumber}
                    </span>
                    <span className={`badge ${ret.type === 'EXCHANGE' ? 'badge-blue' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                      {ret.type === 'EXCHANGE' ? 'Exchange' : 'Credit'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--admin-text)', fontWeight: 500 }}>
                    {ret.profile.firstName ?? ''} {ret.profile.lastName ?? ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 2 }}>
                    {formatDate(ret.createdAt)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
