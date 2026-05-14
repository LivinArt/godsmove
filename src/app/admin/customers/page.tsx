import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function CustomersAdminPage() {
  const customers = await prisma.profile.findMany({
    where: { role: 'CUSTOMER' },
    include: {
      orders: { select: { id: true, total: true, paymentStatus: true } },
      wallet: { select: { balance: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatINR = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-sub">{customers.length} registered</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Customer</th><th>Orders</th><th>Total Spent</th><th>Wallet</th><th>Since</th><th></th></tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>No customers yet</td></tr>
            )}
            {customers.map((c) => {
              const paidOrders = c.orders.filter(o => o.paymentStatus === 'PAID');
              const totalSpent = paidOrders.reduce((s, o) => s + Number(o.total), 0);
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{c.email}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{paidOrders.length}</td>
                  <td style={{ fontWeight: 600 }}>{formatINR(totalSpent)}</td>
                  <td style={{ color: Number(c.wallet?.balance ?? 0) > 0 ? 'var(--admin-accent)' : 'var(--admin-muted)' }}>
                    {formatINR(Number(c.wallet?.balance ?? 0))}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(c.createdAt)}
                  </td>
                  <td>
                    <Link href={`/admin/customers/${c.id}`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
