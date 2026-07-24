'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { deleteProduct } from '@/actions/product.actions';

interface DeleteProductModalProps {
  product: { id: string; name: string; slug: string } | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export function DeleteProductModal({ product, onClose, onDeleted }: DeleteProductModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open / close native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (product) {
      dialog.showModal();
      setError(null);
    } else {
      dialog.close();
    }
  }, [product]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleDelete = async () => {
    if (!product || isPending) return;
    setIsPending(true);
    setError(null);
    try {
      await deleteProduct(product.id);
      onDeleted(product.id);
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
        maxWidth: '480px',
        background: 'var(--admin-surface)',
        border: '1px solid rgba(255,107,107,0.25)',
        borderRadius: '16px',
        padding: 0,
        color: 'var(--admin-text)',
        boxShadow: '0 0 0 1px rgba(255,107,107,0.1), 0 24px 64px rgba(0,0,0,0.7)',
        outline: 'none',
      }}
    >
      {/* Dialog backdrop */}
      <style>{`
        ::backdrop {
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
        }
      `}</style>

      <div style={{ padding: '28px 28px 0' }}>
        {/* Icon + Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
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
              Delete Product
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
              padding: '4px',
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

        {/* Product name callout */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--admin-surface-2)',
            border: '1px solid var(--admin-border)',
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>
            Product to delete
          </p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>
            {product?.name}
          </p>
        </div>

        {/* Consequence list */}
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(255,107,107,0.05)',
            border: '1px solid rgba(255,107,107,0.15)',
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--admin-danger)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            This will permanently remove:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              'Product images (database + Supabase Storage)',
              'All variants and size configurations',
              'Inventory records and stock history',
              'SEO metadata and tags',
              'Wishlist associations',
            ].map((item) => (
              <li key={item} style={{ fontSize: 13, color: 'var(--admin-muted)', lineHeight: 1.4 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Error state */}
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
          marginTop: 4,
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
          disabled={isPending}
          className="btn-danger"
          id={`delete-product-confirm-${product?.id}`}
          style={{
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 700,
            background: isPending ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.15)',
            boxShadow: isPending ? 'none' : '0 0 0 1px rgba(255,107,107,0.3)',
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
              Delete Product
            </>
          )}
        </button>
      </div>
    </dialog>
  );
}
