import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function MarketingCustomersPage() {
  const customers = await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      orders: { select: { id: true, total: true } },
      wallet: { select: { balance: true } },
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>CUSTOMER ENGAGEMENT CRM DIRECTORY</h2>
          <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Unified Customer History, Vault Balances, Campaign Engagement & Quick Actions</span>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div style={{ backgroundColor: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
        <table width="100%" cellPadding="12" cellSpacing="0" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#8c857b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th>Customer</th>
              <th>Email</th>
              <th>Orders</th>
              <th>Lifetime Spend</th>
              <th>Vault Credits</th>
              <th>Consent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const totalOrders = c.orders.length;
              const spend = c.orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
              const walletBal = Number(c.wallet?.balance || 0);

              return (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#ffffff' }}>
                  <td style={{ fontWeight: 700 }}>
                    {c.firstName} {c.lastName}
                  </td>
                  <td style={{ color: '#a1a1aa' }}>{c.email}</td>
                  <td>{totalOrders}</td>
                  <td style={{ color: '#22c55e', fontWeight: 700 }}>₹{spend.toLocaleString('en-IN')}</td>
                  <td style={{ color: '#c8a46a', fontWeight: 700 }}>₹{walletBal.toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: c.marketingEmails ? '#22c55e' : '#ef4444' }}>
                      {c.marketingEmails ? 'OPTED IN' : 'OPTED OUT'}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      style={{ color: '#c8a46a', textDecoration: 'none', fontSize: '11px', fontWeight: 700 }}
                    >
                      Engagement Drawer →
                    </Link>
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
