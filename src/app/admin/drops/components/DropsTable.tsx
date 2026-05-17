'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Pencil, Globe } from 'lucide-react';
import { DeleteDropDialog } from './DeleteDropDialog';

type DropRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  status: string;
  isFeatured: boolean;
  showCountdown: boolean;
  maxUnits: number | null;
  launchAt: Date | null;
  endAt: Date | null;
  heroImageUrl: string | null;
  products: { id: string; name: string; status: string }[];
  createdAt: Date;
};

interface DropsTableProps {
  drops: DropRow[];
}

const STATUS_CONFIG: Record<string, { cls: string; label: string }> = {
  DRAFT:     { cls: 'badge badge-grey',   label: 'Draft' },
  SCHEDULED: { cls: 'badge badge-yellow', label: 'Scheduled' },
  LIVE:      { cls: 'badge badge-green',  label: 'Live' },
  ENDED:     { cls: 'badge badge-grey',   label: 'Ended' },
  ARCHIVED:  { cls: 'badge badge-grey',   label: 'Archived' },
};

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function DropsTable({ drops: initialDrops }: DropsTableProps) {
  const [drops, setDrops] = useState(initialDrops);
  const [pendingDelete, setPendingDelete] = useState<DropRow | null>(null);

  const handleDeleted = (deletedId: string) => {
    setDrops((prev) => prev.filter((d) => d.id !== deletedId));
  };

  if (drops.length === 0) {
    return (
      <div className="admin-table-wrap">
        <div className="empty-state">
          <h3>No drops found</h3>
          <p>Create your first drop to get started.</p>
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
              <th style={{ width: 64 }}>Hero</th>
              <th>Drop</th>
              <th>Status</th>
              <th>Launch Date</th>
              <th>Products</th>
              <th>Featured</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drops.map((drop) => {
              const cfg = STATUS_CONFIG[drop.status] ?? STATUS_CONFIG.DRAFT;

              return (
                <tr key={drop.id}>
                  {/* Hero thumbnail */}
                  <td>
                    {drop.heroImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={drop.heroImageUrl}
                        alt={drop.name}
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: '1px solid var(--admin-border)',
                          background: 'var(--admin-surface-2)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 6,
                          border: '1px solid var(--admin-border)',
                          background: 'var(--admin-surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color: 'var(--admin-muted)',
                        }}
                      >
                        No img
                      </div>
                    )}
                  </td>

                  {/* Name + slug */}
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                      {drop.name}
                    </div>
                    {drop.tagline && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--admin-muted)',
                          marginBottom: 2,
                          fontStyle: 'italic',
                        }}
                      >
                        {drop.tagline}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--admin-muted)',
                        fontFamily: 'var(--admin-mono)',
                      }}
                    >
                      /{drop.slug}
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={cfg.cls}>{cfg.label}</span>
                    {drop.showCountdown && drop.status === 'SCHEDULED' && (
                      <div style={{ fontSize: 10, color: 'var(--admin-warning)', marginTop: 4 }}>
                        ⏱ Countdown active
                      </div>
                    )}
                    {drop.maxUnits && (
                      <div style={{ fontSize: 10, color: 'var(--admin-muted)', marginTop: 2 }}>
                        /{drop.maxUnits} units
                      </div>
                    )}
                  </td>

                  {/* Launch date */}
                  <td style={{ fontSize: 13 }}>
                    {drop.launchAt ? (
                      <span>{DATE_FMT.format(drop.launchAt)}</span>
                    ) : (
                      <span style={{ color: 'var(--admin-muted)' }}>—</span>
                    )}
                    {drop.endAt && (
                      <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 2 }}>
                        ends {DATE_FMT.format(drop.endAt)}
                      </div>
                    )}
                  </td>

                  {/* Products count */}
                  <td style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{drop.products.length}</span>
                    <span style={{ color: 'var(--admin-muted)' }}>
                      {' '}
                      product{drop.products.length !== 1 ? 's' : ''}
                    </span>
                  </td>

                  {/* Featured */}
                  <td>
                    {drop.isFeatured ? (
                      <span className="badge badge-green">Featured</span>
                    ) : (
                      <span style={{ color: 'var(--admin-muted)', fontSize: 12 }}>—</span>
                    )}
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
                        href={`/admin/drops/${drop.id}/edit`}
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                      >
                        <Pencil size={12} />
                        Edit
                      </Link>

                      <Link
                        href={`/drops/${drop.slug}`}
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe size={12} />
                        View
                      </Link>

                      <button
                        type="button"
                        id={`delete-drop-${drop.id}`}
                        onClick={() => setPendingDelete(drop)}
                        className="btn-danger"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                        title={`Delete ${drop.name}`}
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

      <DeleteDropDialog
        drop={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}
