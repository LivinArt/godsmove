import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function InventoryAdminPage() {
  const inventory = await prisma.inventory.findMany({
    include: {
      variant: {
        include: {
          product: { select: { name: true, slug: true, status: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const lowStockItems = inventory.filter((inv) => {
    const avail = inv.totalStock - inv.soldStock - inv.reservedStock;
    return avail <= inv.lowStockAt && avail >= 0;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-sub">{inventory.length} variants tracked</p>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          ⚠ {lowStockItems.length} variant{lowStockItems.length > 1 ? 's' : ''} are at or below their low-stock threshold.
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th><th>SKU</th><th>Size</th><th>Type</th>
              <th>Total</th><th>Reserved</th><th>Sold</th><th>Available</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((inv) => {
              const available = inv.totalStock - inv.soldStock - inv.reservedStock;
              const isLow = available <= inv.lowStockAt && available > 0;
              const isOut = available <= 0;
              return (
                <tr key={inv.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{inv.variant.product.name}</div>
                  </td>
                  <td><span className="mono">{inv.variant.sku}</span></td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{inv.variant.size}</td>
                  <td>
                    <span className={inv.type === 'LIMITED' ? 'badge badge-yellow' : 'badge badge-grey'} style={{ fontSize: 10 }}>
                      {inv.type}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{inv.totalStock}</td>
                  <td style={{ textAlign: 'right', color: 'var(--admin-muted)' }}>{inv.reservedStock}</td>
                  <td style={{ textAlign: 'right', color: 'var(--admin-muted)' }}>{inv.soldStock}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: isOut ? 'var(--admin-danger)' : isLow ? 'var(--admin-warning)' : 'var(--admin-accent)' }}>
                    {available}
                  </td>
                  <td>
                    {isOut ? <span className="badge badge-red">OUT</span>
                      : isLow ? <span className="badge badge-yellow">LOW</span>
                      : <span className="badge badge-green">OK</span>}
                  </td>
                </tr>
              );
            })}
            {inventory.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>No inventory records. Add products with variants first.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
