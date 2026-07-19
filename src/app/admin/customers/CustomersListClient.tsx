'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CustomerSegmentService } from '@/lib/customer-segment-service';
import { bulkAddWalletCredits, bulkSendCampaign, bulkTagCustomers } from '@/actions/admin-customer.actions';

interface Customer {
  id: string;
  email: string;
  godsmoveId: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  ordersCount: number;
  lifetimeSpend: number;
  walletBalance: number;
  emailConfirmed: boolean;
  lastLogin: string | null;
  loginMethod: string;
  isBlocked: boolean;
  dob: string | null;
  tier: string;
  lastPurchaseDate: string | null;
}

const FILTER_OPTIONS = [
  { key: 'REGISTERED_TODAY', label: 'Registered Today' },
  { key: 'REGISTERED_THIS_WEEK', label: 'Registered This Week' },
  { key: 'REGISTERED_THIS_MONTH', label: 'Registered This Month' },
  { key: 'NEW_CUSTOMERS', label: 'New (Last 30 Days)' },
  { key: 'FIRST_PURCHASE', label: 'First Purchase' },
  { key: 'REPEAT_CUSTOMERS', label: 'Repeat Customers' },
  { key: 'HIGH_VALUE', label: 'High Value (₹10k+)' },
  { key: 'VIP', label: 'VIP / Inner Circle' },
  { key: 'NO_ORDERS', label: 'No Orders' },
  { key: 'INACTIVE', label: 'Inactive (30 Days+)' },
  { key: 'BIRTHDAY_TODAY', label: 'Birthday Today' },
  { key: 'BIRTHDAY_THIS_WEEK', label: 'Birthday This Week' },
  { key: 'BIRTHDAY_THIS_MONTH', label: 'Birthday This Month' },
  { key: 'WALLET_BALANCE_GT_0', label: 'Credits Available' },
  { key: 'RECENTLY_PURCHASED', label: 'Recently Purchased (7 Days)' },
];

export default function CustomersListClient({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sortBy, setSortBy] = useState<'JOINED' | 'SPEND' | 'BALANCE'>('JOINED');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Selected row state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  // Form states for bulk credit modal
  const [creditAmount, setCreditAmount] = useState('1000');
  const [creditSource, setCreditSource] = useState('Campaign Credits');
  const [creditReason, setCreditReason] = useState('');
  const [creditExpiry, setCreditExpiry] = useState('');

  // Form states for campaign modal
  const [campaignType, setCampaignType] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [campaignSchedule, setCampaignSchedule] = useState('');

  // Form states for tag modal
  const [tagName, setTagName] = useState('');

  const [loadingAction, setLoadingAction] = useState(false);

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
    }).format(new Date(dateStr));
  };

  const getInitials = (first: string | null, last: string | null) => {
    const f = first?.[0] || '';
    const l = last?.[0] || '';
    return (f + l).toUpperCase() || '?';
  };

  // Filter & Search logic using Segmenting Service
  const filteredCustomers = useMemo(() => {
    // 1. First pass: filter by search string
    const searched = initialCustomers.filter((c) => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const query = search.toLowerCase();
      return (
        fullName.includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)) ||
        (c.godsmoveId && c.godsmoveId.toLowerCase().includes(query))
      );
    });

    // 2. Second pass: filter by combinable filters list & date ranges
    const customDateRange = {
      start: dateStart || null,
      end: dateEnd || null,
    };

    return CustomerSegmentService.filterCustomers(searched, activeFilters, customDateRange);
  }, [initialCustomers, search, activeFilters, dateStart, dateEnd]);

  // Sorting Logic
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'JOINED') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'SPEND') {
        comparison = a.lifetimeSpend - b.lifetimeSpend;
      } else if (sortBy === 'BALANCE') {
        comparison = a.walletBalance - b.walletBalance;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    return sorted;
  }, [filteredCustomers, sortBy, sortOrder]);

  // Pagination Logic
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedCustomers.slice(start, start + itemsPerPage);
  }, [sortedCustomers, page]);

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);

  const toggleSort = (field: 'JOINED' | 'SPEND' | 'BALANCE') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleFilterToggle = (key: string) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setPage(1);
    setSelectedIds([]);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setDateStart('');
    setDateEnd('');
    setPage(1);
    setSelectedIds([]);
  };

  // Checkbox interactions
  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectPage = () => {
    const pageIds = paginatedCustomers.map((c) => c.id);
    const allPageSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = sortedCustomers.map((c) => c.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  // Bulk executions
  const handleBulkAddCredits = async () => {
    if (selectedIds.length === 0) return;
    setLoadingAction(true);
    try {
      const res = await bulkAddWalletCredits(
        selectedIds,
        Number(creditAmount),
        creditSource,
        creditReason || `Promo credit allocation: ${creditSource}`,
        creditExpiry || undefined
      );
      alert(`Successfully added ${formatINR(Number(creditAmount))} to ${res.count} customers.`);
      setCreditModalOpen(false);
      setSelectedIds([]);
      window.location.reload();
    } catch (err: any) {
      alert(`Bulk Credit failed: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBulkSendCampaign = async () => {
    if (selectedIds.length === 0) return;
    setLoadingAction(true);
    try {
      const scheduledMsg = campaignSchedule ? ` (Scheduled for ${campaignSchedule})` : '';
      const res = await bulkSendCampaign(
        selectedIds,
        campaignType,
        campaignSubject,
        campaignMessage + scheduledMsg
      );
      alert(`Successfully processed bulk ${campaignType} campaign to ${res.count} recipients.`);
      setCampaignModalOpen(false);
      setSelectedIds([]);
    } catch (err: any) {
      alert(`Campaign failed: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBulkTag = async () => {
    if (!tagName.trim() || selectedIds.length === 0) return;
    setLoadingAction(true);
    try {
      const res = await bulkTagCustomers(selectedIds, tagName.trim());
      alert(`Successfully tagged ${res.count} customers with: [${tagName.trim()}]`);
      setTagModalOpen(false);
      setTagName('');
      setSelectedIds([]);
      window.location.reload();
    } catch (err: any) {
      alert(`Tagging failed: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExportCSV = () => {
    const selectedCustomers = sortedCustomers.filter((c) => selectedIds.includes(c.id));
    if (selectedCustomers.length === 0) return;

    const headers = ['ID', 'Email', 'GM ID', 'First Name', 'Last Name', 'Phone', 'Joined', 'Orders', 'Spend', 'Balance', 'Tier'];
    const rows = selectedCustomers.map((c) => [
      c.id,
      c.email,
      c.godsmoveId || '',
      c.firstName || '',
      c.lastName || '',
      c.phone || '',
      c.createdAt,
      c.ordersCount,
      c.lifetimeSpend,
      c.walletBalance,
      c.tier,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `godsmove_crm_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ color: 'var(--admin-text)' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Customer CRM</h1>
          <p className="page-sub" style={{ fontSize: 13, color: 'var(--admin-muted)' }}>
            Showing {filteredCustomers.length} of {initialCustomers.length} luxury customer accounts
          </p>
        </div>
      </div>

      {/* Main CRM Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT: Multi-Select Filter Panel */}
        <div className="admin-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters</h3>
            {activeFilters.length > 0 && (
              <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: 'var(--admin-accent)', fontSize: 11, cursor: 'pointer' }}>
                Clear All
              </button>
            )}
          </div>

          {/* Registration Date Pickers */}
          <div style={{ borderTop: '1px solid var(--admin-border-2)', paddingTop: 12 }}>
            <label style={{ fontSize: 11, color: 'var(--admin-muted)', display: 'block', marginBottom: 6 }}>Custom Date Range</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => { setDateStart(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: 6, fontSize: 11, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6 }}
              />
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => { setDateEnd(e.target.value); setPage(1); }}
                style={{ width: '100%', padding: 6, fontSize: 11, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6 }}
              />
            </div>
          </div>

          {/* Combinable Options Checklist */}
          <div style={{ borderTop: '1px solid var(--admin-border-2)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '420px', overflowY: 'auto' }}>
            <span style={{ fontSize: 11, color: 'var(--admin-muted)', display: 'block', marginBottom: 4 }}>Segment Categories</span>
            {FILTER_OPTIONS.map((opt) => {
              const isChecked = activeFilters.includes(opt.key);
              return (
                <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleFilterToggle(opt.key)}
                    style={{ accentColor: 'var(--admin-accent)' }}
                  />
                  <span style={{ color: isChecked ? 'var(--admin-accent)' : 'var(--admin-text)' }}>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Listing panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Top Search bar */}
          <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name, email, phone, or GODSMOVE ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                color: 'var(--admin-text)',
                fontSize: 13,
              }}
            />
          </div>

          {/* Selection & Bulk Actions Toolbar */}
          {selectedIds.length > 0 && (
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(217,119,6,0.1)',
                border: '1px solid rgba(217,119,6,0.25)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                ⚡ {selectedIds.length} customer{selectedIds.length > 1 ? 's' : ''} selected
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => setCampaignModalOpen(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>Send Campaign</button>
                <button onClick={() => setCreditModalOpen(true)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Add Credits</button>
                <button onClick={() => setTagModalOpen(true)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Tag Customers</button>
                <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Export CSV</button>
                <button onClick={() => setSelectedIds([])} style={{ background: 'none', border: 'none', color: 'var(--admin-muted)', cursor: 'pointer', fontSize: 12, marginLeft: 8 }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="admin-table-wrap" style={{ border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40, paddingLeft: 12 }}>
                    <input
                      type="checkbox"
                      checked={paginatedCustomers.length > 0 && paginatedCustomers.every((c) => selectedIds.includes(c.id))}
                      onChange={handleSelectPage}
                      style={{ accentColor: 'var(--admin-accent)', cursor: 'pointer' }}
                    />
                  </th>
                  <th>Customer</th>
                  <th>Spend Details</th>
                  <th onClick={() => toggleSort('BALANCE')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Credits Balance {sortBy === 'BALANCE' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th onClick={() => toggleSort('JOINED')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Joined Date {sortBy === 'JOINED' ? (sortOrder === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th>Status &amp; Tier</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--admin-muted)' }}>
                      No customer records matched your query.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c) => {
                    const isRowSelected = selectedIds.includes(c.id);
                    return (
                      <tr key={c.id} style={{ background: isRowSelected ? 'rgba(217,119,6,0.03)' : 'transparent' }}>
                        <td style={{ paddingLeft: 12 }}>
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={() => handleSelectRow(c.id)}
                            style={{ accentColor: 'var(--admin-accent)', cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'var(--admin-surface-2)',
                                border: '1px solid var(--admin-border-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                color: 'var(--admin-accent)',
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(c.firstName, c.lastName)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>
                                  {c.firstName || c.lastName
                                    ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
                                    : 'Unnamed Account'}
                                </span>
                                {c.godsmoveId && (
                                  <span className="mono" style={{ fontSize: 10, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-accent)', padding: '1px 5px', borderRadius: 4 }}>
                                    {c.godsmoveId}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                                {c.email} {c.phone && `• ${c.phone}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{formatINR(c.lifetimeSpend)} spend</div>
                          <div style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{c.ordersCount} paid orders</div>
                        </td>
                        <td style={{ fontWeight: 600, color: c.walletBalance > 0 ? 'var(--admin-accent)' : 'var(--admin-muted)' }}>
                          {formatINR(c.walletBalance)}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                          {formatDate(c.createdAt)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {c.isBlocked ? (
                              <span className="badge badge-red">Blocked</span>
                            ) : (
                              <span className="badge badge-green">Active</span>
                            )}
                            <span className={`badge ${c.tier === 'INNER_CIRCLE' ? 'badge-gold' : c.tier === 'VIP' ? 'badge-blue' : 'badge-grey'}`} style={{ textTransform: 'uppercase', fontSize: 9 }}>
                              {c.tier}
                            </span>
                          </div>
                        </td>
                        <td>
                          <Link href={`/admin/customers/${c.id}`} className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table select options & Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSelectPage} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>
                Select Current Page
              </button>
              <button onClick={handleSelectAllFiltered} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>
                Select All Filtered
              </button>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: 13, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 13, color: 'var(--admin-muted)' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: 13, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── BULK CREDIT ADJUSTMENT MODAL ── */}
      {creditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', width: 440, padding: 32, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Bulk Credits Adjustment</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-muted)' }}>
              Add promo or wallet credits to the {selectedIds.length} selected customers.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Credit Amount (₹)</label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                style={{ width: '100%', padding: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6, fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Credit Source/Event</label>
              <select
                value={creditSource}
                onChange={(e) => setCreditSource(e.target.value)}
                style={{ width: '100%', padding: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6, fontSize: 13 }}
              >
                <option value="Welcome Credits">Welcome Credits</option>
                <option value="Birthday Credits">Birthday Credits</option>
                <option value="Campaign Credits">Campaign Credits</option>
                <option value="Festival Credits">Festival Credits</option>
                <option value="VIP Credits">VIP Credits</option>
                <option value="Compensation Credits">Compensation Credits</option>
                <option value="Admin Manual Override">Admin Manual Override</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Audit Trail Reason</label>
              <input
                type="text"
                placeholder="Why are these credits being added?"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                style={{ width: '100%', padding: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6, fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Expiration Date (Optional)</label>
              <input
                type="date"
                value={creditExpiry}
                onChange={(e) => setCreditExpiry(e.target.value)}
                style={{ width: '100%', padding: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6, fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button disabled={loadingAction} onClick={() => setCreditModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button disabled={loadingAction} onClick={handleBulkAddCredits} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                {loadingAction ? 'Processing...' : 'Apply Credits'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK CAMPAIGN COMPOSER MODAL ── */}
      {campaignModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', width: 500, padding: 32, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Compose Bulk Campaign</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-muted)' }}>
              Broadcast to {selectedIds.length} target customers.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="radio" checked={campaignType === 'EMAIL'} onChange={() => setCampaignType('EMAIL')} style={{ accentColor: 'var(--admin-accent)' }} />
                <span>Email Campaign</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input type="radio" checked={campaignType === 'WHATSAPP'} onChange={() => setCampaignType('WHATSAPP')} style={{ accentColor: 'var(--admin-accent)' }} />
                <span>WhatsApp Broadcast</span>
              </label>
            </div>

            {campaignType === 'EMAIL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Subject Line</label>
                <input
                  type="text"
                  placeholder="Premium release title..."
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  style={{ width: '100%', padding: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6, fontSize: 13 }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Message Body</label>
              <textarea
                placeholder="Write your campaign details..."
                value={campaignMessage}
                onChange={(e) => setCampaignMessage(e.target.value)}
                rows={6}
                style={{ width: '100%', padding: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6, fontSize: 13, resize: 'vertical', fontFamily: 'sans-serif' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Schedule Dispatch (Optional)</label>
              <input
                type="datetime-local"
                value={campaignSchedule}
                onChange={(e) => setCampaignSchedule(e.target.value)}
                style={{ width: '100%', padding: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6, fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button disabled={loadingAction} onClick={() => setCampaignModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button disabled={loadingAction} onClick={handleBulkSendCampaign} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                {loadingAction ? 'Sending...' : campaignSchedule ? 'Schedule Broadcast' : 'Send Immediately'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK TAG CUSTOMERS MODAL ── */}
      {tagModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', width: 400, padding: 32, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Tag Selected Customers</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-muted)' }}>
              Append a tag to the administrative notes of {selectedIds.length} selected customers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Tag Name</label>
              <input
                type="text"
                placeholder="e.g. VIP-Cohort-2026"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                style={{ width: '100%', padding: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: 6, fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button disabled={loadingAction} onClick={() => setTagModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button disabled={loadingAction} onClick={handleBulkTag} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                {loadingAction ? 'Tagging...' : 'Add Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
