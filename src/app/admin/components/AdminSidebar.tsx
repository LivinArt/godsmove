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
      { href: '/admin/care', label: 'GODSMOVE Care', icon: HeartIcon },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products', icon: ShirtIcon },
      { href: '/admin/categories', label: 'Categories', icon: FolderIcon },
      { href: '/admin/collections', label: 'Collections', icon: CollectionIcon },
      { href: '/admin/drops', label: 'Drops', icon: ZapIcon },
      { href: '/admin/discounts', label: 'Discounts', icon: TagIcon },
      { href: '/admin/exclusive-draws', label: 'Exclusive Draws', icon: LockIcon },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: UsersIcon },
      { href: '/admin/communication', label: 'Communication', icon: MegaphoneIcon },
    ],
  },
  {
    label: 'Culture',
    items: [
      { href: '/admin/editorial', label: 'Editorial / CMS', icon: PenIcon },
      { href: '/admin/hero-slides', label: 'Homepage hero', icon: ImageStackIcon },
    ],
  },
];

// Role-based nav restrictions
const ROLE_RESTRICTIONS: Record<string, string[]> = {
  CONTENT_EDITOR: ['/admin/editorial', '/admin/hero-slides', '/admin/collections', '/admin/categories'],
  OPERATIONS: ['/admin', '/admin/orders', '/admin/inventory', '/admin/returns', '/admin/care', '/admin/exclusive-draws', '/admin/categories', '/admin/collections'],
  SUPPORT: ['/admin', '/admin/orders', '/admin/returns', '/admin/care', '/admin/customers'],
  MARKETING: ['/admin', '/admin/discounts', '/admin/drops', '/admin/hero-slides', '/admin/collections', '/admin/communication', '/admin/marketing'],
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
        <img
          src="/images/logo/logo-horizontal-white.png"
          alt="GODSMOVE"
          style={{ height: '16px', width: 'auto', display: 'block' }}
        />
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

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function ImageStackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="14" height="12" rx="1" />
      <rect x="7" y="9" width="14" height="12" rx="1" opacity="0.9" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
    </svg>
  );
}
