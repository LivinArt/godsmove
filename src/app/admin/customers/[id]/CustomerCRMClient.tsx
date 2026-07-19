'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  saveAdminCustomerNotes,
  adjustCustomerWallet,
  updateCustomerSecurity,
  adminAddressCrud,
} from '@/actions/admin-customer.actions';

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

interface OrderItem {
  id: string;
  productName: string;
  productSlug: string;
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  shippingAddress: any;
  billingAddress: any;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  walletCredit: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  trackingNumber: string | null;
  carrier: string | null;
  createdAt: string;
  items: OrderItem[];
  returnRequests: any[];
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

interface Wallet {
  id: string;
  balance: number;
  currency: string;
  transactions: Transaction[];
}

interface Wishlist {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    frontImageUrl: string | null;
  };
  createdAt: string;
}

interface ReturnReq {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  reason: string;
  refundAmount: number;
  createdAt: string;
}

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
}

interface CustomerDetail {
  id: string;
  email: string;
  godsmoveId: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  adminNotes: string | null;
  emailConfirmed: boolean;
  lastLogin: string | null;
  loginMethod: string;
  isBlocked: boolean;
  addresses: Address[];
  orders: Order[];
  wallet: Wallet | null;
  wishlist: Wishlist[];
  returns: ReturnReq[];
  timeline: TimelineItem[];
}

export default function CustomerCRMClient({
  customer,
}: {
  customer: CustomerDetail;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'notes' | 'addresses' | 'orders' | 'credits' | 'wishlist' | 'security'>('notes');

  // Notes state
  const [notes, setNotes] = useState(customer.adminNotes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);

  // Address CRUD Modal state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null);
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    line1: '',
    line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  // Wallet adjustment state
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('CREDIT_ADJUSTMENT');
  const [adjustmentDesc, setAdjustmentDesc] = useState('');
  const [adjustingWallet, setAdjustingWallet] = useState(false);

  // Security action state
  const [securityLoading, setSecurityLoading] = useState(false);

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  // Save Notes handler
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await saveAdminCustomerNotes(customer.id, notes);
      alert('Internal notes updated successfully.');
    } catch (e: any) {
      alert(e.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Wallet adjustment handler
  const handleWalletAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(adjustmentAmount);
    if (isNaN(amt) || amt === 0) {
      alert('Please enter a valid non-zero adjustment amount.');
      return;
    }

    setAdjustingWallet(true);
    try {
      await adjustCustomerWallet(customer.id, amt, adjustmentType, adjustmentDesc);
      alert('Wallet adjustment successfully logged.');
      setAdjustmentAmount('');
      setAdjustmentDesc('');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust balance.');
    } finally {
      setAdjustingWallet(false);
    }
  };

  // Address CRUD handler
  const handleAddressAction = async (action: 'add' | 'edit' | 'delete' | 'default', id?: string) => {
    if (action === 'delete' && !confirm('Are you sure you want to delete this address?')) return;

    try {
      if (action === 'default') {
        await adminAddressCrud('default', { profileId: customer.id, addressId: id });
      } else if (action === 'delete') {
        await adminAddressCrud('delete', { profileId: customer.id, addressId: id });
      } else if (action === 'add') {
        await adminAddressCrud('add', {
          profileId: customer.id,
          ...addressForm,
        });
        setAddressModalOpen(false);
      } else if (action === 'edit') {
        await adminAddressCrud('edit', {
          profileId: customer.id,
          addressId: editingAddress?.id,
          ...addressForm,
        });
        setAddressModalOpen(false);
      }
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Address update failed');
    }
  };

  // Security action handler
  const handleSecurityAction = async (action: 'block' | 'unblock' | 'logout' | 'delete') => {
    const confirmationMsg =
      action === 'delete'
        ? 'WARNING: This will permanently delete the customer account and cascade delete all their profiles, order assignments, and transactions. Continue?'
        : `Are you sure you want to trigger "${action}" on this account?`;

    if (!confirm(confirmationMsg)) return;

    setSecurityLoading(true);
    try {
      await updateCustomerSecurity(customer.id, action);
      alert(`Account action "${action}" completed.`);
      if (action === 'delete') {
        router.push('/admin/customers');
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || 'Security action failed.');
    } finally {
      setSecurityLoading(false);
    }
  };

  const openAddressModal = (addr: Address | null) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        firstName: addr.firstName,
        lastName: addr.lastName,
        line1: addr.line1,
        line2: addr.line2 || '',
        landmark: addr.landmark || '',
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        phone: addr.phone,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        firstName: '',
        lastName: '',
        line1: '',
        line2: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
      });
    }
    setAddressModalOpen(true);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
      {/* LEFT COLUMN: Identity Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Link href="/admin/customers" className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: 12 }}>
          ← Back to Customers
        </Link>

        <div className="admin-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', marginBottom: 20 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--admin-surface-2)',
                border: '1px solid var(--admin-border-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--admin-accent)',
              }}
            >
              {(customer.firstName?.[0] || customer.email[0]).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {customer.firstName || customer.lastName
                  ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
                  : 'Unnamed Customer'}
              </h2>
              {customer.godsmoveId && (
                <span className="mono" style={{ fontSize: 11, background: 'var(--admin-surface-2)', padding: '2px 6px', borderRadius: 4, color: 'var(--admin-accent)', border: '1px solid var(--admin-border)', display: 'inline-block', marginTop: 4 }}>
                  {customer.godsmoveId}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--admin-border)', paddingTop: 16, fontSize: 13 }}>
            <div>
              <span style={{ color: 'var(--admin-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Email Address</span>
              <span style={{ wordBreak: 'break-all' }}>{customer.email}</span>
            </div>
            <div>
              <span style={{ color: 'var(--admin-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Phone</span>
              <span>{customer.phone || 'Not provided'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--admin-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Verification Status</span>
              {customer.emailConfirmed ? (
                <span className="badge badge-blue">Verified</span>
              ) : (
                <span className="badge badge-grey">Unverified</span>
              )}
            </div>
            <div>
              <span style={{ color: 'var(--admin-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Account Status</span>
              {customer.isBlocked ? (
                <span className="badge badge-red">Blocked</span>
              ) : (
                <span className="badge badge-green">Active</span>
              )}
            </div>
            <div>
              <span style={{ color: 'var(--admin-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Joined Date</span>
              <span>{formatDate(customer.createdAt)}</span>
            </div>
            <div>
              <span style={{ color: 'var(--admin-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Last Login</span>
              <span>{customer.lastLogin ? formatDate(customer.lastLogin) : 'Never logged in'}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Sidebar navigation */}
        <div className="admin-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(
            [
              { key: 'notes', label: 'Notes & Timeline' },
              { key: 'addresses', label: `Address Book (${customer.addresses.length})` },
              { key: 'orders', label: `Order Logs (${customer.orders.length})` },
              { key: 'credits', label: `Credits Ledger (${formatINR(customer.wallet?.balance ?? 0)})` },
              { key: 'wishlist', label: `Curated Wishlist (${customer.wishlist.length})` },
              { key: 'security', label: 'Security & Access' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'left',
                border: 'none',
                background: activeTab === tab.key ? 'var(--admin-accent-dim)' : 'none',
                color: activeTab === tab.key ? 'var(--admin-accent)' : 'var(--admin-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Tab Panel Detail views */}
      <div className="admin-card" style={{ minHeight: 480, padding: 32 }}>
        {/* TAB 1: General & Timeline */}
        {activeTab === 'notes' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>Internal Staff Notes</h3>
            <div style={{ marginBottom: 32 }}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log internal details, client interactions, operations feedback, or notes on this customer profile..."
                style={{
                  width: '100%',
                  height: 120,
                  padding: 14,
                  borderRadius: 8,
                  background: 'var(--admin-surface-2)',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                  resize: 'vertical',
                  marginBottom: 12,
                }}
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="btn-primary"
              >
                {savingNotes ? 'Saving...' : 'Update Notes'}
              </button>
            </div>

            <h3 style={{ marginBottom: 20, fontSize: 16 }}>Customer Activity Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {customer.timeline.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: 16,
                    paddingBottom: 16,
                    borderBottom: '1px solid var(--admin-border)',
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background:
                        item.type === 'order'
                          ? 'var(--admin-accent)'
                          : item.type === 'credit'
                            ? 'var(--admin-info)'
                            : item.type === 'return'
                              ? 'var(--admin-warning)'
                              : 'var(--admin-muted)',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 2 }}>{item.description}</div>
                    <div style={{ fontSize: 10, color: 'var(--admin-muted)', marginTop: 4 }}>{formatDate(item.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Address Book */}
        {activeTab === 'addresses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Saved Addresses</h3>
              <button onClick={() => openAddressModal(null)} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
                + Add Address
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {customer.addresses.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--admin-muted)', padding: 32 }}>
                  No saved addresses found.
                </div>
              ) : (
                customer.addresses.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: 'var(--admin-surface-2)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: 10,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700 }}>
                          {a.firstName} {a.lastName}
                        </span>
                        {a.isDefault && <span className="badge badge-green">Default</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--admin-muted)', lineHeight: 1.5 }}>
                        <div>{a.line1}</div>
                        {a.line2 && <div>{a.line2}</div>}
                        {a.landmark && <div style={{ fontStyle: 'italic', opacity: 0.8 }}>Landmark: {a.landmark}</div>}
                        <div>
                          {a.city}, {a.state} - {a.pincode}
                        </div>
                        <div style={{ marginTop: 6 }}>Phone: {a.phone}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--admin-border)', paddingTop: 12 }}>
                      <button onClick={() => openAddressModal(a)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11, flex: 1 }}>
                        Edit
                      </button>
                      {!a.isDefault && (
                        <button onClick={() => handleAddressAction('default', a.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11, flex: 1 }}>
                          Set Default
                        </button>
                      )}
                      <button onClick={() => handleAddressAction('delete', a.id)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11, color: 'var(--admin-danger)' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Order History */}
        {activeTab === 'orders' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>Placed Orders</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {customer.orders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: 32 }}>No orders placed.</div>
              ) : (
                customer.orders.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      border: '1px solid var(--admin-border)',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        background: 'var(--admin-surface-2)',
                        padding: '12px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                        borderBottom: '1px solid var(--admin-border)',
                      }}
                    >
                      <div>
                        <span className="mono" style={{ color: 'var(--admin-accent)', fontWeight: 700, fontSize: 14 }}>
                          #{o.orderNumber}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--admin-muted)', marginLeft: 12 }}>
                          {formatDate(o.createdAt)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span className="badge badge-grey">{o.paymentMethod}</span>
                        <span className={`badge ${o.paymentStatus === 'PAID' ? 'badge-green' : 'badge-yellow'}`}>
                          {o.paymentStatus}
                        </span>
                        <span className={`badge ${o.status === 'DELIVERED' ? 'badge-green' : 'badge-blue'}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: 20 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                            <th style={{ textAlign: 'left', paddingBottom: 8, color: 'var(--admin-muted)' }}>Item</th>
                            <th style={{ textAlign: 'center', paddingBottom: 8, color: 'var(--admin-muted)' }}>Quantity</th>
                            <th style={{ textAlign: 'right', paddingBottom: 8, color: 'var(--admin-muted)' }}>Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((i) => (
                            <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                              <td style={{ padding: '8px 0' }}>
                                <span style={{ fontWeight: 600 }}>{i.productName}</span> ({i.size})
                              </td>
                              <td style={{ textAlign: 'center', padding: '8px 0' }}>×{i.quantity}</td>
                              <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600 }}>
                                {formatINR(i.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 24, alignItems: 'start' }}>
                        {/* Address info */}
                        <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                          <div>
                            <strong>Shipping Address:</strong> {o.shippingAddress?.firstName} {o.shippingAddress?.lastName},{' '}
                            {o.shippingAddress?.line1}
                            {o.shippingAddress?.line2 && `, ${o.shippingAddress.line2}`}
                            {o.shippingAddress?.landmark && `, Near ${o.shippingAddress.landmark}`}
                            , {o.shippingAddress?.city}, {o.shippingAddress?.state} - {o.shippingAddress?.pincode}
                          </div>
                          {o.trackingNumber && (
                            <div style={{ marginTop: 8 }}>
                              <strong>Tracking:</strong> {o.carrier} -{' '}
                              <span className="mono" style={{ color: 'var(--admin-accent)' }}>
                                {o.trackingNumber}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Totals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Subtotal:</span>
                            <span>{formatINR(o.subtotal)}</span>
                          </div>
                          {o.discountAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-danger)' }}>
                              <span>Discount:</span>
                              <span>-{formatINR(o.discountAmount)}</span>
                            </div>
                          )}
                          {o.walletCredit > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-info)' }}>
                              <span>Credits Used:</span>
                              <span>-{formatINR(o.walletCredit)}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--admin-border)', paddingTop: 6, fontSize: 14 }}>
                            <span>Total:</span>
                            <span style={{ color: 'var(--admin-accent)' }}>{formatINR(o.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Store Credits */}
        {activeTab === 'credits' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
              {/* Ledger Entries */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>Credits Transaction Ledger</h3>
                <div className="admin-table-wrap">
                  <table className="admin-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!customer.wallet?.transactions || customer.wallet.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-muted)' }}>
                            No credits logs found.
                          </td>
                        </tr>
                      ) : (
                        customer.wallet.transactions.map((t) => (
                          <tr key={t.id}>
                            <td style={{ color: 'var(--admin-muted)' }}>{formatDate(t.createdAt)}</td>
                            <td>
                              <span style={{ fontSize: 10, fontWeight: 700 }}>{t.type.replace('CREDIT_', '').replace('DEBIT_', '')}</span>
                            </td>
                            <td>{t.description || 'Manual correction'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: t.amount > 0 ? 'var(--admin-accent)' : 'var(--admin-danger)' }}>
                              {t.amount > 0 ? `+` : ''}
                              {formatINR(t.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Adjust Balance Sidebar */}
              <div className="admin-card" style={{ background: 'var(--admin-surface-2)' }}>
                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15 }}>Adjust Balance</h3>
                <form onSubmit={handleWalletAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)', marginBottom: 6 }}>
                      Amount (Positive to Credit, Negative to Debit)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 500 or -250"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'var(--admin-surface)',
                        border: '1px solid var(--admin-border)',
                        color: 'var(--admin-text)',
                        fontSize: 13,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)', marginBottom: 6 }}>
                      Adjustment Reason Type
                    </label>
                    <select
                      value={adjustmentType}
                      onChange={(e) => setAdjustmentType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'var(--admin-surface)',
                        border: '1px solid var(--admin-border)',
                        color: 'var(--admin-text)',
                        fontSize: 13,
                      }}
                    >
                      <option value="CREDIT_ADJUSTMENT">Adjustment (Credit/Debit)</option>
                      <option value="CREDIT_PROMOTIONAL">Gift / Promotional Credit</option>
                      <option value="CREDIT_RETURN">Exchanges / Return Refund</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)', marginBottom: 6 }}>
                      Log Description / Reference
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSR refund adjustment, promotion campaign"
                      value={adjustmentDesc}
                      onChange={(e) => setAdjustmentDesc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'var(--admin-surface)',
                        border: '1px solid var(--admin-border)',
                        color: 'var(--admin-text)',
                        fontSize: 13,
                      }}
                    />
                  </div>

                  <button type="submit" disabled={adjustingWallet} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {adjustingWallet ? 'Adjusting...' : 'Log Transaction'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Wishlist & Returns */}
        {activeTab === 'wishlist' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>Curated Wishlist</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
              {customer.wishlist.length === 0 ? (
                <div style={{ gridColumn: '1/-1', color: 'var(--admin-muted)', padding: 16 }}>No items saved to wishlist.</div>
              ) : (
                customer.wishlist.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      background: 'var(--admin-surface-2)',
                      border: '1px solid var(--admin-border)',
                      borderRadius: 10,
                      padding: 12,
                      textAlign: 'center',
                    }}
                  >
                    {w.product.frontImageUrl ? (
                      <img
                        src={w.product.frontImageUrl}
                        alt={w.product.name}
                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: 120, background: 'var(--admin-surface)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-muted)', fontSize: 11, marginBottom: 8 }}>
                        No Image
                      </div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{w.product.name}</div>
                  </div>
                ))
              )}
            </div>

            <h3 style={{ marginBottom: 20, fontSize: 16 }}>Return Requests History</h3>
            <div className="admin-table-wrap">
              <table className="admin-table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Order #</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Amount Refund</th>
                    <th>Status</th>
                    <th>Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.returns.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-muted)' }}>
                        No return requests found.
                      </td>
                    </tr>
                  ) : (
                    customer.returns.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="mono" style={{ color: 'var(--admin-accent)' }}>{r.id}</span>
                        </td>
                        <td>
                          <span className="mono">#{r.orderNumber}</span>
                        </td>
                        <td>{r.type}</td>
                        <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{r.reason}</td>
                        <td style={{ fontWeight: 600 }}>{formatINR(r.refundAmount)}</td>
                        <td>
                          <span className={`badge ${r.status === 'APPROVED' ? 'badge-green' : r.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--admin-muted)' }}>{formatDate(r.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: Security & Access */}
        {activeTab === 'security' && (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>Authentication & Customer Security</h3>
            <p style={{ fontSize: 13, color: 'var(--admin-muted)', lineHeight: 1.5, marginBottom: 24 }}>
              These security operations invoke Supabase Admin triggers directly to block authentication sessions, force logouts, or remove database profiles.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
              {/* Ban/Unban */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Block / Disable Account</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 2 }}>Prevents future OTP dispatches or sign-in code access</div>
                </div>
                {customer.isBlocked ? (
                  <button onClick={() => handleSecurityAction('unblock')} disabled={securityLoading} className="btn-primary" style={{ background: 'var(--admin-accent)', color: '#0a0a0a', padding: '6px 12px', fontSize: 12 }}>
                    Unblock User
                  </button>
                ) : (
                  <button onClick={() => handleSecurityAction('block')} disabled={securityLoading} className="btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}>
                    Block Customer
                  </button>
                )}
              </div>

              {/* Force Logout */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Force Session Termination</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 2 }}>Invalidates and signs out all active browser session JWTs</div>
                </div>
                <button onClick={() => handleSecurityAction('logout')} disabled={securityLoading} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                  Force Sign Out
                </button>
              </div>

              {/* Delete Account */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--admin-danger)' }}>Delete Account Permanently</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 2 }}>Deletes the database rows and removes auth record permanently</div>
                </div>
                <button onClick={() => handleSecurityAction('delete')} disabled={securityLoading} className="btn-danger" style={{ background: 'rgba(255,107,107,0.1)', color: 'var(--admin-danger)', border: '1px solid rgba(255,107,107,0.2)', padding: '6px 12px', fontSize: 12 }}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Form Dialog Modal overlay */}
      {addressModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="admin-card"
            style={{
              width: 500,
              padding: 32,
              background: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16 }}>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 4 }}>First Name</label>
                <input
                  type="text"
                  value={addressForm.firstName}
                  onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 4 }}>Last Name</label>
                <input
                  type="text"
                  value={addressForm.lastName}
                  onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 4 }}>Address Line 1</label>
              <input
                type="text"
                value={addressForm.line1}
                onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 4 }}>Address Line 2 (Optional)</label>
              <input
                type="text"
                value={addressForm.line2}
                onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 4 }}>Landmark (Optional)</label>
              <input
                type="text"
                value={addressForm.landmark}
                onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 4 }}>City</label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 4 }}>State</label>
                <input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 4 }}>Pincode</label>
                <input
                  type="text"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--admin-muted)', marginBottom: 4 }}>Phone</label>
              <input
                type="text"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setAddressModalOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => handleAddressAction(editingAddress ? 'edit' : 'add')}
                className="btn-primary"
              >
                {editingAddress ? 'Save Changes' : 'Create Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
