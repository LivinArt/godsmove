'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Pencil } from 'lucide-react';
import { DeleteDiscountDialog } from './DeleteDiscountDialog';

type DiscountRow = {
  id: string;
  name: string;
  code: string;
  type: string;
  value: any; // Prisma Decimal
  status: string;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  _count?: { products: number };
  appliesToAll: boolean;
};

interface DiscountsTableProps {
  discounts: DiscountRow[];
}

const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  DRAFT:     { cls: 'badge badge-grey',   label: 'Draft' },
  SCHEDULED: { cls: 'badge badge-yellow', label: 'Scheduled' },
  ACTIVE:    { cls: 'badge badge-green',  label: 'Active' },
  EXPIRED:   { cls: 'badge badge-grey',   label: 'Expired' },
  ARCHIVED:  { cls: 'badge badge-grey',   label: 'Archived' },
};

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatValue(type: string, value: any) {
  const num = Number(value);
  if (type === 'PERCENTAGE') return `${num}% OFF`;
  if (type === 'FIXED_AMOUNT') return `₹${num}`;
  if (type === 'FREE_SHIPPING') return 'Free Shipping';
  return String(value);
}

export function DiscountsTable({ discounts: initialDiscounts }: DiscountsTableProps) {
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [pendingDelete, setPendingDelete] = useState<DiscountRow | null>(null);

  const handleDeleted = (deletedId: string) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== deletedId));
  };

  if (discounts.length === 0) {
    return (
      <div className="admin-table-wrap">
        <div className="empty-state">
          <h3>No discounts found</h3>
          <p>Create your first discount to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Value</th>
              <th>Status</th>
              <th>Validity</th>
              <th>Usage</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount) => {
              const cfg = STATUS_CONFIG[discount.status] ?? STATUS_CONFIG.DRAFT;

              return (
                <tr key={discount.id} style={{ opacity: discount.isActive ? 1 : 0.6 }}>
                  {/* Code + name */}
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, fontFamily: 'var(--admin-mono)' }}>
                      {discount.code}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--admin-text)',
                        marginBottom: 4,
                      }}
                    >
                      {discount.name}
                    </div>
                    {!discount.appliesToAll && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--admin-accent)',
                          fontWeight: 600
                        }}
                      >
                        {discount._count?.products || 0} Products
                      </div>
                    )}
                  </td>

                  {/* Value */}
                  <td style={{ fontSize: 14, fontWeight: 600 }}>
                    {formatValue(discount.type, discount.value)}
                  </td>

                  {/* Status */}
                  <td>
                    <span className={cfg.cls}>{cfg.label}</span>
                    {!discount.isActive && (
                      <div style={{ fontSize: 10, color: 'var(--admin-muted)', marginTop: 4 }}>
                        ⏸ Inactive
                      </div>
                    )}
                  </td>

                  {/* Validity */}
                  <td style={{ fontSize: 12 }}>
                    {discount.startsAt ? (
                      <div>From: {DATE_FMT.format(discount.startsAt)}</div>
                    ) : (
                      <div style={{ color: 'var(--admin-muted)' }}>From: —</div>
                    )}
                    {discount.endsAt ? (
                      <div style={{ marginTop: 2 }}>Until: {DATE_FMT.format(discount.endsAt)}</div>
                    ) : (
                      <div style={{ color: 'var(--admin-muted)', marginTop: 2 }}>Until: Forever</div>
                    )}
                  </td>

                  {/* Usage */}
                  <td style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{discount.usageCount}</span>
                    <span style={{ color: 'var(--admin-muted)' }}>
                      {discount.usageLimit ? ` / ${discount.usageLimit}` : ' used'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        justifyContent: 'flex-end',
                        flexWrap: 'nowrap',
                      }}
                    >
                      <Link
                        href={`/admin/discounts/${discount.id}/edit`}
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                      >
                        <Pencil size={12} />
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => setPendingDelete(discount)}
                        className="btn-danger"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                        title={`Delete ${discount.code}`}
                      >
                        <Trash2 size={12} />
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

      <DeleteDiscountDialog
        discount={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}
