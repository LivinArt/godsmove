'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, X, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { deleteDrop } from '@/actions/drop.actions';

interface DropInfo {
  id: string;
  name: string;
  products: { id: string; name: string; status: string }[];
}

interface DeleteDropDialogProps {
  drop: DropInfo | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function DeleteDropDialog({ drop, onClose, onDeleted }: DeleteDropDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const hasProducts = (drop?.products?.length ?? 0) > 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (drop) {
      dialog.showModal();
      setError(null);
      setForceDelete(false);
    } else {
      dialog.close();
    }
  }, [drop]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleDelete = async () => {
    if (!drop || isPending) return;
    if (hasProducts && !forceDelete) {
      setError('You must confirm force delete to remove a drop with associated products.');
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      await deleteDrop(drop.id, forceDelete);
      onDeleted(drop.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Deletion failed. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        margin: 'auto',
        width: '100%',
        maxWidth: 500,
        background: 'var(--admin-surface)',
        border: '1px solid rgba(255,107,107,0.25)',
        borderRadius: 16,
        padding: 0,
        color: 'var(--admin-text)',
        boxShadow: '0 0 0 1px rgba(255,107,107,0.1), 0 24px 64px rgba(0,0,0,0.7)',
        outline: 'none',
      }}
    >
      <style>{`
        ::backdrop { background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); }
      `}</style>

      <div style={{ padding: '28px 28px 0' }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(255,107,107,0.12)',
              border: '1px solid rgba(255,107,107,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} color="var(--admin-danger)" />
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--admin-text)',
                letterSpacing: '-0.02em',
              }}
            >
              Delete Drop
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--admin-muted)', lineHeight: 1.5 }}>
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--admin-muted)',
              borderRadius: 6,
              display: 'flex',
              flexShrink: 0,
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drop name callout */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--admin-surface-2)',
            border: '1px solid var(--admin-border)',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <p
            style={{
              margin: '0 0 4px',
              fontSize: 11,
              color: 'var(--admin-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            Drop to delete
          </p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--admin-text)' }}>
            {drop?.name}
          </p>
        </div>

        {/* Products warning */}
        {hasProducts && (
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(255,204,92,0.06)',
              border: '1px solid rgba(255,204,92,0.2)',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <ShieldAlert size={14} color="var(--admin-warning)" />
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--admin-warning)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {drop?.products.length} associated product
                {(drop?.products.length ?? 0) > 1 ? 's' : ''}
              </p>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--admin-muted)', lineHeight: 1.5 }}>
              These products will be <strong style={{ color: 'var(--admin-text)' }}>disconnected</strong> from this drop
              (not deleted). They will become unassigned products.
            </p>
            <ul
              style={{
                margin: '0 0 12px',
                paddingLeft: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              {drop?.products.slice(0, 5).map((p) => (
                <li key={p.id} style={{ fontSize: 13, color: 'var(--admin-muted)' }}>
                  {p.name}
                </li>
              ))}
              {(drop?.products.length ?? 0) > 5 && (
                <li style={{ fontSize: 12, color: 'var(--admin-muted)', fontStyle: 'italic' }}>
                  …and {(drop?.products.length ?? 0) - 5} more
                </li>
              )}
            </ul>

            {/* Force delete toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                padding: '10px 12px',
                background: forceDelete
                  ? 'rgba(255,107,107,0.08)'
                  : 'var(--admin-surface-2)',
                border: `1px solid ${forceDelete ? 'rgba(255,107,107,0.3)' : 'var(--admin-border)'}`,
                borderRadius: 8,
                transition: 'all 0.15s',
              }}
            >
              <input
                type="checkbox"
                checked={forceDelete}
                onChange={(e) => setForceDelete(e.target.checked)}
                style={{ marginTop: 2, accentColor: 'var(--admin-danger)', width: 14, height: 14 }}
              />
              <span style={{ fontSize: 13, color: 'var(--admin-text)', lineHeight: 1.4 }}>
                I understand — disconnect all products and permanently delete this drop
              </span>
            </label>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '20px 28px 24px',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          borderTop: '1px solid var(--admin-border)',
          marginTop: 20,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="btn-secondary"
          style={{ padding: '8px 20px', fontSize: 13 }}
        >
          Cancel
        </button>
        <button
          type="button"
          id={`delete-drop-confirm-${drop?.id}`}
          onClick={handleDelete}
          disabled={isPending || (hasProducts && !forceDelete)}
          className="btn-danger"
          style={{
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 700,
            opacity: hasProducts && !forceDelete ? 0.45 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Deleting…
            </>
          ) : (
            <>
              <Trash2 size={14} />
              Delete Drop
            </>
          )}
        </button>
      </div>
    </dialog>
  );
}
