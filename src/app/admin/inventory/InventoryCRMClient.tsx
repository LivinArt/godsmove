'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adjustInventoryStock } from '@/actions/admin-operations.actions';

interface InventoryItem {
  id: string;
  variantId: string;
  productId?: string;
  sku: string;
  size: string;
  color: string | null;
  productName: string;
  productSlug: string;
  productStatus: string;
  isPreBooking?: boolean;
  preBookingAllocation?: number;
  paidPreBookings?: number;
  remainingPreBookingAllocation?: number;
  normalLaunchAvailable?: number;
  launchDateTime?: string | null;
  type: string;
  totalStock: number;
  reservedStock: number;
  soldStock: number;
  damagedStock: number;
  incomingStock: number;
  lowStockAt: number;
  minThreshold: number;
  warehouse: string | null;
  supplier: string | null;
  restockEta: string | null;
  isDiscontinued: boolean;
  availableStock: number;
  movements: Array<{
    id: string;
    delta: number;
    type: string;
    reason: string | null;
    createdAt: string;
  }>;
}

export default function InventoryCRMClient({
  initialInventory,
}: {
  initialInventory: InventoryItem[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ALL' | 'NORMAL' | 'PRE_BOOKING'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Stock Adjustment Form states
  const [selectedInv, setSelectedInv] = useState<InventoryItem | null>(null);
  const [actionType, setActionType] = useState<'RESTOCK' | 'DAMAGE' | 'ADJUSTMENT'>('RESTOCK');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  // Tab & Search Filtering
  const filteredInventory = initialInventory.filter((item) => {
    const isPb = Boolean(item.isPreBooking);
    if (activeTab === 'NORMAL' && isPb) return false;
    if (activeTab === 'PRE_BOOKING' && !isPb) return false;

    const term = search.toLowerCase();
    return (
      item.productName.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.size.toLowerCase().includes(term) ||
      (item.warehouse && item.warehouse.toLowerCase().includes(term))
    );
  });

  // Summary Metrics for PRE_BOOKING Tab
  const preBookingItems = initialInventory.filter((item) => Boolean(item.isPreBooking));
  const totalPbPhysicalStock = preBookingItems.reduce((sum, item) => sum + item.totalStock, 0);
  const totalPbAllocation = preBookingItems.reduce((sum, item) => sum + (item.preBookingAllocation || 0), 0);
  const totalPbPaidBookings = preBookingItems.reduce((sum, item) => sum + (item.paidPreBookings || 0), 0);
  const totalPbRemainingAlloc = Math.max(0, totalPbAllocation - totalPbPaidBookings);
  const totalPbNormalLaunchAvailable = Math.max(0, totalPbPhysicalStock - totalPbPaidBookings);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }

    setLoading(true);
    try {
      await adjustInventoryStock(selectedInv.id, qty, actionType, adjustReason);
      alert('Inventory adjusted and logged.');
      setSelectedInv(null);
      setAdjustQty('');
      setAdjustReason('');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Inventory adjustment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Inventory Control</h1>
          <p className="page-sub">Track stock counts, physical allocations, Pre-Booking metrics, and warehouse availability</p>
        </div>
      </div>

      {/* Segmented Category Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--admin-border)', paddingBottom: 12 }}>
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'ALL' ? '1px solid #c5a059' : '1px solid var(--admin-border)',
            background: activeTab === 'ALL' ? 'rgba(197, 160, 89, 0.15)' : 'var(--admin-surface)',
            color: activeTab === 'ALL' ? '#c5a059' : 'var(--admin-muted)',
            transition: 'all 0.2s ease',
          }}
        >
          ALL INVENTORY ({initialInventory.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('NORMAL')}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'NORMAL' ? '1px solid #c5a059' : '1px solid var(--admin-border)',
            background: activeTab === 'NORMAL' ? 'rgba(197, 160, 89, 0.15)' : 'var(--admin-surface)',
            color: activeTab === 'NORMAL' ? '#c5a059' : 'var(--admin-muted)',
            transition: 'all 0.2s ease',
          }}
        >
          NORMAL INVENTORY ({initialInventory.length - preBookingItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRE_BOOKING')}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: activeTab === 'PRE_BOOKING' ? '1px solid #c5a059' : '1px solid var(--admin-border)',
            background: activeTab === 'PRE_BOOKING' ? 'rgba(197, 160, 89, 0.15)' : 'var(--admin-surface)',
            color: activeTab === 'PRE_BOOKING' ? '#c5a059' : 'var(--admin-muted)',
            transition: 'all 0.2s ease',
          }}
        >
          PRE-BOOKING ({preBookingItems.length})
        </button>
      </div>

      {/* Summary Metric Cards when PRE_BOOKING Category is Active */}
      {activeTab === 'PRE_BOOKING' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div className="admin-card" style={{ padding: '16px', background: 'var(--admin-surface)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-muted)' }}>
              TOTAL PHYSICAL INVENTORY
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
              {totalPbPhysicalStock} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)' }}>Pcs</span>
            </div>
          </div>

          <div className="admin-card" style={{ padding: '16px', background: 'var(--admin-surface)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-muted)' }}>
              PRE-BOOKING ALLOCATION
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#c5a059', marginTop: 4 }}>
              {totalPbAllocation} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)' }}>Cap</span>
            </div>
          </div>

          <div className="admin-card" style={{ padding: '16px', background: 'var(--admin-surface)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-muted)' }}>
              PAID PRE-BOOKINGS
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e', marginTop: 4 }}>
              {totalPbPaidBookings} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)' }}>Confirmed</span>
            </div>
          </div>

          <div className="admin-card" style={{ padding: '16px', background: 'var(--admin-surface)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-muted)' }}>
              REMAINING ALLOCATION
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#eab308', marginTop: 4 }}>
              {totalPbRemainingAlloc} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)' }}>Slots</span>
            </div>
          </div>

          <div className="admin-card" style={{ padding: '16px', background: 'var(--admin-surface)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-muted)' }}>
              NORMAL LAUNCH AVAILABLE
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', marginTop: 4 }}>
              {totalPbNormalLaunchAvailable} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)' }}>Available</span>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Filter SKUs by product name, SKU code, size, or warehouse location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            color: 'var(--admin-text)',
            fontSize: 13,
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedInv ? '1fr 340px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Table list */}
        <div className="admin-table-wrap">
          <table className="admin-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>Product / SKU</th>
                <th>Warehouse</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'center' }}>Total</th>
                <th style={{ textAlign: 'center' }}>PRE-BOOK ALLOCATION</th>
                <th style={{ textAlign: 'center' }}>PRE-BOOK RESERVED</th>
                <th style={{ textAlign: 'center' }}>ORDERS</th>
                <th style={{ textAlign: 'center' }}>SOLD</th>
                <th style={{ textAlign: 'center' }}>RETURN</th>
                <th style={{ textAlign: 'center' }}>Incoming</th>
                <th style={{ textAlign: 'center' }}>AVAILABLE</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>
                    No matching inventory rows found for category tab.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((inv: any) => {
                  const isOut = inv.availableStock <= 0;
                  const isLow = inv.availableStock <= inv.minThreshold && inv.availableStock > 0;
                  const isPb = Boolean(inv.isPreBooking);
                  const preBookAlloc = inv.preBookAllocation ?? inv.preBookingAllocation ?? 0;
                  const preBookRes = inv.preBookReserved ?? inv.paidPreBookings ?? 0;
                  const normalOrd = inv.normalOrders ?? 0;
                  const soldUnits = inv.sold ?? (preBookRes + normalOrd);
                  const retUnits = inv.returnUnits ?? 0;
                  const availStock = inv.availableStock ?? (inv.totalStock - soldUnits + retUnits);

                  return (
                    <tr key={inv.id} style={selectedInv?.id === inv.id ? { background: 'var(--admin-surface-2)' } : {}}>
                      <td>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{inv.productName}</span>
                          {isPb && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#c5a059', background: 'rgba(197, 160, 89, 0.15)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(197, 160, 89, 0.3)' }}>
                              PRE-BOOKING
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 2 }}>
                          <span className="mono">{inv.sku}</span> • Size {inv.size} {inv.color ? `• ${inv.color}` : ''}
                        </div>
                      </td>
                      <td style={{ color: 'var(--admin-muted)' }}>{inv.warehouse || 'Main'}</td>
                      <td style={{ color: 'var(--admin-muted)' }}>{inv.supplier || 'GODSMOVE'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{inv.totalStock}</td>

                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#c5a059' }}>
                        {preBookAlloc}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#22c55e' }}>
                        {preBookRes}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#3b82f6' }}>
                        {normalOrd}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#ffffff' }}>
                        {soldUnits}
                      </td>
                      <td style={{ textAlign: 'center', color: retUnits > 0 ? '#eab308' : 'var(--admin-muted)' }}>
                        {retUnits}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--admin-muted)' }}>
                        {inv.incomingStock ?? 0}
                      </td>
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: 700,
                          color: isOut ? 'var(--admin-danger)' : isLow ? 'var(--admin-warning)' : 'var(--admin-accent)',
                        }}
                      >
                        {availStock}
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge badge-red">SOLD OUT</span>
                        ) : isLow ? (
                          <span className="badge badge-yellow">LOW</span>
                        ) : isPb && (inv.remainingPreBookingAllocation || 0) === 0 && preBookAlloc > 0 ? (
                          <span className="badge badge-yellow">ALLOC FULL</span>
                        ) : (
                          <span className="badge badge-green">OK</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => setSelectedInv(inv)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }}>
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Action adjustment sidebar (toggled on SKU selection) */}
        {selectedInv && (
          <div className="admin-card" style={{ background: 'var(--admin-surface-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Adjust Stock</h3>
              <button onClick={() => setSelectedInv(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-muted)', cursor: 'pointer', fontSize: 16 }}>
                ×
              </button>
            </div>

            <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginBottom: 16, borderBottom: '1px solid var(--admin-border)', paddingBottom: 12 }}>
              <strong style={{ color: 'var(--admin-text)' }}>{selectedInv.productName}</strong>
              <div style={{ marginTop: 2 }}>SKU: <span className="mono">{selectedInv.sku}</span> • Size {selectedInv.size}</div>
            </div>

            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)', marginBottom: 4 }}>Adjustment Action</label>
                <select
                  value={actionType}
                  onChange={(e: any) => setActionType(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 12 }}
                >
                  <option value="RESTOCK">Receive / Restock Inventory (+ available)</option>
                  <option value="DAMAGE">Mark Stock as Damaged (moves to damaged)</option>
                  <option value="ADJUSTMENT">Manual Calibration Correction</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)', marginBottom: 4 }}>Quantity</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 10 or 25"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)', marginBottom: 4 }}>Log Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supplier restocking, received damaged box..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 12 }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Processing...' : 'Apply adjustment'}
              </button>
            </form>

            {/* Movement Ledger feed */}
            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)', marginTop: 24, marginBottom: 12 }}>
              Recent movements log
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
              {selectedInv.movements.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--admin-muted)', textAlign: 'center', padding: 12 }}>
                  No movement logs.
                </div>
              ) : (
                selectedInv.movements.map((m) => (
                  <div key={m.id} style={{ fontSize: 11, borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: m.delta > 0 ? 'var(--admin-accent)' : 'var(--admin-danger)' }}>
                        {m.delta > 0 ? `+` : ``}
                        {m.delta} units
                      </span>
                      <span style={{ color: 'var(--admin-muted)' }}>{m.type}</span>
                    </div>
                    <div style={{ color: 'var(--admin-muted)', marginTop: 2 }}>{m.reason}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
