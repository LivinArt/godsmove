'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateOrderStatus,
  assignOrderCourier,
} from '@/actions/admin-operations.actions';

interface OrderItem {
  id: string;
  productName: string;
  variantId: string;
  size: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrderDetail {
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
  paidAt: string | null;
  fulfilledAt: string | null;
  profile: {
    firstName: string | null;
    lastName: string | null;
    godsmoveId: string | null;
  } | null;
  items: OrderItem[];
  returnRequests: any[];
}

export default function OrderCRMClient({
  order,
}: {
  order: OrderDetail;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [codConfirmOpen, setCodConfirmOpen] = useState(false);

  const [carrier, setCarrier] = useState(order.carrier ?? 'Shiprocket');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '');

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const handleStatusTransition = async (status: string) => {
    setLoading(true);
    try {
      await updateOrderStatus(order.id, status);
      alert(`✓ Order status updated to: ${status}`);
      router.refresh();
    } catch (e: any) {
      alert(`⚠ ${e.message || 'Workflow transition failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCodComplete = async () => {
    setCodConfirmOpen(false);
    setLoading(true);
    try {
      await updateOrderStatus(order.id, 'COMPLETED');
      alert('✓ Order completed. COD payment marked as collected.');
      router.refresh();
    } catch (e: any) {
      alert(`⚠ ${e.message || 'Could not complete order.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCourierAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber) { alert('Please enter a tracking number.'); return; }
    setLoading(true);
    try {
      await assignOrderCourier(order.id, carrier, trackingNumber);
      alert('✓ Courier shipment details updated. Order is now In Transit.');
      router.refresh();
    } catch (e: any) {
      alert(`⚠ ${e.message || 'Courier assignment failed.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTally = () => {
    const { AccountingService } = require('@/lib/accounting-service');
    const ledger = AccountingService.compileOrderLedger(order);
    const blob = new Blob([ledger.xmlPayload], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tally_voucher_${order.orderNumber}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportZoho = () => {
    const { AccountingService } = require('@/lib/accounting-service');
    const ledger = AccountingService.compileOrderLedger(order);
    const blob = new Blob([ledger.jsonPayload], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `zoho_voucher_${order.orderNumber}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── BADGE STYLES ────────────────────────────────────────────────────────────
  const PAYMENT_BADGE: Record<string, { bg: string; color: string }> = {
    PAID:               { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
    UNPAID:             { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
    PARTIALLY_REFUNDED: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    REFUNDED:           { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
    FAILED:             { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
  };
  const ORDER_STATUS_BADGE: Record<string, string> = {
    PENDING: 'badge badge-yellow', CONFIRMED: 'badge badge-blue',
    PACKED: 'badge badge-blue',    READY_FOR_PICKUP: 'badge badge-blue',
    PICKED_UP: 'badge badge-blue', IN_TRANSIT: 'badge badge-green',
    DELIVERED: 'badge badge-green', COMPLETED: 'badge badge-green',
    CANCELLED: 'badge badge-red',  RETURNED: 'badge badge-yellow',
    REFUNDED: 'badge badge-red',
  };
  const payBadge = PAYMENT_BADGE[order.paymentStatus] ?? { bg: 'rgba(255,255,255,0.05)', color: '#86868b' };
  const isCOD = order.paymentMethod === 'COD';

  // ── INVALID STATE DETECTION ──────────────────────────────────────────────────
  const isInvalidState =
    (order.status === 'COMPLETED' && order.paymentStatus !== 'PAID') ||
    (order.status === 'DELIVERED' && order.paymentStatus === 'FAILED');

  const WORKFLOW = ['PENDING', 'CONFIRMED', 'PACKED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];
  const currentWorkflowStepIndex = WORKFLOW.indexOf(order.status);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

      {/* ── INVALID STATE BANNER */}
      {isInvalidState && (
        <div style={{ gridColumn: '1 / -1', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <strong style={{ color: '#ef4444' }}>Invalid Order State Detected</strong>
            <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 2 }}>
              Order <strong>#{order.orderNumber}</strong> is in state <strong>{order.status}</strong> but payment is <strong>{order.paymentStatus}</strong>.
              This is a data inconsistency. Review and correct via the controls below.
            </div>
          </div>
        </div>
      )}

      {/* ── LEFT: Order Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Link href="/admin/orders" className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: 12 }}>
          ← Back to Orders
        </Link>

        <div className="admin-card" style={{ padding: 32 }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <span className="mono" style={{ fontSize: 20, color: 'var(--admin-accent)', fontWeight: 700 }}>#{order.orderNumber}</span>
              <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 4 }}>Placed on {formatDate(order.createdAt)}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setInvoiceOpen(true)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                Print Invoice
              </button>
              <button onClick={handleExportTally} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} title="Download Tally ERP9 compliant XML voucher">
                Tally XML
              </button>
              <button onClick={handleExportZoho} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} title="Download Zoho Books compliant JSON ledger">
                Zoho JSON
              </button>
              {/* Payment badge */}
              <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as const, background: payBadge.bg, color: payBadge.color, border: `1px solid ${payBadge.color}44` }}>
                {order.paymentStatus}
              </span>
              {/* Status badge */}
              <span className={ORDER_STATUS_BADGE[order.status] ?? 'badge badge-grey'}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Customer + Address */}
          <div style={{ background: 'var(--admin-surface-2)', padding: 16, borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: 13 }}>
            <div>
              <span style={{ color: 'var(--admin-muted)', fontSize: 10, textTransform: 'uppercase' as const, fontWeight: 600, display: 'block', marginBottom: 4 }}>Customer Account</span>
              <div style={{ fontWeight: 600 }}>{order.profile ? `${order.profile.firstName ?? ''} ${order.profile.lastName ?? ''}`.trim() : 'Guest Account'}</div>
              <div style={{ color: 'var(--admin-muted)' }}>{order.email}</div>
              {order.profile?.godsmoveId && (
                <span className="mono" style={{ fontSize: 9, background: 'var(--admin-border)', padding: '1px 4px', borderRadius: 4, color: 'var(--admin-accent)', display: 'inline-block', marginTop: 4 }}>{order.profile.godsmoveId}</span>
              )}
            </div>
            <div>
              <span style={{ color: 'var(--admin-muted)', fontSize: 10, textTransform: 'uppercase' as const, fontWeight: 600, display: 'block', marginBottom: 4 }}>Shipping Address</span>
              {order.shippingAddress ? (
                <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600 }}>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                  <div>{order.shippingAddress.line1}</div>
                  {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                  {order.shippingAddress.landmark && <div style={{ fontStyle: 'italic', opacity: 0.8 }}>Landmark: {order.shippingAddress.landmark}</div>}
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</div>
                  <div>Ph: {order.shippingAddress.phone}</div>
                </div>
              ) : (
                <div style={{ color: 'var(--admin-muted)' }}>No shipping details</div>
              )}
            </div>
          </div>

          {/* Items table */}
          <table className="admin-table" style={{ fontSize: 13, marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <th style={{ paddingBottom: 8 }}>Product Item</th>
                <th style={{ textAlign: 'center', paddingBottom: 8 }}>Size</th>
                <th style={{ textAlign: 'center', paddingBottom: 8 }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: 8 }}>Unit Price</th>
                <th style={{ textAlign: 'right', paddingBottom: 8 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>{item.productName}</td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>{item.size}</td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>×{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>{formatINR(item.price)}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 600 }}>{formatINR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, marginLeft: 'auto', width: 280, borderTop: '1px solid var(--admin-border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--admin-muted)' }}>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            {Number(order.discountAmount) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-danger)' }}><span>Discount</span><span>-{formatINR(order.discountAmount)}</span></div>}
            {Number(order.shippingCost) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>{formatINR(order.shippingCost)}</span></div>}
            {Number(order.walletCredit) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-info)' }}><span>GODSMOVE Credits</span><span>-{formatINR(order.walletCredit)}</span></div>}
            
            {/* Indian GST splits */}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-muted)', borderTop: '1px dashed var(--admin-border)', paddingTop: 6 }}>
              <span>Taxable Value</span>
              <span>{formatINR(Number(order.total) / 1.12)}</span>
            </div>
            {(order.shippingAddress?.state || 'Haryana').trim().toUpperCase() === 'HARYANA' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-muted)' }}><span>CGST</span><span>{formatINR((Number(order.total) - Number(order.total) / 1.12) / 2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-muted)' }}><span>SGST</span><span>{formatINR((Number(order.total) - Number(order.total) / 1.12) / 2)}</span></div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-muted)' }}><span>IGST</span><span>{formatINR(Number(order.total) - Number(order.total) / 1.12)}</span></div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--admin-border)', paddingTop: 10, fontSize: 16 }}>
              <span>Grand Total</span><span style={{ color: 'var(--admin-accent)' }}>{formatINR(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Operational Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Operational Controls */}
        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 14 }}>Operational Controls</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {order.status === 'PENDING' && (
              <>
                <button onClick={() => handleStatusTransition('CONFIRMED')} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {isCOD ? 'Approve COD Order' : 'Approve & Confirm Order'}
                </button>
                {!isCOD && order.paymentStatus !== 'PAID' && (
                  <div style={{ fontSize: 11, color: '#f59e0b', padding: '6px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>
                    ⚠️ Payment not yet received. Confirm only after verifying payment.
                  </div>
                )}
                <button onClick={() => handleStatusTransition('CANCELLED')} disabled={loading} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--admin-danger)' }}>
                  Reject / Cancel Order
                </button>
              </>
            )}

            {order.status === 'CONFIRMED' && (
              <button onClick={() => handleStatusTransition('PACKED')} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Mark as Packed</button>
            )}

            {order.status === 'PACKED' && (
              <form onSubmit={handleCourierAssign} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)', marginBottom: 4 }}>Select Courier</label>
                  <select value={carrier} onChange={(e) => setCarrier(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 12 }}>
                    <option value="Shiprocket">Shiprocket (Auto)</option>
                    <option value="Delhivery">Delhivery</option>
                    <option value="Manual">Manual Dispatch</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)', marginBottom: 4 }}>Tracking Number</label>
                  <input type="text" placeholder="AWB tracking string..." value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 12 }} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Generate Tracking &amp; Dispatch</button>
              </form>
            )}

            {order.status === 'READY_FOR_PICKUP' && (
              <button onClick={() => handleStatusTransition('IN_TRANSIT')} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Mark as Picked Up (In Transit)</button>
            )}

            {order.status === 'IN_TRANSIT' && (
              <button onClick={() => handleStatusTransition('DELIVERED')} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Mark as Delivered</button>
            )}

            {order.status === 'DELIVERED' && (
              <>
                {isCOD ? (
                  <button onClick={() => setCodConfirmOpen(true)} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                    💵 Confirm COD Collection &amp; Complete
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusTransition('COMPLETED')}
                    disabled={loading || order.paymentStatus !== 'PAID'}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', opacity: order.paymentStatus === 'PAID' ? 1 : 0.4, cursor: order.paymentStatus === 'PAID' ? 'pointer' : 'not-allowed' }}
                    title={order.paymentStatus !== 'PAID' ? `Cannot complete — payment is ${order.paymentStatus}` : ''}
                  >
                    Complete Transaction
                  </button>
                )}
                {order.paymentStatus !== 'PAID' && !isCOD && (
                  <div style={{ fontSize: 11, color: '#ef4444', padding: '6px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
                    ⛔ Payment must be PAID before completing this order.
                  </div>
                )}
              </>
            )}

            {['PENDING','CONFIRMED','PACKED','READY_FOR_PICKUP','IN_TRANSIT'].includes(order.status) && (
              <button onClick={() => handleStatusTransition('CANCELLED')} disabled={loading} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--admin-danger)', border: '1px solid rgba(255,107,107,0.2)' }}>Cancel Order</button>
            )}

            {order.status === 'CANCELLED' && <div style={{ textAlign: 'center', color: 'var(--admin-danger)', fontSize: 12, fontWeight: 600, padding: 12, border: '1px solid var(--admin-border)', borderRadius: 8 }}>Order Cancelled</div>}
            {order.status === 'COMPLETED' && (
              <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, padding: 12, border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                <div style={{ color: 'var(--admin-accent)' }}>✓ Order Completed</div>
                {order.paidAt && <div style={{ color: 'var(--admin-muted)', fontSize: 10, marginTop: 4 }}>Paid: {formatDate(order.paidAt)}</div>}
                {order.fulfilledAt && <div style={{ color: 'var(--admin-muted)', fontSize: 10, marginTop: 2 }}>Delivered: {formatDate(order.fulfilledAt)}</div>}
              </div>
            )}
            {order.status === 'RETURNED' && <div style={{ textAlign: 'center', color: '#f59e0b', fontSize: 12, fontWeight: 600, padding: 12, border: '1px solid var(--admin-border)', borderRadius: 8 }}>Return Completed</div>}
            {order.status === 'REFUNDED' && <div style={{ textAlign: 'center', color: 'var(--admin-danger)', fontSize: 12, fontWeight: 600, padding: 12, border: '1px solid var(--admin-border)', borderRadius: 8 }}>Order Fully Refunded</div>}
          </div>
        </div>

        {/* Fulfillment Snapshot */}
        <div className="admin-card" style={{ padding: 20, fontSize: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>Fulfillment Snapshot</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[{
              label: 'Payment Method', value: order.paymentMethod, color: undefined,
            }, {
              label: 'Payment Status', value: order.paymentStatus, color: payBadge.color,
            }, {
              label: 'Paid At', value: formatDate(order.paidAt), color: undefined,
            }, {
              label: 'Delivered At', value: formatDate(order.fulfilledAt), color: undefined,
            }].map(f => (
              <div key={f.label}>
                <span style={{ color: 'var(--admin-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 2 }}>{f.label}</span>
                <span style={{ fontWeight: 700, color: f.color || 'var(--admin-text)' }}>{f.value}</span>
              </div>
            ))}
            {order.trackingNumber && (
              <>
                <div><span style={{ color: 'var(--admin-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 2 }}>Logistics Partner</span><span style={{ fontWeight: 700 }}>{order.carrier}</span></div>
                <div><span style={{ color: 'var(--admin-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 2 }}>Tracking Number</span><span className="mono" style={{ color: 'var(--admin-accent)', fontWeight: 700 }}>{order.trackingNumber}</span></div>
              </>
            )}
          </div>
        </div>

        {/* Workflow Timeline */}
        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 13 }}>Order Timeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 2, background: 'var(--admin-border)', borderRadius: 2 }} />
            {[
              { label: 'Pending Payment', statuses: ['PENDING'] },
              { label: 'Confirmed',       statuses: ['CONFIRMED', 'PROCESSING'] },
              { label: 'Packed',          statuses: ['PACKED', 'READY_FOR_PICKUP', 'PICKED_UP'] },
              { label: 'In Transit',      statuses: ['IN_TRANSIT', 'SHIPPED'] },
              { label: 'Delivered',       statuses: ['DELIVERED'] },
              { label: 'Completed',       statuses: ['COMPLETED'] },
            ].map((step, si) => {
              const isCurrent = step.statuses.includes(order.status);
              const active = currentWorkflowStepIndex >= si || isCurrent;
              return (
                <div key={step.label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: isCurrent ? 'var(--admin-accent)' : active ? 'rgba(255,255,255,0.4)' : 'var(--admin-border)', border: isCurrent ? '2px solid var(--admin-accent)' : 'none', boxShadow: isCurrent ? '0 0 8px var(--admin-accent)' : 'none', flexShrink: 0, zIndex: 1 }} />
                  <span style={{ color: isCurrent ? 'var(--admin-text)' : active ? 'rgba(255,255,255,0.6)' : 'var(--admin-muted)', fontWeight: isCurrent ? 700 : active ? 500 : 400 }}>
                    {step.label}{isCurrent && <span style={{ fontSize: 9, marginLeft: 6, color: 'var(--admin-accent)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>← Current</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── COD COLLECTION CONFIRMATION MODAL */}
      {codConfirmOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid rgba(245,158,11,0.4)', color: 'var(--admin-text)', width: 440, padding: 36, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 28, textAlign: 'center' }}>💵</div>
            <h3 style={{ margin: 0, textAlign: 'center', fontSize: 16 }}>Confirm COD Collection</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              You are confirming that <strong style={{ color: 'var(--admin-text)' }}>{formatINR(order.total)}</strong> cash
              has been physically collected for Order <strong style={{ color: 'var(--admin-accent)' }}>#{order.orderNumber}</strong>.
              <br /><br />
              This will mark the order as <strong style={{ color: '#22c55e' }}>COMPLETED</strong> and
              payment as <strong style={{ color: '#22c55e' }}>PAID</strong>.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCodConfirmOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={handleCodComplete} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>Yes, Cash Collected</button>
            </div>
          </div>
        </div>
      )}

      {/* ── INVOICE MODAL */}
      {invoiceOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', color: '#000', width: 700, padding: 48, borderRadius: 8, position: 'relative', display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '90vh', overflowY: 'auto', fontFamily: 'monospace' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 16 }}>
              <div>
                <img src="/images/logo/logo-horizontal-black.png" alt="GODSMOVE" style={{ height: '20px', width: 'auto', display: 'block', marginBottom: 4 }} />
                <span style={{ fontSize: 10 }}>Decisive Creators E-commerce</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>INVOICE</h2>
                <div style={{ fontSize: 11, marginTop: 4 }}>Order: {order.orderNumber}</div>
                <div style={{ fontSize: 11 }}>Date: {formatDate(order.createdAt)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontSize: 11 }}>
              <div><strong>Billed To:</strong><div style={{ marginTop: 4 }}>{order.profile ? `${order.profile.firstName ?? ''} ${order.profile.lastName ?? ''}`.trim() : 'Guest Customer'}</div><div>{order.email}</div></div>
              <div><strong>Shipped To:</strong>
                {order.shippingAddress && (
                  <div style={{ marginTop: 4 }}>
                    <div>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
                    <div>{order.shippingAddress.line1}</div>
                    {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                    {order.shippingAddress.landmark && <div style={{ fontStyle: 'italic' }}>Landmark: {order.shippingAddress.landmark}</div>}
                    <div>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</div>
                  </div>
                )}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: '1px solid #000' }}><th style={{ textAlign: 'left', paddingBottom: 6 }}>Description</th><th style={{ textAlign: 'center', paddingBottom: 6 }}>Size</th><th style={{ textAlign: 'center', paddingBottom: 6 }}>Qty</th><th style={{ textAlign: 'right', paddingBottom: 6 }}>Unit</th><th style={{ textAlign: 'right', paddingBottom: 6 }}>Total</th></tr></thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px 0' }}>{i.productName}</td><td style={{ textAlign: 'center', padding: '8px 0' }}>{i.size}</td><td style={{ textAlign: 'center', padding: '8px 0' }}>{i.quantity}</td><td style={{ textAlign: 'right', padding: '8px 0' }}>{formatINR(i.price)}</td><td style={{ textAlign: 'right', padding: '8px 0' }}>{formatINR(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 220, marginLeft: 'auto', textAlign: 'right', fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>{formatINR(order.subtotal)}</span></div>
              {Number(order.discountAmount) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount:</span><span>-{formatINR(order.discountAmount)}</span></div>}
              {Number(order.walletCredit) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Credits Used:</span><span>-{formatINR(order.walletCredit)}</span></div>}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', paddingTop: 4 }}><span>Taxable Value:</span><span>{formatINR(Number(order.total) / 1.12)}</span></div>
              {(order.shippingAddress?.state || 'Haryana').trim().toUpperCase() === 'HARYANA' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CGST:</span><span>{formatINR((Number(order.total) - Number(order.total) / 1.12) / 2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST:</span><span>{formatINR((Number(order.total) - Number(order.total) / 1.12) / 2)}</span></div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IGST:</span><span>{formatINR(Number(order.total) - Number(order.total) / 1.12)}</span></div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #000', paddingTop: 6, fontSize: 13, marginTop: 4 }}><span>Grand Total:</span><span>{formatINR(order.total)}</span></div>
            </div>
            <div style={{ borderTop: '1px solid #000', paddingTop: 16, textAlign: 'center', fontSize: 10, color: '#666', display: 'flex', justifyContent: 'space-between' }}>
              <span>Payment: {order.paymentStatus} via {order.paymentMethod}</span>
              <button onClick={() => setInvoiceOpen(false)} style={{ background: '#000', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
