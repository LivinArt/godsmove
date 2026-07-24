'use client';

import { useState, useEffect } from 'react';
import { 
  getAdminCareRequests, 
  reviewCareRequest, 
  updateCareStage,
  getCareGstPercentage,
  saveCareGstPercentage,
  updateCareLogistics
} from '@/actions/care.actions';
import { Loader2, Settings, Wrench, Shield, Truck, Package, Archive, AlertOctagon } from 'lucide-react';

export default function AdminCareRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'UNDER_CARE' | 'DISPATCHED' | 'COMPLETED' | 'REJECTED'>('PENDING');

  // Config GST State
  const [gstPercentage, setGstPercentage] = useState(18);
  const [savingGst, setSavingGst] = useState(false);

  // Review Modal State
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectReason, setRejectReason] = useState('');
  const [pickupCharge, setPickupCharge] = useState('0');
  const [repairCharge, setRepairCharge] = useState('0');
  const [returnCharge, setReturnCharge] = useState('0');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Update Status Stage State
  const [selectedUpdateReq, setSelectedUpdateReq] = useState<any | null>(null);
  const [newStage, setNewStage] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);

  // Logistics state variables
  const [logisticsPartner, setLogisticsPartner] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [logisticsStatus, setLogisticsStatus] = useState('');
  const [updatingLogistics, setUpdatingLogistics] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [res, rate] = await Promise.all([
        getAdminCareRequests(),
        getCareGstPercentage()
      ]);
      setRequests(res);
      setGstPercentage(rate);
    } catch (e: any) {
      alert(e.message || 'Failed to load care requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSaveGst = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGst(true);
    try {
      await saveCareGstPercentage(gstPercentage);
      alert(`GST Percentage updated to ${gstPercentage}% successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to save GST percentage');
    } finally {
      setSavingGst(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmittingReview(true);
    try {
      await reviewCareRequest({
        id: selectedReq.id,
        action: reviewAction,
        rejectReason,
        pickupCharge: Number(pickupCharge),
        repairCharge: Number(repairCharge),
        returnCharge: Number(returnCharge),
        additionalNotes
      });
      alert(`Care request has been ${reviewAction === 'APPROVE' ? 'Approved' : 'Rejected'}.`);
      setSelectedReq(null);
      // Reset forms
      setRejectReason('');
      setPickupCharge('0');
      setRepairCharge('0');
      setReturnCharge('0');
      setAdditionalNotes('');
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStageUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpdateReq || !newStage) return;
    setUpdatingStage(true);
    try {
      await updateCareStage(selectedUpdateReq.id, newStage);
      alert(`Status updated to: ${newStage}`);
      setSelectedUpdateReq(null);
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update stage');
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleSelectUpdateReq = (req: any) => {
    setSelectedUpdateReq(req);
    setNewStage(req.status);
    const notes = parseCareNotes(req.additionalNotes);
    if (notes.logistics) {
      setLogisticsPartner(notes.logistics.partner || '');
      setTrackingNumber(notes.logistics.trackingNumber || '');
      setPickupDate(notes.logistics.pickupDate ? notes.logistics.pickupDate.substring(0, 16) : '');
      setDeliveryDate(notes.logistics.deliveryDate ? notes.logistics.deliveryDate.substring(0, 16) : '');
      setEstimatedDelivery(notes.logistics.estimatedDelivery || '');
      setLogisticsStatus(notes.logistics.status || '');
    } else {
      setLogisticsPartner('');
      setTrackingNumber('');
      setPickupDate('');
      setDeliveryDate('');
      setEstimatedDelivery('');
      setLogisticsStatus('');
    }
  };

  const handleLogisticsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpdateReq) return;
    setUpdatingLogistics(true);
    try {
      await updateCareLogistics(selectedUpdateReq.id, {
        partner: logisticsPartner,
        trackingNumber,
        pickupDate: pickupDate || undefined,
        deliveryDate: deliveryDate || undefined,
        estimatedDelivery: estimatedDelivery || undefined,
        status: logisticsStatus
      });
      alert('Logistics reverse tracking updated successfully.');
      setSelectedUpdateReq(null);
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update logistics details');
    } finally {
      setUpdatingLogistics(false);
    }
  };

  const parseCareNotes = (notesStr: string | null) => {
    if (!notesStr) {
      return { adminNotes: '', gstPercentage: 18, gstAmount: 0, subtotal: 0, logistics: null };
    }
    try {
      const parsed = JSON.parse(notesStr);
      if (parsed && typeof parsed === 'object') {
        return {
          adminNotes: parsed.adminNotes || '',
          gstPercentage: typeof parsed.gstPercentage === 'number' ? parsed.gstPercentage : 18,
          gstAmount: typeof parsed.gstAmount === 'number' ? parsed.gstAmount : 0,
          subtotal: typeof parsed.subtotal === 'number' ? parsed.subtotal : 0,
          logistics: parsed.logistics || null
        };
      }
    } catch (e) {}
    return { adminNotes: notesStr, gstPercentage: 18, gstAmount: 0, subtotal: 0, logistics: null };
  };

  // Filter requests by tab
  const filtered = requests.filter(r => {
    if (activeTab === 'PENDING') {
      return r.status === 'SUBMITTED';
    }
    if (activeTab === 'APPROVED') {
      return ['APPROVED', 'AWAITING_PAYMENT', 'PAYMENT_COMPLETED', 'PICKUP_SCHEDULED'].includes(r.status);
    }
    if (activeTab === 'UNDER_CARE') {
      return ['COLLECTED', 'UNDER_CARE', 'REPAIR_STARTED', 'REPAIR_COMPLETED', 'QC', 'READY_TO_RETURN', 'PACKED'].includes(r.status);
    }
    if (activeTab === 'DISPATCHED') {
      return r.status === 'DISPATCHED';
    }
    if (activeTab === 'COMPLETED') {
      return ['DELIVERED', 'COMPLETED'].includes(r.status);
    }
    if (activeTab === 'REJECTED') {
      return r.status === 'REJECTED';
    }
    return false;
  });

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // Review Form Calculations
  const reviewSubtotal = Number(pickupCharge || 0) + Number(repairCharge || 0) + Number(returnCharge || 0);
  const reviewGstAmount = (reviewSubtotal * gstPercentage) / 100;
  const reviewGrandTotal = reviewSubtotal + reviewGstAmount;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">GODSMOVE Care Hub</h1>
          <p className="page-sub">{requests.filter(r => r.status === 'SUBMITTED').length} pending initial review</p>
        </div>
      </div>

      {/* GST Settings configuration */}
      <div className="admin-card" style={{ marginBottom: 32, maxWidth: 480 }}>
        <form onSubmit={handleSaveGst} style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings size={14} />
              <span>Care GST percentage (%)</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={gstPercentage}
              onChange={(e) => setGstPercentage(Number(e.target.value))}
              className="admin-input"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={savingGst}>
            {savingGst ? <Loader2 size={14} className="animate-spin" /> : 'Update Rate'}
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {(['PENDING', 'APPROVED', 'UNDER_CARE', 'DISPATCHED', 'COMPLETED', 'REJECTED'] as const).map((tab) => {
          const count = requests.filter(r => {
            if (tab === 'PENDING') return r.status === 'SUBMITTED';
            if (tab === 'APPROVED') return ['APPROVED', 'AWAITING_PAYMENT', 'PAYMENT_COMPLETED', 'PICKUP_SCHEDULED'].includes(r.status);
            if (tab === 'UNDER_CARE') return ['COLLECTED', 'UNDER_CARE', 'REPAIR_STARTED', 'REPAIR_COMPLETED', 'QC', 'READY_TO_RETURN', 'PACKED'].includes(r.status);
            if (tab === 'DISPATCHED') return r.status === 'DISPATCHED';
            if (tab === 'COMPLETED') return ['DELIVERED', 'COMPLETED'].includes(r.status);
            if (tab === 'REJECTED') return r.status === 'REJECTED';
            return false;
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid var(--admin-border)',
                background: activeTab === tab ? 'var(--admin-accent)' : 'var(--admin-surface-2)',
                color: activeTab === tab ? '#0a0a0a' : 'var(--admin-muted)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 className="animate-spin" style={{ color: 'var(--admin-accent)' }} />
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Customer</th>
                <th>Product Details</th>
                <th>Category</th>
                <th>Issue Summary</th>
                <th>Total Charges</th>
                <th>Payment Status</th>
                <th>Current Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>
                    No care requests in this category.
                  </td>
                </tr>
              )}
              {filtered.map((req) => (
                <tr key={req.id}>
                  <td>
                    <span className="mono" style={{ color: '#c8a46a', fontWeight: 600 }}>
                      {req.id.substring(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: '#f5f1e8' }}>{req.customerName || 'Customer'}</strong>
                      <div style={{ fontSize: 11, color: '#b8b2a6', marginTop: 2 }}>{req.customerEmail}</div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: '#f5f1e8' }}>{req.productName}</strong>
                      <div className="mono" style={{ fontSize: 10, color: '#c8a46a', marginTop: 2, fontWeight: 600 }}>{req.productCode}</div>
                    </div>
                  </td>
                  <td style={{ color: '#f5f1e8', fontWeight: 500 }}>{req.category}</td>
                  <td style={{ fontSize: 12, color: '#d4d0c8', maxWidth: 200, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={req.description}>
                    {req.description}
                  </td>
                  <td><strong style={{ color: '#f5f1e8' }}>{formatINR(req.totalCharge)}</strong></td>
                  <td>
                    <span className={`badge ${req.paymentStatus === 'PAID' ? 'badge-green' : 'badge-yellow'}`} style={{ fontWeight: 600 }}>
                      {req.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${req.status === 'COMPLETED' ? 'badge-green' : req.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'}`} style={{ fontWeight: 600 }}>
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#b8b2a6' }}>
                    {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(req.createdAt))}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {req.status === 'SUBMITTED' && (
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setReviewAction('APPROVE');
                          }}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                        >
                          Review Request
                        </button>
                      )}
                      {req.status !== 'SUBMITTED' && req.status !== 'REJECTED' && req.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleSelectUpdateReq(req)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 11, border: '1px solid var(--admin-accent)', color: 'var(--admin-accent)' }}
                        >
                          Update Status
                        </button>
                      )}
                      {req.status === 'REJECTED' && (
                        <span style={{ fontSize: 11, color: 'var(--admin-danger)', fontStyle: 'italic' }}>Rejected</span>
                      )}
                      {req.status === 'COMPLETED' && (
                        <span style={{ fontSize: 11, color: 'var(--admin-success)', fontStyle: 'italic' }}>Archived</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REVIEW & ESTIMATE MODAL */}
      {selectedReq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', width: 520, padding: 32, borderRadius: 12 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Review Care Request ({selectedReq.productCode})</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--admin-muted)' }}>
              Submitted by <strong>{selectedReq.customerName}</strong> ({selectedReq.customerEmail}) for <strong>{selectedReq.productName}</strong>.
            </p>

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Action</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVE')}
                    style={{ flex: 1, padding: 10, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--admin-border)', background: reviewAction === 'APPROVE' ? 'var(--admin-accent)' : 'none', color: reviewAction === 'APPROVE' ? '#0a0a0a' : 'inherit', fontWeight: 600 }}
                  >
                    Approve Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECT')}
                    style={{ flex: 1, padding: 10, borderRadius: 6, cursor: 'pointer', border: '1px solid var(--admin-border)', background: reviewAction === 'REJECT' ? 'var(--admin-danger)' : 'none', color: reviewAction === 'REJECT' ? '#fff' : 'inherit', fontWeight: 600 }}
                  >
                    Reject Request
                  </button>
                </div>
              </div>

              {reviewAction === 'REJECT' ? (
                <div>
                  <label className="form-label">Rejection Reason</label>
                  <textarea
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Specify the reason why this garment cannot be serviced..."
                    className="admin-input admin-textarea"
                  />
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="form-label">Pickup (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={pickupCharge}
                        onChange={(e) => setPickupCharge(e.target.value)}
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Repair (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={repairCharge}
                        onChange={(e) => setRepairCharge(e.target.value)}
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Return (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={returnCharge}
                        onChange={(e) => setReturnCharge(e.target.value)}
                        className="admin-input"
                      />
                    </div>
                  </div>

                  {/* Calculated GST Summary panel */}
                  <div style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border-2)', padding: 16, borderRadius: 8, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-muted)' }}>
                      <span>Subtotal:</span>
                      <span>₹{reviewSubtotal}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-muted)' }}>
                      <span>Applied GST ({gstPercentage}%):</span>
                      <span>₹{reviewGstAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--admin-accent)', borderTop: '1px dashed var(--admin-border)', paddingTop: 6, marginTop: 4 }}>
                      <span>Total Invoice Estimate:</span>
                      <span>₹{reviewGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Logistics / Process Notes</label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="e.g. Courier instructions, parts to replace, dispatch schedule..."
                      className="admin-input admin-textarea"
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', background: reviewAction === 'APPROVE' ? 'var(--admin-accent)' : 'var(--admin-danger)', color: reviewAction === 'APPROVE' ? '#0a0a0a' : '#fff' }}
                >
                  {submittingReview ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS STAGE & LOGISTICS MODAL */}
      {selectedUpdateReq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', width: 560, padding: 32, borderRadius: 12, overflowY: 'auto', maxHeight: '90vh' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Update Service & Logistics</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--admin-muted)' }}>
              Set tracking milestone and carrier reverse logistics updates for request <strong>{selectedUpdateReq.id.substring(0,8).toUpperCase()}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Milestone Status Form */}
              <form onSubmit={handleStageUpdate} style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label">Service Milestone Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="admin-input admin-select"
                  >
                    <option value="APPROVED">APPROVED (Awaiting Pickup)</option>
                    <option value="AWAITING_PAYMENT">AWAITING PAYMENT</option>
                    <option value="PAYMENT_COMPLETED">PAYMENT COMPLETED</option>
                    <option value="PICKUP_SCHEDULED">PICKUP SCHEDULED</option>
                    <option value="COLLECTED">COLLECTED (In Transit to Workshop)</option>
                    <option value="UNDER_CARE">UNDER CARE (Atelier Received)</option>
                    <option value="REPAIR_STARTED">REPAIR STARTED</option>
                    <option value="REPAIR_COMPLETED">REPAIR COMPLETED</option>
                    <option value="QC">QUALITY INSPECTION</option>
                    <option value="READY_TO_RETURN">READY TO RETURN (Packed)</option>
                    <option value="DISPATCHED">DISPATCHED (In Transit to Archive)</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="COMPLETED">COMPLETED (Archived)</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={updatingStage}>
                  {updatingStage ? <Loader2 size={16} className="animate-spin" /> : 'Update Service Stage'}
                </button>
              </form>

              {/* Logistics Form */}
              <form onSubmit={handleLogisticsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span className="form-label" style={{ fontWeight: 600, color: 'var(--admin-accent)' }}>Logistics parameters</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Carrier Partner</label>
                    <input
                      type="text"
                      placeholder="e.g. Delhivery"
                      value={logisticsPartner}
                      onChange={(e) => setLogisticsPartner(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">AWB Tracking Number</label>
                    <input
                      type="text"
                      placeholder="e.g. DEL5436217"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Pickup Date & Time</label>
                    <input
                      type="datetime-local"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Delivery Date & Time</label>
                    <input
                      type="datetime-local"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Estimated Delivery Date</label>
                    <input
                      type="date"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Logistics status details</label>
                    <input
                      type="text"
                      placeholder="e.g. Out for reverse pickup"
                      value={logisticsStatus}
                      onChange={(e) => setLogisticsStatus(e.target.value)}
                      className="admin-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button type="button" onClick={() => setSelectedUpdateReq(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    Close
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={updatingLogistics}>
                    {updatingLogistics ? <Loader2 size={16} className="animate-spin" /> : 'Save Logistics'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
