'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  ArrowLeft,
  Loader2,
  Info,
  Search,
  Tag,
  Settings2,
  Calendar,
  Users,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { UpsertDiscountSchema } from '@/lib/validations/discount';
import { createDiscount, updateDiscount } from '@/actions/discount.actions';

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface DiscountFormProps {
  initialData?: any;
  allProducts: ProductOption[];
}

function toDatetimeLocal(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function toISOString(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

export function DiscountForm({ initialData, allProducts }: DiscountFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const [name, setName] = useState(initialData?.name ?? '');
  const [code, setCode] = useState(initialData?.code ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [type, setType] = useState(initialData?.type ?? 'PERCENTAGE');
  const [value, setValue] = useState(initialData?.value != null ? String(initialData.value) : '');
  const [status, setStatus] = useState(initialData?.status ?? 'DRAFT');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(initialData?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initialData?.endsAt ?? null));
  
  const [minimumOrderValue, setMinimumOrderValue] = useState(initialData?.minimumOrderValue != null ? String(initialData.minimumOrderValue) : '');
  const [maximumDiscount, setMaximumDiscount] = useState(initialData?.maximumDiscount != null ? String(initialData.maximumDiscount) : '');
  const [usageLimit, setUsageLimit] = useState(initialData?.usageLimit != null ? String(initialData.usageLimit) : '');
  const [perCustomerLimit, setPerCustomerLimit] = useState(initialData?.perCustomerLimit != null ? String(initialData.perCustomerLimit) : '1');
  
  const [appliesToAll, setAppliesToAll] = useState(initialData?.appliesToAll ?? true);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(initialData?.products?.map((p: any) => p.id) ?? [])
  );

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [allProducts, productSearch]);

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const payload = {
        id: initialData?.id,
        name,
        code,
        description: description || null,
        type,
        value: type === 'FREE_SHIPPING' ? 0 : parseFloat(value),
        status,
        isActive,
        startsAt: toISOString(startsAt),
        endsAt: toISOString(endsAt),
        minimumOrderValue: minimumOrderValue ? parseFloat(minimumOrderValue) : null,
        maximumDiscount: maximumDiscount && type === 'PERCENTAGE' ? parseFloat(maximumDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        perCustomerLimit: parseInt(perCustomerLimit, 10) || 1,
        appliesToAll,
        productIds: Array.from(selectedProductIds),
      };

      const validated = UpsertDiscountSchema.parse(payload);

      if (initialData?.id) {
        await updateDiscount({ ...validated, id: initialData.id });
      } else {
        await createDiscount(validated);
      }

      router.push('/admin/discounts');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      if (err?.errors) {
        setError(err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(' · '));
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ paddingBottom: 80 }}>
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div
        className="page-header"
        style={{
          position: 'sticky',
          top: 16,
          zIndex: 10,
          background: 'var(--admin-surface)',
          padding: '16px 24px',
          borderRadius: 12,
          border: '1px solid var(--admin-border)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link
            href="/admin/discounts"
            className="btn-secondary"
            style={{ padding: 8, border: 'none', background: 'transparent' }}
          >
            <ArrowLeft style={{ width: 20, height: 20 }} />
          </Link>
          <h1 className="page-title" style={{ margin: 0 }}>
            {initialData ? 'Edit Discount' : 'New Discount'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="admin-input admin-select"
            style={{ width: 'auto', padding: '8px 36px 8px 12px' }}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="EXPIRED">Expired</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isPending ? 'Saving…' : 'Save Discount'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <Info size={16} style={{ marginTop: 2 }} />
          <div>{error}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* ── Main column ───────────────────────────────────────────────────── */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Basic Info */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 20 }}>
              <Tag size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Basic Information
            </h2>
            <div className="form-row" style={{ marginBottom: 20 }}>
              <div>
                <label className="form-label">Discount Code *</label>
                <input
                  value={code}
                  onChange={handleCodeChange}
                  required
                  placeholder="e.g. VIP25"
                  className="admin-input"
                  style={{ fontFamily: 'var(--admin-mono)', textTransform: 'uppercase' }}
                  maxLength={50}
                />
                <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 4 }}>
                  Customers will enter this code at checkout.
                </div>
              </div>
              <div>
                <label className="form-label">Internal Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Summer VIP Campaign"
                  className="admin-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Internal notes about this discount..."
                className="admin-input admin-textarea"
                rows={2}
              />
            </div>
          </section>

          {/* Configuration */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 20 }}>
              <Settings2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Configuration
            </h2>
            <div className="form-row" style={{ marginBottom: 20 }}>
              <div>
                <label className="form-label">Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="admin-input admin-select"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed Amount</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
              </div>
              {type !== 'FREE_SHIPPING' && (
                <div>
                  <label className="form-label">Value *</label>
                  <div style={{ position: 'relative' }}>
                    {type === 'FIXED_AMOUNT' && (
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }}>₹</span>
                    )}
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                      min={0}
                      max={type === 'PERCENTAGE' ? 100 : undefined}
                      step={type === 'PERCENTAGE' ? 1 : 0.01}
                      placeholder={type === 'PERCENTAGE' ? '25' : '1000'}
                      className="admin-input"
                      style={{
                        paddingLeft: type === 'FIXED_AMOUNT' ? 24 : 12,
                        paddingRight: type === 'PERCENTAGE' ? 28 : 12,
                      }}
                    />
                    {type === 'PERCENTAGE' && (
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }}>%</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Product Assignment */}
          <section className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>
                <Package size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                Product Eligibility
              </h2>
            </div>
            
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={appliesToAll}
                  onChange={() => setAppliesToAll(true)}
                  style={{ accentColor: 'var(--admin-accent)', width: 16, height: 16 }}
                />
                <span style={{ fontSize: 14 }}>All Products</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={!appliesToAll}
                  onChange={() => setAppliesToAll(false)}
                  style={{ accentColor: 'var(--admin-accent)', width: 16, height: 16 }}
                />
                <span style={{ fontSize: 14 }}>Specific Products</span>
              </label>
            </div>

            {!appliesToAll && (
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--admin-muted)' }}>
                    {selectedProductIds.size} selected
                  </span>
                  {selectedProductIds.size > 0 && (
                    <button type="button" onClick={() => setSelectedProductIds(new Set())} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}>
                      Clear
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }} />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="admin-input"
                    style={{ paddingLeft: 34 }}
                  />
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                  {filteredProducts.map((p, i) => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i === filteredProducts.length - 1 ? 'none' : '1px solid var(--admin-border)', cursor: 'pointer', background: selectedProductIds.has(p.id) ? 'var(--admin-accent-dim)' : 'transparent' }}>
                      <input type="checkbox" checked={selectedProductIds.has(p.id)} onChange={() => toggleProduct(p.id)} style={{ accentColor: 'var(--admin-accent)', width: 15, height: 15 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: selectedProductIds.has(p.id) ? 600 : 400 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{p.slug}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Schedule */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 20 }}>
              <Calendar size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Schedule
            </h2>
            <div className="form-group">
              <label className="form-label">Starts At</label>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="admin-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Ends At</label>
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="admin-input" />
              <div style={{ fontSize: 11, color: 'var(--admin-muted)', marginTop: 4 }}>Leave blank if it never expires.</div>
            </div>
          </section>

          {/* Rules */}
          <section className="admin-card">
            <h2 style={{ fontSize: 16, marginBottom: 20 }}>
              <Users size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Limits & Rules
            </h2>
            <div className="form-group">
              <label className="form-label">Minimum Order Value (₹)</label>
              <input type="number" value={minimumOrderValue} onChange={(e) => setMinimumOrderValue(e.target.value)} placeholder="0.00" min={0} step={0.01} className="admin-input" />
            </div>
            {type === 'PERCENTAGE' && (
              <div className="form-group">
                <label className="form-label">Maximum Discount (₹)</label>
                <input type="number" value={maximumDiscount} onChange={(e) => setMaximumDiscount(e.target.value)} placeholder="Unlimited" min={0} step={0.01} className="admin-input" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Total Usage Limit</label>
              <input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" min={1} className="admin-input" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Per Customer Limit</label>
              <input type="number" value={perCustomerLimit} onChange={(e) => setPerCustomerLimit(e.target.value)} required min={1} className="admin-input" />
            </div>
          </section>

          {/* Activation */}
          <section className="admin-card">
            <label style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--admin-accent)' }}
              />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text)' }}>
                Discount Active
              </div>
            </label>
            <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 8, lineHeight: 1.4 }}>
              If unchecked, this discount cannot be used regardless of schedule.
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
