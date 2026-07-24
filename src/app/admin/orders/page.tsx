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
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? '1'));
  const take = 25;
  const skip = (pageNum - 1) * take;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        profile: { select: { firstName: true, lastName: true } },
        items: { select: { productName: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.order.count({ where: status ? { status: status as any } : undefined }),
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
          <Link
            key={s}
            href={s ? `/admin/orders?status=${s}` : '/admin/orders'}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              background: status === s || (!status && !s) ? 'var(--admin-accent)' : 'var(--admin-surface-2)',
              color: status === s || (!status && !s) ? '#0a0a0a' : 'var(--admin-muted)',
              border: '1px solid var(--admin-border)',
            }}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order #</th><th>Customer</th><th>Items</th>
              <th>Status</th><th>Payment</th><th>Total</th><th>Date</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>No orders found</td></tr>
            )}
            {orders.map((order) => (
              <tr key={order.id}>
                <td><span className="mono" style={{ color: 'var(--admin-accent)' }}>{order.orderNumber}</span></td>
                <td style={{ fontSize: 13 }}>
                  {order.profile ? `${order.profile.firstName ?? ''} ${order.profile.lastName ?? ''}`.trim() : order.email}
                </td>
                <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                  {order.items.map(i => `${i.productName} ×${i.quantity}`).join(', ').slice(0, 40)}
                  {order.items.length > 1 ? `…` : ''}
                </td>
                <td><span className={STATUS_CLASS[order.status] ?? 'badge badge-grey'}>{order.status.replace('_', ' ')}</span></td>
                <td><span className={PAY_CLASS[order.paymentStatus] ?? 'badge badge-grey'}>{order.paymentStatus}</span></td>
                <td style={{ fontWeight: 600 }}>{formatINR(Number(order.total))}</td>
                <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{formatDate(order.createdAt)}</td>
                <td>
                  <Link href={`/admin/orders/${order.id}`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          {pageNum > 1 && (
            <Link href={`/admin/orders?page=${pageNum - 1}${status ? `&status=${status}` : ''}`} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>← Prev</Link>
          )}
          <span style={{ padding: '6px 14px', fontSize: 13, color: 'var(--admin-muted)' }}>{pageNum} / {totalPages}</span>
          {pageNum < totalPages && (
            <Link href={`/admin/orders?page=${pageNum + 1}${status ? `&status=${status}` : ''}`} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>Next →</Link>
          )}
        </div>
      )}
    </div>
  );
}
