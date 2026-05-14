import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge badge-yellow', APPROVED: 'badge badge-blue',
  REJECTED: 'badge badge-red', RECEIVED: 'badge badge-blue', COMPLETED: 'badge badge-green',
};

export default async function ReturnsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const returns = await prisma.returnRequest.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      order: { select: { orderNumber: true, total: true } },
      profile: { select: { firstName: true, lastName: true, email: true } },
      items: {
        include: {
          orderItem: { select: { productName: true, size: true, quantity: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const pending = returns.filter((r) => r.status === 'PENDING');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Returns & Exchanges</h1>
          <p className="page-sub">{pending.length} pending review</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'PENDING', 'APPROVED', 'RECEIVED', 'COMPLETED', 'REJECTED'].map((s) => (
          <Link key={s} href={s ? `/admin/returns?status=${s}` : '/admin/returns'}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              textDecoration: 'none',
              background: status === s || (!status && !s) ? 'var(--admin-accent)' : 'var(--admin-surface-2)',
              color: status === s || (!status && !s) ? '#0a0a0a' : 'var(--admin-muted)',
              border: '1px solid var(--admin-border)',
            }}>
            {s || 'All'}
          </Link>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Type</th><th>Items</th><th>Status</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {returns.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>No returns found</td></tr>
            )}
            {returns.map((ret) => (
              <tr key={ret.id}>
                <td><span className="mono" style={{ color: 'var(--admin-accent)' }}>{ret.order.orderNumber}</span></td>
                <td style={{ fontSize: 13 }}>
                  {ret.profile.firstName} {ret.profile.lastName}
                  <div style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{ret.profile.email}</div>
                </td>
                <td><span className={ret.type === 'EXCHANGE' ? 'badge badge-blue' : 'badge badge-yellow'}>{ret.type === 'EXCHANGE' ? 'Exchange' : 'Credit'}</span></td>
                <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                  {ret.items.map(i => `${i.orderItem.productName} (${i.orderItem.size}) ×${i.quantity}`).join(', ').slice(0, 60)}
                </td>
                <td><span className={STATUS_CLASS[ret.status] ?? 'badge badge-grey'}>{ret.status}</span></td>
                <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                  {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(ret.createdAt)}
                </td>
                <td>
                  <Link href={`/admin/returns/${ret.id}`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>Review</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
