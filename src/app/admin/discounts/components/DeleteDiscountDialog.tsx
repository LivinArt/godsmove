'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { deleteDiscount } from '@/actions/discount.actions';

interface DiscountInfo {
  id: string;
  code: string;
  usageCount: number;
}

interface DeleteDiscountDialogProps {
  discount: DiscountInfo | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function DeleteDiscountDialog({ discount, onClose, onDeleted }: DeleteDiscountDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (discount) {
      dialog.showModal();
      setError(null);
    } else {
      dialog.close();
    }
  }, [discount]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleDelete = async () => {
    if (!discount || isPending) return;

    if (discount.usageCount > 0) {
      setError(`Cannot delete. This discount has been used ${discount.usageCount} times. Archive it instead.`);
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      await deleteDiscount(discount.id);
      onDeleted(discount.id);
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
              Delete Discount
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

        {/* Discount callout */}
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
            Discount to delete
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: 'var(--admin-mono)', color: 'var(--admin-text)' }}>
            {discount?.code}
          </p>
        </div>

        {/* Usage warning */}
        {(discount?.usageCount ?? 0) > 0 && (
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(255,107,107,0.06)',
              border: '1px solid rgba(255,107,107,0.2)',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-danger)', fontWeight: 600 }}>
              Action blocked: This discount has been used {discount?.usageCount} times.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>
              To preserve order history, you cannot delete a discount that has already been applied to an order. Please edit the discount and change its status to Archived instead.
            </p>
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
          onClick={handleDelete}
          disabled={isPending || (discount?.usageCount ?? 0) > 0}
          className="btn-danger"
          style={{
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 700,
            opacity: (discount?.usageCount ?? 0) > 0 ? 0.45 : 1,
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
              Delete Discount
            </>
          )}
        </button>
      </div>
    </dialog>
  );
}
