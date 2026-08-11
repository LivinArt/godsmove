'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Clock, AlertTriangle, X } from 'lucide-react';
import { DeleteProductModal } from './DeleteProductModal';

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  channel: string;
  isExclusiveRack?: boolean;
  isPreBooking?: boolean;
  maxPreBooking?: number | null;
  currentPreBookings?: number | null;
  launchDateTime?: string | Date | null;
  collectionName?: string | null;
  featuredBadge?: string | null;
  images: { isCover: boolean; url: string }[];
  category?: { name: string } | null;
  drop?: { name: string } | null;
  variants: {
    id: string;
    inventory: { totalStock: number; soldStock: number; reservedStock: number } | null;
  }[];
};

interface ProductsTableProps {
  products: ProductRow[];
}

const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'badge badge-grey',
  ACTIVE: 'badge badge-green',
  HIDDEN: 'badge badge-yellow',
  ARCHIVED: 'badge badge-grey',
  SOLD_OUT: 'badge badge-red',
};

function availableStock(product: ProductRow) {
  if (!product.variants || !Array.isArray(product.variants)) return 0;
  return product.variants.reduce((sum, v) => {
    const inv = v.inventory;
    if (!inv) return sum;
    return sum + inv.totalStock - inv.soldStock - inv.reservedStock;
  }, 0);
}

function getPreBookingTimeRemaining(launchDateTime: string | Date | null) {
  if (!launchDateTime) return null;
  const now = new Date();
  const launch = new Date(launchDateTime);
  const diffMs = launch.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${mins}m`;
}

export function ProductsTable({ products: initialProducts }: ProductsTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [sessionNotified, setSessionNotified] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const notified = sessionStorage.getItem('gm_admin_prebooking_launch_notified');
      if (notified === 'true') {
        setSessionNotified(true);
      }
    }
  }, []);

  const dismissNotification = () => {
    setSessionNotified(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gm_admin_prebooking_launch_notified', 'true');
    }
  };

  const handleDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const now = new Date();

  // Find approaching pre-booking launch products (within 48 hours)
  const approachingProducts = products.filter((p) => {
    if (!p.isPreBooking || !p.launchDateTime) return false;
    const launch = new Date(p.launchDateTime);
    const diffMs = launch.getTime() - now.getTime();
    return diffMs > 0 && diffMs <= 48 * 60 * 60 * 1000;
  });

  return (
    <>
      {/* Session-Scoped Approaching Launch Notification */}
      {!sessionNotified && approachingProducts.length > 0 && (
        <div
          style={{
            background: 'rgba(197, 160, 89, 0.12)',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            borderRadius: '6px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} style={{ color: '#c5a059', flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#c5a059', letterSpacing: '0.05em' }}>
                PRE-BOOKING LAUNCH APPROACHING
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginLeft: '8px' }}>
                {approachingProducts.map((p) => {
                  const launch = new Date(p.launchDateTime!);
                  const diffHours = Math.round((launch.getTime() - now.getTime()) / (1000 * 60 * 60));
                  return `"${p.name}" launches in ~${diffHours}h`;
                }).join(' • ')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissNotification}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
            title="Dismiss for session"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 60, color: 'var(--admin-muted)' }}>
                  No products found matching your criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Drop / Destination</th>
                <th>Status</th>
                <th>Stock</th>
                <th>Variants</th>
                <th>Collection</th>
                <th>Badge</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const stock = availableStock(p);
                const isLow = stock <= 5 && stock > 0;
                const coverImg = p.images.find((i) => i.isCover)?.url || p.images[0]?.url;
                const dropLabel = p.isExclusiveRack
                  ? 'EXCLUSIVE RACK'
                  : (p.drop?.name ?? '—');

                const timeRemaining = getPreBookingTimeRemaining(p.launchDateTime ?? null);
                const isPreBookingActive = Boolean(p.isPreBooking && timeRemaining);

                return (
                  <tr key={p.id}>
                    <td style={{ width: 50 }}>
                      {coverImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverImg}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded bg-white/5 border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-white/5 border border-white/10" />
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {p.name}
                        {p.isPreBooking && (
                          <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '3px', background: 'rgba(197, 160, 89, 0.15)', color: '#c5a059', border: '1px solid rgba(197, 160, 89, 0.3)' }}>
                            PRE-BOOK
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--admin-muted)', fontFamily: 'var(--admin-mono)' }}>
                        {p.slug}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{p.category?.name || 'Uncategorized'}</td>
                    <td style={{ fontSize: 12, color: p.isExclusiveRack ? '#c5a059' : 'var(--admin-muted)', fontWeight: p.isExclusiveRack ? 600 : 400 }}>
                      {dropLabel}
                    </td>
                    <td>
                      {isPreBookingActive ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', background: 'rgba(197, 160, 89, 0.15)', color: '#c5a059', border: '1px solid rgba(197, 160, 89, 0.3)' }}>
                          <Clock size={11} /> Launch in: {timeRemaining}
                        </span>
                      ) : (
                        <span className={STATUS_CLASS[p.status] ?? 'badge badge-grey'}>{p.status}</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            isLow
                              ? 'var(--admin-warning)'
                              : stock === 0
                              ? 'var(--admin-danger)'
                              : 'var(--admin-text)',
                        }}
                      >
                        {stock}
                        {isLow && <span style={{ marginLeft: 4, fontSize: 9 }}>LOW</span>}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{p.variants?.length ?? 0} sizes</td>
                    <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{p.collectionName || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {p.featuredBadge ? (
                        <span className="badge badge-grey" style={{ fontSize: 10, color: '#c5a059', borderColor: 'rgba(197,160,89,0.3)' }}>
                          {p.featuredBadge}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <Link
                          href={`/product/${p.slug}`}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          target="_blank"
                        >
                          Preview
                        </Link>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          id={`delete-product-${p.id}`}
                          onClick={() => setPendingDelete({ id: p.id, name: p.name, slug: p.slug })}
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          title={`Delete ${p.name}`}
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DeleteProductModal
        product={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}

