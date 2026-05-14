'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navGroups = [
  {
    label: 'Commerce',
    items: [
      { href: '/admin', label: 'Overview', icon: GridIcon, exact: true },
      { href: '/admin/orders', label: 'Orders', icon: PackageIcon },
      { href: '/admin/inventory', label: 'Inventory', icon: LayersIcon },
      { href: '/admin/returns', label: 'Returns', icon: ArrowLeftIcon },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products', icon: ShirtIcon },
      { href: '/admin/drops', label: 'Drops', icon: ZapIcon },
      { href: '/admin/discounts', label: 'Discounts', icon: TagIcon },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: UsersIcon },
    ],
  },
  {
    label: 'Culture',
    items: [
      { href: '/admin/editorial', label: 'Editorial / CMS', icon: PenIcon },
    ],
  },
];

// Role-based nav restrictions
const ROLE_RESTRICTIONS: Record<string, string[]> = {
  CONTENT_EDITOR: ['/admin/editorial'],
  OPERATIONS: ['/admin', '/admin/orders', '/admin/inventory', '/admin/returns'],
  SUPPORT: ['/admin', '/admin/orders', '/admin/returns', '/admin/customers'],
  MARKETING: ['/admin', '/admin/discounts', '/admin/drops'],
};

interface Props {
  role: string;
}

export default function AdminSidebar({ role }: Props) {
  const pathname = usePathname();

  const isAllowed = (href: string) => {
    if (role === 'ADMIN') return true;
    const allowed = ROLE_RESTRICTIONS[role] ?? [];
    return allowed.some((r) => href === r || href.startsWith(r + '/'));
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="admin-sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-dot" />
        GODSMOVE
      </div>

      {navGroups.map((group) => (
        <div key={group.label} className="sidebar-section">
          <div className="sidebar-label">{group.label}</div>
          {group.items.map((item) => {
            if (!isAllowed(item.href)) return null;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
              >
                <item.icon />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <div className="sidebar-section" style={{ borderTop: '1px solid var(--admin-border)' }}>
        <div className="sidebar-label">Role</div>
        <div style={{ padding: '6px 12px', fontSize: 12, color: 'var(--admin-muted)', fontWeight: 600 }}>
          {role}
        </div>
      </div>
    </nav>
  );
}

// ── ICONS (inline SVG — no dependency) ───────────────────────────────────────

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

function ShirtIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
