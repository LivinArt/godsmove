'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Edit2, Trash2, Plus, Package, Loader2 } from 'lucide-react';
import { updateCollection, deleteCollection } from '@/actions/collection.actions';

type CollectionItem = {
  name: string;
  banner?: string | null;
  heroImage?: string | null;
  story?: string | null;
  theme?: string | null;
  productsCount: number;
  products: any[];
};

export function CollectionsTable({ collections }: { collections: CollectionItem[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [editCol, setEditCol] = useState<CollectionItem | null>(null);
  const [deleteCol, setDeleteCol] = useState<CollectionItem | null>(null);
  const [viewProductsCol, setViewProductsCol] = useState<CollectionItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formBanner, setFormBanner] = useState('');
  const [formStory, setFormStory] = useState('');
  const [formTheme, setFormTheme] = useState('Black');

  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.theme && c.theme.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      await updateCollection('', {
        newName: formName.trim(),
        banner: formBanner.trim() || null,
        editorStory: formStory.trim() || null,
        theme: formTheme
      });
      setCreateModalOpen(false);
      setFormName('');
      setFormBanner('');
      setFormStory('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create collection');
    } finally {
      setIsPending(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCol || !formName.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      await updateCollection(editCol.name, {
        newName: formName.trim(),
        banner: formBanner.trim() || null,
        editorStory: formStory.trim() || null,
        theme: formTheme
      });
      setEditCol(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update collection');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCol) return;
    setIsPending(true);
    setError(null);
    try {
      await deleteCollection(deleteCol.name);
      setDeleteCol(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete collection');
    } finally {
      setIsPending(false);
    }
  };

  const openEdit = (col: CollectionItem) => {
    setEditCol(col);
    setFormName(col.name);
    setFormBanner(col.banner || '');
    setFormStory(col.story || '');
    setFormTheme(col.theme || 'Black');
  };

  return (
    <div>
      {/* Search & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <input
          type="text"
          placeholder="Search collections by name or theme..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-input"
          style={{ maxWidth: 360 }}
        />
        <button
          onClick={() => {
            setFormName('');
            setFormBanner('');
            setFormStory('');
            setFormTheme('Black');
            setCreateModalOpen(true);
          }}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} />
          Create Collection
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
              <th>Collection Title</th>
              <th>Theme</th>
              <th>Assigned Products</th>
              <th>Editorial Story</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--admin-muted)' }}>
                  No curated collections found.
                </td>
              </tr>
            ) : (
              filtered.map((col) => (
                <tr key={col.name}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{col.name}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, border: '1px solid var(--admin-border)', color: '#c8a46a', background: 'rgba(200,164,106,0.06)' }}>
                      {col.theme || 'Black'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setViewProductsCol(col)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#c8a46a', fontSize: 12, fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0
                      }}
                    >
                      <Package size={14} />
                      {col.productsCount} {col.productsCount === 1 ? 'Piece' : 'Pieces'}
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--admin-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 260 }}>
                      {col.story || '—'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => openEdit(col)}
                        className="btn-icon"
                        title="Edit Collection"
                        style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', color: '#fff' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCol(col)}
                        className="btn-icon"
                        title="Delete Collection"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <form onSubmit={handleCreate} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: 32, maxWidth: 480, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create New Collection</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <label className="form-label">Collection Title</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="admin-input"
                  placeholder="e.g. Signature Collection"
                />
              </div>
              <div>
                <label className="form-label">Theme Palette</label>
                <select value={formTheme} onChange={(e) => setFormTheme(e.target.value)} className="admin-input admin-select">
                  <option value="Black">Black (Default Luxury)</option>
                  <option value="Ivory">Ivory</option>
                  <option value="Stone">Stone</option>
                  <option value="Monochrome">Monochrome</option>
                </select>
              </div>
              <div>
                <label className="form-label">Banner Image URL (Optional)</label>
                <input
                  type="text"
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  className="admin-input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="form-label">Collection Editorial Story</label>
                <textarea
                  rows={3}
                  value={formStory}
                  onChange={(e) => setFormStory(e.target.value)}
                  className="admin-input admin-textarea"
                  placeholder="Long-form narrative describing this collection..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setCreateModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Create Collection'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT MODAL */}
      {editCol && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <form onSubmit={handleUpdate} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: 32, maxWidth: 480, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edit Collection</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <label className="form-label">Collection Title</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="form-label">Theme Palette</label>
                <select value={formTheme} onChange={(e) => setFormTheme(e.target.value)} className="admin-input admin-select">
                  <option value="Black">Black (Default Luxury)</option>
                  <option value="Ivory">Ivory</option>
                  <option value="Stone">Stone</option>
                  <option value="Monochrome">Monochrome</option>
                </select>
              </div>
              <div>
                <label className="form-label">Banner Image URL</label>
                <input
                  type="text"
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="form-label">Collection Editorial Story</label>
                <textarea
                  rows={3}
                  value={formStory}
                  onChange={(e) => setFormStory(e.target.value)}
                  className="admin-input admin-textarea"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setEditCol(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE MODAL (Safe Disassociation) */}
      {deleteCol && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: 32, maxWidth: 460, width: '100%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delete Collection: {deleteCol.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--admin-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Deleting a collection will <strong>never delete products</strong>. It safely removes the collection association from all {deleteCol.productsCount} assigned products.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setDeleteCol(null)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={isPending} className="btn-primary" style={{ background: '#ef4444', color: '#fff' }}>
                {isPending ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Safe Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PRODUCTS MODAL */}
      {viewProductsCol && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, padding: 32, maxWidth: 540, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#fff', textTransform: 'uppercase' }}>Products in {viewProductsCol.name}</h3>
              <button onClick={() => setViewProductsCol(null)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>Close</button>
            </div>

            {!viewProductsCol.products || viewProductsCol.products.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--admin-muted)', padding: '16px 0' }}>No products assigned to this collection.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewProductsCol.products.map((p) => (
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
