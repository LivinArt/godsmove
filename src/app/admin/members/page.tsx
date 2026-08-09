'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Crown, RefreshCw, Loader2, ArrowUpRight, ShieldCheck, User } from 'lucide-react';
import { getAdminMembers } from '@/actions/membership.actions';

export default function AdminMembersPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  return (
    <div className="admin-page-container">
      <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-title" style={{ fontSize: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crown size={22} style={{ color: '#d4af37' }} />
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
                  border: statusFilter === st ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.1)',
                  background: statusFilter === st ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                  color: statusFilter === st ? '#d4af37' : 'rgba(255,255,255,0.7)',
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
            <Loader2 size={24} className="animate-spin" style={{ color: '#d4af37' }} />
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
                  <th style={{ padding: '14px 20px' }}>Member</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Source</th>
                  <th style={{ padding: '14px 20px' }}>Activation Date</th>
                  <th style={{ padding: '14px 20px' }}>Source Order</th>
                  <th style={{ padding: '14px 20px' }}>Tier</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => {
                  const profileName = [m.profile?.firstName, m.profile?.lastName].filter(Boolean).join(' ') || 'Collector';
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.9)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: '#ffffff' }}>{profileName}</span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{m.profile?.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
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
                            background: m.status === 'ACTIVE' ? 'rgba(76, 217, 100, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                            color: m.status === 'ACTIVE' ? '#4cd964' : 'rgba(255,255,255,0.5)',
                            border: m.status === 'ACTIVE' ? '1px solid rgba(76, 217, 100, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          ● {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#d4af37', letterSpacing: '0.05em' }}>
                          {m.source === 'PRE_BOOKING' ? 'PRE-BOOKING' : m.source}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                        {m.activatedAt
                          ? new Date(m.activatedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {m.sourceOrder ? (
                          <Link
                            href={`/admin/orders?search=${m.sourceOrder.orderNumber}`}
                            style={{ color: '#d4af37', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                          >
                            #{m.sourceOrder.orderNumber} <ArrowUpRight size={12} />
                          </Link>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                          {m.tier || 'VIP'}
                        </span>
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
    </div>
  );
}
