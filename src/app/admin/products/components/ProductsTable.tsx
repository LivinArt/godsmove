'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { DeleteProductModal } from './DeleteProductModal';

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  channel: string;
  images: { isCover: boolean; url: string }[];
  category: { name: string };
  drop: { name: string } | null;
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
  return product.variants.reduce((sum, v) => {
    const inv = v.inventory;
    if (!inv) return sum;
    return sum + inv.totalStock - inv.soldStock - inv.reservedStock;
  }, 0);
}

export function ProductsTable({ products: initialProducts }: ProductsTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; slug: string } | null>(null);

  const handleDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  if (products.length === 0) {
    return (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <tbody>
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: 60, color: 'var(--admin-muted)' }}>
                No products found matching your criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Category</th>
              <th>Drop</th>
              <th>Status</th>
              <th>Stock</th>
              <th>Variants</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = availableStock(p);
              const isLow = stock <= 5 && stock > 0;
              const coverImg = p.images.find((i) => i.isCover)?.url || p.images[0]?.url;

              return (
                <tr key={p.id}>
                  <td style={{ width: 60 }}>
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
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--admin-muted)', fontFamily: 'var(--admin-mono)' }}>
                      {p.slug} • {p.channel}
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{p.category.name}</td>
                  <td style={{ fontSize: 13, color: 'var(--admin-muted)' }}>{p.drop?.name ?? '—'}</td>
                  <td>
                    <span className={STATUS_CLASS[p.status] ?? 'badge badge-grey'}>{p.status}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: 13,
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
                      {isLow && <span style={{ marginLeft: 4, fontSize: 10 }}>LOW</span>}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--admin-muted)' }}>{p.variants.length} sizes</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        id={`delete-product-${p.id}`}
                        onClick={() => setPendingDelete({ id: p.id, name: p.name, slug: p.slug })}
                        className="btn-danger"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                        title={`Delete ${p.name}`}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                      <Link
                        href={`/product/${p.slug}`}
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                        target="_blank"
                      >
                        Preview
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DeleteProductModal
        product={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}
