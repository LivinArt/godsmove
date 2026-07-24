'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Edit2, Trash2, Plus, Eye, Loader2, Package, ImageIcon } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory } from '@/actions/product.actions';
import { SingleImageUploader } from '@/app/admin/products/components/SingleImageUploader';

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  position: number;
  imageUrl?: string | null;
  _count?: { products: number };
  products?: { id: string; name: string; slug: string; status: string; isFeatured: boolean }[];
};

export function CategoriesTable({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [editCategory, setEditCategory] = useState<CategoryItem | null>(null);
  const [deleteModalCategory, setDeleteModalCategory] = useState<CategoryItem | null>(null);
  const [viewProductsCategory, setViewProductsCategory] = useState<CategoryItem | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPosition, setFormPosition] = useState(0);
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [reassignCatId, setReassignCatId] = useState('');

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      await createCategory(formName.trim(), formSlug.trim(), Number(formPosition), formImageUrl);
      setCreateModalOpen(false);
      setFormName('');
      setFormSlug('');
      setFormPosition(0);
      setFormImageUrl(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setIsPending(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory || !formName.trim() || !formSlug.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      await updateCategory(editCategory.id, formName.trim(), formSlug.trim(), Number(formPosition), formImageUrl);
      setEditCategory(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalCategory) return;
    setIsPending(true);
    setError(null);
    try {
      await deleteCategory(deleteModalCategory.id, reassignCatId || undefined);
      setDeleteModalCategory(null);
      setReassignCatId('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setIsPending(false);
    }
  };

  const openEdit = (cat: CategoryItem) => {
    setEditCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormPosition(cat.position || 0);
    setFormImageUrl(cat.imageUrl || null);
  };

  return (
    <div>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <input
          type="text"
          placeholder="Search categories by name or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-input"
          style={{ maxWidth: 360 }}
        />
        <button
          onClick={() => {
            setFormName('');
            setFormSlug('');
            setFormPosition(0);
            setFormImageUrl(null);
            setCreateModalOpen(true);
          }}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} />
          Create Category
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, color: '#ef4444', marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Card Media</th>
              <th>Category Name</th>
              <th>URL Slug</th>
              <th>Assigned Products</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--admin-muted)' }}>
                  No categories found.
                </td>
              </tr>
            ) : (
              filtered.map((cat) => {
                const count = cat._count?.products ?? cat.products?.length ?? 0;
                return (
                  <tr key={cat.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--admin-accent)' }}>
                        #{cat.position}
                      </span>
                    </td>
                    <td>
                      {cat.imageUrl ? (
                        <div style={{ width: 44, height: 55, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--admin-border)', background: '#000' }}>
                          <img src={cat.imageUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: 44, height: 55, borderRadius: 4, border: '1px solid rgba(200,164,106,0.3)', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#c8a46a', fontSize: 9, textAlign: 'center', padding: 2 }}>
                          <ImageIcon size={14} style={{ marginBottom: 2, opacity: 0.6 }} />
                          <span>BLACK BG</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{cat.name}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--admin-muted)' }}>
                        /{cat.slug}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setViewProductsCategory(cat)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#c8a46a', fontSize: 12, fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0
                        }}
                      >
                        <Package size={14} />
                        {count} {count === 1 ? 'Product' : 'Products'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          className="btn-icon"
                          title="Edit Category & Media"
                          style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', color: '#fff' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteModalCategory(cat)}
                          className="btn-icon"
                          title="Delete Category"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <form onSubmit={handleCreate} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: 32, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create New Category</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="admin-input"
                  placeholder="e.g. Outerwear"
                />
              </div>
              <div>
                <label className="form-label">URL Handle (Slug)</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="admin-input"
                  placeholder="e.g. outerwear"
                />
              </div>
              <div>
                <label className="form-label">Display Order Index</label>
                <input
                  type="number"
                  value={formPosition}
                  onChange={(e) => setFormPosition(Number(e.target.value))}
                  className="admin-input"
                />
              </div>

              {/* Task 3: Category Card Image Upload */}
              <div>
                <label className="form-label">
                  Category Card Image (Optional)
                  <span style={{ display: 'block', fontSize: '9px', color: 'var(--admin-muted)', textTransform: 'none', marginTop: '2px' }}>
                    If empty, storefront category card displays a premium black placeholder background until uploaded.
                  </span>
                </label>
                <SingleImageUploader
                  label="Category Card Image"
                  value={formImageUrl}
                  onChange={setFormImageUrl}
                  guidance={{
                    orientation: 'Portrait',
                    aspectRatio: '4:5',
                    recommendedDimensions: '1200 × 1500 px',
                    maxFileSize: '10 MB',
                    acceptedFormats: 'JPG, PNG, WEBP'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT MODAL */}
      {editCategory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <form onSubmit={handleUpdate} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: 32, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edit Category & Media</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="form-label">URL Handle (Slug)</label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="form-label">Display Order Index</label>
                <input
                  type="number"
                  value={formPosition}
                  onChange={(e) => setFormPosition(Number(e.target.value))}
                  className="admin-input"
                />
              </div>

              {/* Task 3: Category Card Image Upload, Replace, Delete, Preview */}
              <div>
                <label className="form-label">
                  Category Card Image
                  <span style={{ display: 'block', fontSize: '9px', color: 'var(--admin-muted)', textTransform: 'none', marginTop: '2px' }}>
                    Upload, replace, or delete the category card image. Uses black placeholder if empty.
                  </span>
                </label>
                <SingleImageUploader
                  label="Category Card Image"
                  value={formImageUrl}
                  onChange={setFormImageUrl}
                  guidance={{
                    orientation: 'Portrait',
                    aspectRatio: '4:5',
                    recommendedDimensions: '1200 × 1500 px',
                    maxFileSize: '10 MB',
                    acceptedFormats: 'JPG, PNG, WEBP'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setEditCategory(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE MODAL (Safe Reassignment) */}
      {deleteModalCategory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: 32, maxWidth: 460, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delete Category: {deleteModalCategory.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--admin-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Deleting a category will <strong>never delete products</strong>. Associated products will be safely reassigned to your chosen category.
            </p>

            {categories.filter((c) => c.id !== deleteModalCategory.id).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Reassign Products To</label>
                <select
                  value={reassignCatId}
                  onChange={(e) => setReassignCatId(e.target.value)}
                  className="admin-input admin-select"
                >
                  <option value="">Auto-reassign to first category</option>
                  {categories.filter((c) => c.id !== deleteModalCategory.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setDeleteModalCategory(null)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={isPending} className="btn-primary" style={{ background: '#ef4444', color: '#fff' }}>
                {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Safe Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PRODUCTS MODAL */}
      {viewProductsCategory && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: 32, maxWidth: 540, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#fff', textTransform: 'uppercase' }}>Products in {viewProductsCategory.name}</h3>
              <button onClick={() => setViewProductsCategory(null)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>Close</button>
            </div>

            {!viewProductsCategory.products || viewProductsCategory.products.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--admin-muted)', padding: '16px 0' }}>No products assigned to this category.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewProductsCategory.products.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--admin-surface-2)', borderRadius: 4, border: '1px solid var(--admin-border)' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'block' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--admin-muted)', fontFamily: 'monospace' }}>/{p.slug}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.status === 'ACTIVE' ? '#22c55e' : '#c8a46a', textTransform: 'uppercase' }}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
