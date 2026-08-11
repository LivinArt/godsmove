'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Crown, RefreshCw, Loader2, ArrowUpRight, Ban, Calendar, CheckCircle, AlertCircle, X } from 'lucide-react';
import { getAdminMembers, endAdminMembership, renewAdminMembership } from '@/actions/membership.actions';

export default function AdminMembersPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [endTarget, setEndTarget] = useState<any | null>(null);
  const [renewTarget, setRenewTarget] = useState<any | null>(null);
  const [renewMonths, setRenewMonths] = useState<number>(12);
  const [customMonthsInput, setCustomMonthsInput] = useState<string>('12');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await getAdminMembers({
        status: statusFilter,
        search,
        page,
        limit: 20,
      });
      setMemberships(res.memberships);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to fetch admin members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const handleEndMembership = async () => {
    if (!endTarget) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await endAdminMembership(endTarget.id);
      setActionMessage({ type: 'success', text: `Membership for ${endTarget.profile?.email} has been cancelled.` });
      setEndTarget(null);
      fetchMembers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to end membership.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewMembership = async () => {
    if (!renewTarget) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const finalMonths = renewMonths === 0 ? parseInt(customMonthsInput, 10) || 12 : renewMonths;
      await renewAdminMembership(renewTarget.id, finalMonths);
      setActionMessage({ type: 'success', text: `Membership for ${renewTarget.profile?.email} renewed for ${finalMonths} months.` });
      setRenewTarget(null);
      fetchMembers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to renew membership.' });
    } finally {
      setActionLoading(false);
    }
  };

  const now = new Date();

  return (
    <div className="admin-page-container">
      <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-title" style={{ fontSize: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crown size={22} style={{ color: '#c5a059' }} />
            MANAGE MEMBERS
          </h1>
          <p className="admin-page-subtitle" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            Database-backed GODSMOVE membership accounts ({totalCount} total)
          </p>
        </div>

        <button
          onClick={fetchMembers}
          className="admin-btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '20px',
            background: actionMessage.type === 'success' ? 'rgba(76, 217, 100, 0.12)' : 'rgba(255, 59, 48, 0.12)',
            border: actionMessage.type === 'success' ? '1px solid rgba(76, 217, 100, 0.3)' : '1px solid rgba(255, 59, 48, 0.3)',
            color: actionMessage.type === 'success' ? '#4cd964' : '#ff3b30',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 'auto' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ padding: '16px 20px', marginBottom: '24px', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Search member name, email, or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px', paddingRight: '12px', height: '40px', background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Filter size={15} style={{ color: 'rgba(255,255,255,0.5)' }} />
            {['ALL', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  borderRadius: '4px',
                  border: statusFilter === st ? '1px solid #c5a059' : '1px solid rgba(255,255,255,0.1)',
                  background: statusFilter === st ? 'rgba(197,160,89,0.15)' : 'rgba(255,255,255,0.03)',
                  color: statusFilter === st ? '#c5a059' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Members Data Table */}
      <div className="admin-card" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#c5a059' }} />
          </div>
        ) : memberships.length === 0 ? (
          <div style={{ textTransform: 'uppercase', textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', letterSpacing: '0.1em' }}>
            No membership records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 16px' }}>Member</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px' }}>Source</th>
                  <th style={{ padding: '14px 16px' }}>Start Date</th>
                  <th style={{ padding: '14px 16px' }}>End Date</th>
                  <th style={{ padding: '14px 16px' }}>Remaining</th>
                  <th style={{ padding: '14px 16px' }}>Source Order</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => {
                  const profileName = [m.profile?.firstName, m.profile?.lastName].filter(Boolean).join(' ') || 'Collector';
                  const isEffectiveActive = m.status === 'ACTIVE' && m.expiresAt && new Date(m.expiresAt) > now;
                  const displayStatus = isEffectiveActive ? 'ACTIVE' : m.status === 'ACTIVE' ? 'EXPIRED' : m.status;
                  
                  const daysLeft = m.expiresAt && new Date(m.expiresAt) > now
                    ? Math.max(0, Math.ceil((new Date(m.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                    : 0;

                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.9)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {displayStatus === 'ACTIVE' && <Crown size={13} style={{ color: '#c5a059' }} />}
                            {profileName}
                          </span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{m.profile?.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            padding: '4px 10px',
                            borderRadius: '100px',
                            background: displayStatus === 'ACTIVE' ? 'rgba(76, 217, 100, 0.12)' : displayStatus === 'CANCELLED' ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                            color: displayStatus === 'ACTIVE' ? '#4cd964' : displayStatus === 'CANCELLED' ? '#ff3b30' : 'rgba(255,255,255,0.5)',
                            border: displayStatus === 'ACTIVE' ? '1px solid rgba(76, 217, 100, 0.3)' : displayStatus === 'CANCELLED' ? '1px solid rgba(255, 59, 48, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          ● {displayStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#c5a059', letterSpacing: '0.05em' }}>
                          {m.source === 'PRE_BOOKING' ? 'PRE-BOOKING' : m.source}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                        {m.activatedAt
                          ? new Date(m.activatedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                        {m.expiresAt
                          ? new Date(m.expiresAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 500 }}>
                        {displayStatus === 'ACTIVE' ? `${daysLeft} days` : displayStatus === 'CANCELLED' ? 'Cancelled' : 'Expired'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {m.sourceOrder ? (
                          <Link
                            href={`/admin/orders?search=${m.sourceOrder.orderNumber}`}
                            style={{ color: '#c5a059', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                          >
                            #{m.sourceOrder.orderNumber} <ArrowUpRight size={12} />
                          </Link>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setRenewTarget(m);
                              setRenewMonths(12);
                            }}
                            style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'rgba(197, 160, 89, 0.12)', border: '1px solid rgba(197, 160, 89, 0.3)', color: '#c5a059', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Renew
                          </button>
                          {m.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => setEndTarget(m)}
                              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.25)', color: '#ff3b30', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              End
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* END MEMBERSHIP CONFIRMATION MODAL */}
      {endTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#121212', border: '1px solid rgba(255,59,48,0.3)', borderRadius: '8px', maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#ff3b30' }}>
              <Ban size={20} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>End GODSMOVE Membership?</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '20px' }}>
              Are you sure you want to cancel the membership for <strong>{endTarget.profile?.email}</strong>? The membership status will be set to CANCELLED while preserving historical records.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setEndTarget(null)}
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleEndMembership}
                style={{ padding: '10px 16px', background: '#ff3b30', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, borderRadius: '4px', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
              >
                {actionLoading ? 'Ending...' : 'Confirm End Membership'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENEW MEMBERSHIP MODAL */}
      {renewTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#121212', border: '1px solid rgba(197,160,89,0.3)', borderRadius: '8px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#c5a059' }}>
              <Crown size={20} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Renew Membership</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '20px' }}>
              Select renewal duration for <strong>{renewTarget.profile?.email}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[3, 6, 12, 0].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setRenewMonths(m)}
                    style={{
                      padding: '10px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: renewMonths === m ? '1px solid #c5a059' : '1px solid rgba(255,255,255,0.1)',
                      background: renewMonths === m ? 'rgba(197,160,89,0.15)' : 'rgba(255,255,255,0.03)',
                      color: renewMonths === m ? '#c5a059' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                    }}
                  >
                    {m === 0 ? 'Custom' : `${m} Months`}
                  </button>
                ))}
              </div>

              {renewMonths === 0 && (
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>
                    Custom Duration (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={customMonthsInput}
                    onChange={(e) => setCustomMonthsInput(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              )}

              {/* Preview Dates */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Current End Date</span>
                  <span style={{ color: '#fff', fontWeight: 500 }}>
                    {renewTarget.expiresAt ? new Date(renewTarget.expiresAt).toLocaleDateString('en-IN') : 'Expired'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>New End Date</span>
                  <span style={{ color: '#c5a059', fontWeight: 600 }}>
                    {(() => {
                      const addM = renewMonths === 0 ? parseInt(customMonthsInput, 10) || 12 : renewMonths;
                      const base = renewTarget.expiresAt && new Date(renewTarget.expiresAt) > now ? new Date(renewTarget.expiresAt) : new Date();
                      const result = new Date(base);
                      result.setMonth(result.getMonth() + addM);
                      return result.toLocaleDateString('en-IN');
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setRenewTarget(null)}
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRenewMembership}
                style={{ padding: '10px 16px', background: '#c5a059', border: 'none', color: '#000', fontSize: '12px', fontWeight: 700, borderRadius: '4px', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
              >
                {actionLoading ? 'Renewing...' : 'Confirm Renewal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

