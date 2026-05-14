import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function DiscountsAdminPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });

  const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Discounts</h1>
          <p className="page-sub">{coupons.filter(c => c.isActive).length} active coupons</p>
        </div>
        <Link href="/admin/discounts/new" className="btn-primary">+ New Coupon</Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>No coupons yet.</td></tr>
            )}
            {coupons.map((c) => {
              const isExpired = c.expiresAt && c.expiresAt < new Date();
              const isExhausted = c.maxUses && c.usedCount >= c.maxUses;
              const isEffectivelyActive = c.isActive && !isExpired && !isExhausted;
              return (
                <tr key={c.id}>
                  <td><span className="mono" style={{ fontWeight: 700, color: 'var(--admin-accent)', letterSpacing: '0.08em' }}>{c.code}</span></td>
                  <td style={{ fontSize: 12 }}>{c.type.replace('_', ' ')}</td>
                  <td style={{ fontWeight: 600 }}>
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : c.type === 'FLAT_AMOUNT' ? formatINR(Number(c.value)) : 'Free Ship'}
                    {c.minOrderAmount && <span style={{ fontSize: 11, color: 'var(--admin-muted)', marginLeft: 4 }}>min {formatINR(Number(c.minOrderAmount))}</span>}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                    {c.expiresAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(c.expiresAt) : '—'}
                  </td>
                  <td>
                    <span className={isEffectivelyActive ? 'badge badge-green' : 'badge badge-grey'}>
                      {isExpired ? 'EXPIRED' : isExhausted ? 'EXHAUSTED' : c.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/discounts/${c.id}/edit`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>Edit</Link>
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
