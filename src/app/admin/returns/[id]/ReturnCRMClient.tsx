'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateReturnStatus,
  approveReturnRefund,
  approveAdminReturnRequest,
  updateAdminReturnQC,
} from '@/actions/admin-operations.actions';

interface ReturnItem {
  id: string;
  quantity: number;
  productName: string;
  price: number;
  size: string;
}

interface ReturnDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  shippingCost: number;
  type: string;
  status: string;
  reason: string;
  evidenceUrls: string[];
  adminNotes: string | null;
  creditAmount: number;
  createdAt: string;
  profile: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    godsmoveId: string | null;
  };
  items: ReturnItem[];
}

export default function ReturnCRMClient({
  ret,
}: {
  ret: ReturnDetail;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isConfirmingRefund, setIsConfirmingRefund] = useState(false);
  const [adminNotes, setAdminNotes] = useState(ret.adminNotes ?? '');
  const [selectedCarrier, setSelectedCarrier] = useState('Delhivery');

  // Refund calculation states (Strict Business Rule)
  const productPriceSum = ret.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [outboundShippingDeduction, setOutboundShippingDeduction] = useState(ret.shippingCost.toString());
  const [returnLogisticsDeduction, setReturnLogisticsDeduction] = useState('180'); // default pickup ₹180
  const [taxAdjustment, setTaxAdjustment] = useState('120'); // default tax adjustment ₹120

  const outboundShipAmt = parseFloat(outboundShippingDeduction) || 0;
  const returnLogisticsAmt = parseFloat(returnLogisticsDeduction) || 0;
  const taxAdjustmentAmt = parseFloat(taxAdjustment) || 0;

  const finalCreditsRefund = Math.max(
    0,
    productPriceSum - outboundShipAmt - returnLogisticsAmt - taxAdjustmentAmt
  );

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

  const handleStateUpdate = async (status: string) => {
    if (status === 'REQUESTED' && !adminNotes.trim()) {
      alert('Please enter a note explaining what information or evidence is required from the customer.');
      return;
    }
    setLoading(true);
    try {
      await updateReturnStatus(ret.id, status, adminNotes);
      alert(`Return status updated to: ${status}`);
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Status update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithLogistics = async () => {
    setLoading(true);
    try {
      await approveAdminReturnRequest(ret.id, selectedCarrier);
      alert(`Return approved. Reverse shipment created via ${selectedCarrier}.`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Approval failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQCUpdate = async (status: 'RECEIVED' | 'INSPECTION' | 'REJECTED') => {
    setLoading(true);
    try {
      await updateAdminReturnQC(ret.id, status, adminNotes);
      alert(`QC Status updated to: ${status}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'QC transition failed.');
    } finally {
      setLoading(false);
    }
  };

  // Refund confirmation — uses inline React UI instead of window.confirm()
  // to avoid silent dialog dismissal in admin/headless environments.
  const handleRefundConfirm = async () => {
    setIsConfirmingRefund(false);
    setLoading(true);
    try {
      await approveReturnRefund({
        returnId: ret.id,
        productPriceSum,
        outboundShippingDeduction: outboundShipAmt,
        returnLogisticsDeduction: returnLogisticsAmt,
        taxAdjustment: taxAdjustmentAmt,
        refundSummaryDescription: `Return for Order #${ret.orderNumber} approved. Outbound ship deduction: ₹${outboundShipAmt}, Return logistics deduction: ₹${returnLogisticsAmt}.`,
      });
      alert('Refund approved and issued successfully.');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to approve refund.');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_BADGE: Record<string, string> = {
    PENDING: 'badge badge-yellow',
    REQUESTED: 'badge badge-yellow',
    APPROVED: 'badge badge-blue',
    PICKUP_SCHEDULED: 'badge badge-blue',
    COLLECTED: 'badge badge-blue',
    RECEIVED: 'badge badge-blue',
    INSPECTION: 'badge badge-blue',
    REFUND_PROCESSED: 'badge badge-green',
    WALLET_CREDITED: 'badge badge-green',
    COMPLETED: 'badge badge-green',
    REJECTED: 'badge badge-red',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
      {/* LEFT COLUMN: Details Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Link href="/admin/returns" className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: 12 }}>
          ← Back to Returns
        </Link>

        <div className="admin-card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Return Request Details</span>
              <div style={{ fontSize: 12, color: 'var(--admin-muted)', marginTop: 4 }}>
                Requested on {formatDate(ret.createdAt)}
              </div>
            </div>
            <span className={STATUS_BADGE[ret.status] ?? 'badge badge-grey'}>
              {ret.status.replace('_', ' ')}
            </span>
          </div>

          {/* Customer Metadata Card */}
          <div style={{ background: 'var(--admin-surface-2)', padding: 16, borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: 13 }}>
            <div>
              <span style={{ color: 'var(--admin-muted)', fontSize: 10, textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Customer Profile
              </span>
              <div style={{ fontWeight: 600 }}>{ret.profile.firstName} {ret.profile.lastName}</div>
              <div style={{ color: 'var(--admin-muted)' }}>{ret.profile.email}</div>
              {ret.profile.godsmoveId && (
                <span className="mono" style={{ fontSize: 9, background: 'var(--admin-border)', padding: '1px 4px', borderRadius: 4, color: 'var(--admin-accent)', display: 'inline-block', marginTop: 4 }}>
                  {ret.profile.godsmoveId}
                </span>
              )}
            </div>
            <div>
              <span style={{ color: 'var(--admin-muted)', fontSize: 10, textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Order Reference
              </span>
              <Link href={`/admin/orders/${ret.orderId}`} className="mono" style={{ color: 'var(--admin-accent)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                #{ret.orderNumber}
              </Link>
              <div style={{ color: 'var(--admin-muted)', fontSize: 12, marginTop: 4 }}>Order Value: {formatINR(ret.orderTotal)}</div>
            </div>
          </div>

          {/* Return items table */}
          <table className="admin-table" style={{ fontSize: 13, marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <th style={{ paddingBottom: 8 }}>Returned Item</th>
                <th style={{ textAlign: 'center', paddingBottom: 8 }}>Size</th>
                <th style={{ textAlign: 'center', paddingBottom: 8 }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: 8 }}>Price</th>
                <th style={{ textAlign: 'right', paddingBottom: 8 }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {ret.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>{item.productName}</td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>{item.size}</td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>×{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0' }}>{formatINR(item.price)}</td>
                  <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 600 }}>{formatINR(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Reason & Evidence Uploads */}
          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 20 }}>
            <span style={{ color: 'var(--admin-muted)', fontSize: 10, textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Reason for Return Request
            </span>
            <blockquote style={{ margin: 0, padding: '10px 16px', background: 'var(--admin-surface-2)', borderRadius: 8, fontSize: 13, borderLeft: '3px solid var(--admin-border)', fontStyle: 'italic', color: 'var(--admin-text)' }}>
              "{ret.reason}"
            </blockquote>

            {ret.evidenceUrls && ret.evidenceUrls.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <span style={{ color: 'var(--admin-muted)', fontSize: 10, textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  Uploaded Evidence Proof (Images / Video)
                </span>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {ret.evidenceUrls.map((url) => {
                    const isVideo = url.toLowerCase().match(/\.(mp4|mov|avi|webm|mkv|ogg)$/);
                    if (isVideo) {
                      return (
                        <video key={url} src={url} controls style={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--admin-border)' }} />
                      );
                    }
                    return (
                      <img key={url} src={url} alt="Evidence" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--admin-border)' }} />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Operational QC controls & strictly wallet credit calculations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Status controls */}
        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 14 }}>Workflow Transitions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea
              placeholder="Inspection notes or rejection feedback logs..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              style={{
                width: '100%',
                height: 80,
                padding: 10,
                borderRadius: 6,
                background: 'var(--admin-surface-2)',
                border: '1px solid var(--admin-border)',
                color: 'var(--admin-text)',
                fontSize: 12,
                resize: 'none',
              }}
            />

            {/* Transition Flow triggers */}
            {(ret.status === 'PENDING' || ret.status === 'REQUESTED') && (
              <>
                <div style={{ border: '1px solid var(--admin-border)', borderRadius: 6, padding: '10px', background: 'var(--admin-surface-2)', marginBottom: 4 }}>
                  <label style={{ fontSize: 10, color: 'var(--admin-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                    Select Courier
                  </label>
                  <select 
                    value={selectedCarrier}
                    onChange={(e) => setSelectedCarrier(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 4, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 12 }}
                  >
                    <option value="Delhivery">Delhivery</option>
                    <option value="Shiprocket">Shiprocket</option>
                    <option value="BlueDart">Blue Dart</option>
                  </select>
                </div>

                <button onClick={handleApproveWithLogistics} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Approve Return Case
                </button>
                <button onClick={() => handleStateUpdate('REQUESTED')} disabled={loading} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--admin-accent)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  Request More Information
                </button>
                <button onClick={() => handleStateUpdate('REJECTED')} disabled={loading} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--admin-danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  Reject Return Case
                </button>
              </>
            )}

            {ret.status === 'APPROVED' && (
              <button onClick={() => handleStateUpdate('PICKUP_SCHEDULED')} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Schedule Courier Pickup
              </button>
            )}

            {ret.status === 'PICKUP_SCHEDULED' && (
              <button onClick={() => handleStateUpdate('COLLECTED')} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Mark Package Collected
              </button>
            )}

            {ret.status === 'COLLECTED' && (
              <button onClick={() => handleQCUpdate('RECEIVED')} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Mark Package Received at Warehouse
              </button>
            )}

            {ret.status === 'RECEIVED' && (
              <button onClick={() => handleQCUpdate('INSPECTION')} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Initiate QC Quality Check
              </button>
            )}

            {ret.status === 'INSPECTION' && (
              <>
                <button onClick={() => handleStateUpdate('REFUND_PROCESSED')} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Complete Quality Check (QC Pass)
                </button>
                <button onClick={() => handleQCUpdate('REJECTED')} disabled={loading} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--admin-danger)', border: '1px solid rgba(255,107,107,0.2)' }}>
                  Reject / Fail QC Check
                </button>
              </>
            )}

            {/* Fallback rejects for other states */}
            {['APPROVED', 'PICKUP_SCHEDULED', 'COLLECTED', 'RECEIVED'].includes(ret.status) && (
              <button onClick={() => handleQCUpdate('REJECTED')} disabled={loading} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--admin-danger)', border: '1px solid rgba(255,107,107,0.2)' }}>
                Reject / Cancel Case
              </button>
            )}

            {ret.status === 'REJECTED' && (
              <div style={{ textAlign: 'center', color: 'var(--admin-danger)', fontSize: 12, fontWeight: 600, padding: 12, border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                Case Rejected
              </div>
            )}

            {ret.status === 'COMPLETED' && (
              <div style={{ textAlign: 'center', color: 'var(--admin-accent)', fontSize: 12, fontWeight: 600, padding: 12, border: '1px solid var(--admin-border)', borderRadius: 8 }}>
                Case Closed: Wallet Credited (₹{ret.creditAmount.toLocaleString()})
              </div>
            )}
          </div>
        </div>

        {/* STRICT REFUND CALCULATION SIDEBAR */}
        {ret.status === 'REFUND_PROCESSED' && (
          <div className="admin-card" style={{ padding: 20, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-accent)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14, color: 'var(--admin-accent)' }}>Strict Wallet Refund Calculator</h3>
            <p style={{ fontSize: 11, color: 'var(--admin-muted)', lineHeight: 1.4, marginBottom: 16 }}>
              In accordance with GODSMOVE policy, cash refunds are forbidden. Calculations automatically credit the balance to the customer's wallet.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)', marginBottom: 4 }}>
                  Product Price Sum (Locked)
                </label>
                <div style={{ padding: '8px 12px', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                  {formatINR(productPriceSum)}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)', marginBottom: 4 }}>
                  Outbound Shipping Deduction
                </label>
                <input
                  type="number"
                  required
                  value={outboundShippingDeduction}
                  onChange={(e) => setOutboundShippingDeduction(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)', marginBottom: 4 }}>
                  Return Pickup Logistics Cost
                </label>
                <input
                  type="number"
                  required
                  value={returnLogisticsDeduction}
                  onChange={(e) => setReturnLogisticsDeduction(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, color: 'var(--admin-muted)', marginBottom: 4 }}>
                  Tax Adjustments
                </label>
                <input
                  type="number"
                  required
                  value={taxAdjustment}
                  onChange={(e) => setTaxAdjustment(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: 12 }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--admin-muted)', display: 'block' }}>Wallet Credits Issued</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-accent)' }}>
                  {formatINR(finalCreditsRefund)}
                </span>
              </div>

              {/* Two-step inline confirmation — no window.confirm() dependency */}
              {!isConfirmingRefund ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsConfirmingRefund(true)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? 'Crediting Wallet...' : 'Approve Refund & Issue Credits'}
                </button>
              ) : (
                <div style={{ border: '1px solid var(--admin-accent)', borderRadius: 8, padding: 14, background: 'rgba(255,255,255,0.03)' }}>
                  <p style={{ fontSize: 12, color: 'var(--admin-text)', marginBottom: 12, lineHeight: 1.5 }}>
                    Confirm issuing <strong style={{ color: 'var(--admin-accent)' }}>{formatINR(finalCreditsRefund)}</strong> GODSMOVE Credits to this customer's wallet? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleRefundConfirm}
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                    >
                      {loading ? 'Processing...' : '✓ Confirm'}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setIsConfirmingRefund(false)}
                      className="btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline representation */}
        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 13 }}>Workflow Timeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
            {[
              { label: 'Return Requested', active: ['PENDING', 'REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'COLLECTED', 'RECEIVED', 'INSPECTION', 'REFUND_PROCESSED', 'COMPLETED'].includes(ret.status) },
              ...(ret.status === 'REQUESTED' ? [{ label: 'Information Requested', active: true }] : []),
              { label: 'Approved', active: ['APPROVED', 'PICKUP_SCHEDULED', 'COLLECTED', 'RECEIVED', 'INSPECTION', 'REFUND_PROCESSED', 'COMPLETED'].includes(ret.status) },
              { label: 'Pickup Scheduled', active: ['PICKUP_SCHEDULED', 'COLLECTED', 'RECEIVED', 'INSPECTION', 'REFUND_PROCESSED', 'COMPLETED'].includes(ret.status) },
              { label: 'Collected from Customer', active: ['COLLECTED', 'RECEIVED', 'INSPECTION', 'REFUND_PROCESSED', 'COMPLETED'].includes(ret.status) },
              { label: 'Received at Warehouse', active: ['RECEIVED', 'INSPECTION', 'REFUND_PROCESSED', 'COMPLETED'].includes(ret.status) },
              { label: 'QC Quality Check', active: ['INSPECTION', 'REFUND_PROCESSED', 'COMPLETED'].includes(ret.status) },
              { label: 'Refund Processed', active: ['REFUND_PROCESSED', 'COMPLETED'].includes(ret.status) },
              { label: 'Case Completed', active: ['COMPLETED'].includes(ret.status) },
              ...(ret.status === 'REJECTED' ? [{ label: 'Case Rejected', active: true }] : []),
            ].map((step) => {
              const active = step.active;
              return (
                <div key={step.label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--admin-accent)' : 'var(--admin-border)', border: active ? '2px solid var(--admin-accent)' : 'none' }} />
                  <span style={{ color: active ? 'var(--admin-text)' : 'var(--admin-muted)', fontWeight: active ? 600 : 500 }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
