import { prisma } from '@/lib/prisma';
import Link from 'next/link';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge badge-yellow', CONFIRMED: 'badge badge-blue',
  PROCESSING: 'badge badge-blue', SHIPPED: 'badge badge-green',
  DELIVERED: 'badge badge-green', CANCELLED: 'badge badge-red',
  EXCHANGE_REQUESTED: 'badge badge-yellow', RETURN_REQUESTED: 'badge badge-yellow',
};

const PAY_CLASS: Record<string, string> = {
  UNPAID: 'badge badge-grey', PAID: 'badge badge-green',
  FAILED: 'badge badge-red', REFUNDED: 'badge badge-yellow',
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
}) {
  const { status, type, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? '1'));
  const take = 25;
  const skip = (pageNum - 1) * take;

  const whereClause: any = {};
  if (status) {
    whereClause.status = status as any;
  }
  if (type === 'pre_booking') {
    whereClause.orderType = 'PRE_BOOKING';
  } else if (type === 'live') {
    whereClause.orderType = 'REGULAR';
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        profile: { select: { firstName: true, lastName: true } },
        items: { select: { productName: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.order.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / take);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">{total} total orders</p>
        </div>
      </div>

      {/* DEDICATED ORDER TYPE FILTERS (All Orders | Live Orders | Pre Booking Orders) */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'All Orders', value: '' },
          { label: 'Live Orders', value: 'live' },
          { label: 'Pre Booking Orders', value: 'pre_booking' },
        ].map((t) => {
          const isActive = (type ?? '') === t.value;
          const href = t.value
            ? `/admin/orders?type=${t.value}${status ? `&status=${status}` : ''}`
            : `/admin/orders${status ? `?status=${status}` : ''}`;

          return (
            <Link
              key={t.value}
              href={href}
              style={{
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                background: isActive ? '#c8a46a' : 'var(--admin-surface-2)',
                color: isActive ? '#050505' : 'var(--admin-muted)',
                border: '1px solid var(--admin-border)',
                transition: 'all 0.2s ease',
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Status Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => {
          const href = s
            ? `/admin/orders?status=${s}${type ? `&type=${type}` : ''}`
            : `/admin/orders${type ? `?type=${type}` : ''}`;

          return (
            <Link
              key={s}
              href={href}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                background: status === s || (!status && !s) ? 'var(--admin-border)' : 'var(--admin-surface-2)',
                color: status === s || (!status && !s) ? '#ffffff' : 'var(--admin-muted)',
                border: '1px solid var(--admin-border)',
              }}
            >
              {s || 'All Statuses'}
            </Link>
          );
        })}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order #</th><th>Customer</th><th>Items</th>
              <th>Type</th><th>Status</th><th>Payment</th><th>Total</th><th>Date</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>No orders found</td></tr>
            )}
            {orders.map((order) => (
              <tr key={order.id}>
                <td><span className="mono" style={{ color: 'var(--admin-accent)' }}>{order.orderNumber}</span></td>
                <td style={{ fontSize: 13 }}>
                  {order.profile ? `${order.profile.firstName ?? ''} ${order.profile.lastName ?? ''}`.trim() : order.email}
                </td>
                <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                  {order.items.map(i => `${i.productName} ×${i.quantity}`).join(', ').slice(0, 40)}
                </td>
                <td>
                  {order.orderType === 'PRE_BOOKING' || order.isPreBooking ? (
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '3px', background: 'rgba(200, 164, 106, 0.15)', color: '#c8a46a', border: '1px solid rgba(200, 164, 106, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      PRE BOOKING
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--admin-muted)' }}>
                      REGULAR
                    </span>
                  )}
                </td>
                <td><span className={STATUS_CLASS[order.status] ?? 'badge'}>{order.status}</span></td>
                <td><span className={PAY_CLASS[order.paymentStatus] ?? 'badge'}>{order.paymentStatus}</span></td>
                <td style={{ fontWeight: 600 }}>{formatINR(Number(order.total))}</td>
                <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{formatDate(order.createdAt)}</td>
                <td>
                  <Link href={`/admin/orders/${order.id}`} className="admin-btn admin-btn-sm admin-btn-secondary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
