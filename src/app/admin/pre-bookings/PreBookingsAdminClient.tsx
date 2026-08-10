'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  ShieldCheck,
  ArrowUpRight,
  Eye,
  X,
  Sparkles,
  ShoppingBag,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { getProductPreBookingInsightAction } from '@/actions/admin-prebookings.actions';

interface PreBookingsAdminClientProps {
  initialData: any;
}

export default function PreBookingsAdminClient({ initialData }: PreBookingsAdminClientProps) {
  const [data, setData] = useState(initialData);
  const [insightDrawerOpen, setInsightDrawerOpen] = useState(false);
  const [insightData, setInsightData] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [activeTab, setActiveTab] = useState<'customers' | 'interest' | 'attempts'>('customers');

  const metrics = data?.metrics || {
    totalActivePreBookings: 0,
    totalReservedVolume: 0,
    totalUnitsRingFenced: 0,
    conversionRate: 100,
    totalInterestCount: 0,
    openReleasesCount: 0,
    upcomingReleasesCount: 0,
    launchedReleasesCount: 0,
    soldOutReleasesCount: 0,
  };

  const products = data?.products || [];
  const orders = data?.orders || [];

  const handleOpenInsight = async (productId: string) => {
    setInsightDrawerOpen(true);
    setLoadingInsight(true);
    setActiveTab('customers');
    try {
      const res = await getProductPreBookingInsightAction(productId);
      if (res.success) {
        setInsightData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsight(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: 'rgba(22, 163, 74, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} /> OPEN
          </span>
        );
      case 'UPCOMING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Clock size={10} /> UPCOMING
          </span>
        );
      case 'SOLD_OUT':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <AlertTriangle size={10} /> SOLD OUT
          </span>
        );
      case 'LAUNCHED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: 'rgba(200, 164, 106, 0.15)', color: '#c8a46a', border: '1px solid rgba(200, 164, 106, 0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Sparkles size={10} /> LAUNCHED
          </span>
        );
      case 'CLOSED':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: 'rgba(113, 113, 122, 0.15)', color: '#a1a1aa', border: '1px solid rgba(113, 113, 122, 0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            CLOSED
          </span>
        );
    }
  };

  return (
    <div style={{ padding: '24px 32px', color: '#ffffff', fontFamily: 'var(--font-body)', background: '#050505', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
            Pre-Booking Operations & Allocation Control
          </h1>
          <p style={{ fontSize: 13, color: '#a1a1aa', margin: '4px 0 0 0' }}>
            Monitor reserve allocations, real-time customer demand, and launch readiness across all releases.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/admin/products/new?isPreBooking=true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: '#c8a46a',
              color: '#050505',
              borderRadius: 4,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            + Create New Pre-Booking Release
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards (4 Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Active Paid Pre-Bookings</span>
            <Clock size={16} color="#c8a46a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginTop: 10, fontFamily: 'monospace' }}>
            {metrics.totalActivePreBookings}
          </div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
            Verified Paid Pre-Orders
          </div>
        </div>

        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Reserved Volume</span>
            <ShieldCheck size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#c8a46a', marginTop: 10, fontFamily: 'monospace' }}>
            ₹{metrics.totalReservedVolume.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
            Total Paid Revenue Reserved
          </div>
        </div>

        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Units Ring-Fenced</span>
            <ArrowUpRight size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginTop: 10, fontFamily: 'monospace' }}>
            {metrics.totalUnitsRingFenced} Pcs
          </div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
            Allocated Atelier Stock
          </div>
        </div>

        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Demand Interest</span>
            <Bell size={16} color="#a855f7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', marginTop: 10, fontFamily: 'monospace' }}>
            {metrics.totalInterestCount}
          </div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>
            Notify-Me Registered Users
          </div>
        </div>
      </div>

      {/* Pre-Booking Releases Table */}
      <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
            Pre-Booking Products & Release Allocations ({products.length})
          </h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#e4e4e7', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '14px 20px' }}>Product</th>
              <th style={{ padding: '14px 16px' }}>Channel</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Launch Date</th>
              <th style={{ padding: '14px 16px' }}>Pre-Booked / Max</th>
              <th style={{ padding: '14px 16px' }}>Demand Interest</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px 20px', textAlign: 'center', color: '#71717a' }}>
                  No Pre-Booking releases found in database.
                </td>
              </tr>
            ) : (
              products.map((prod: any) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={prod.frontImageUrl || '/images/placeholder.svg'}
                        alt={prod.name}
                        style={{ width: 40, height: 48, objectFit: 'cover', borderRadius: 4, background: '#000' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#ffffff' }}>{prod.name}</div>
                        <div style={{ fontSize: 11, color: '#71717a' }}>
                          ₹{prod.price.toLocaleString('en-IN')} | Dispatch: {prod.preBookingExpectedDispatch}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, background: 'rgba(255, 255, 255, 0.06)', color: '#d4d4d8', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {prod.channel || 'DROP'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    {renderStatusBadge(prod.computedStatus)}
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#a1a1aa' }}>
                    {prod.launchDateTime ? new Date(prod.launchDateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Immediate Launch'}
                  </td>

                  <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>
                    <span style={{ color: '#c8a46a', fontWeight: 700 }}>{prod.currentPreBookings}</span> / {prod.maxPreBooking} Pcs
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#a855f7', fontWeight: 600 }}>
                      <Bell size={12} /> {prod.interestCount} Interested
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenInsight(prod.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 4,
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Eye size={12} /> View Insight
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Insight Side Drawer */}
      {insightDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 540, maxWidth: '100%', background: '#0d0d0f', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <div style={{ padding: 20, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
                  Pre-Booking Insight: {insightData?.product?.name || 'Loading...'}
                </h3>
                <p style={{ fontSize: 11, color: '#71717a', margin: '2px 0 0 0' }}>
                  Audited customer reservations & interest records
                </p>
              </div>
              <button
                onClick={() => setInsightDrawerOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: '#121215' }}>
              <button
                onClick={() => setActiveTab('customers')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: activeTab === 'customers' ? '#0d0d0f' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'customers' ? '2px solid #c8a46a' : 'none',
                  color: activeTab === 'customers' ? '#c8a46a' : '#a1a1aa',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <ShoppingBag size={12} /> Paid Customers ({insightData?.paidCustomers?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('interest')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: activeTab === 'interest' ? '#0d0d0f' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'interest' ? '2px solid #c8a46a' : 'none',
                  color: activeTab === 'interest' ? '#c8a46a' : '#a1a1aa',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Bell size={12} /> Interested Users ({insightData?.interestedUsers?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('attempts')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: activeTab === 'attempts' ? '#0d0d0f' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'attempts' ? '2px solid #c8a46a' : 'none',
                  color: activeTab === 'attempts' ? '#c8a46a' : '#a1a1aa',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Info size={12} /> Unpaid Attempts ({insightData?.unpaidAttempts?.length || 0})
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {loadingInsight ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#71717a' }}>Loading audit records...</div>
              ) : (
                <>
                  {activeTab === 'customers' && (
                    <div>
                      {insightData?.paidCustomers?.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: '#71717a' }}>No paid orders for this release yet.</div>
                      ) : (
                        insightData?.paidCustomers?.map((cust: any) => (
                          <div key={cust.id} style={{ background: '#141418', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6, padding: 14, marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontWeight: 600, color: '#ffffff', fontSize: 13 }}>{cust.customerName}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>₹{cust.total.toLocaleString('en-IN')} (PAID)</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#a1a1aa' }}>Order #{cust.orderNumber} | Size: {cust.size} | Qty: {cust.quantity}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4 }}>
                              Email: {cust.email} | Date: {new Date(cust.createdAt).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'interest' && (
                    <div>
                      {insightData?.interestedUsers?.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: '#71717a' }}>No Notify-Me registrations found.</div>
                      ) : (
                        insightData?.interestedUsers?.map((user: any) => (
                          <div key={user.id} style={{ background: '#141418', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6, padding: 14, marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: '#ffffff', fontSize: 13 }}>{user.customerName}</span>
                              <span style={{ fontSize: 10, color: '#a855f7', fontWeight: 600 }}>NOTIFY REGISTERED</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#a1a1aa' }}>Email: {user.email} | Phone: {user.phone}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4 }}>
                              Registered On: {new Date(user.createdAt).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'attempts' && (
                    <div>
                      {insightData?.unpaidAttempts?.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: '#71717a' }}>No unpaid/abandoned checkout attempts.</div>
                      ) : (
                        insightData?.unpaidAttempts?.map((attempt: any) => (
                          <div key={attempt.id} style={{ background: '#141418', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 6, padding: 14, marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: '#ffffff', fontSize: 13 }}>{attempt.customerName}</span>
                              <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>{attempt.reason}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#a1a1aa' }}>Order #{attempt.orderNumber} | Amount: ₹{attempt.total.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4 }}>
                              Status: {attempt.paymentStatus} | Date: {new Date(attempt.createdAt).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
