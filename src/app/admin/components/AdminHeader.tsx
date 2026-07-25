'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Props {
  user: { name: string; role: string };
}

export default function AdminHeader({ user }: Props) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <header className="admin-header">
      <div style={{ fontSize: 13, color: 'var(--admin-muted)' }}>
        Internal Operations Console
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)' }}>
            {user.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {user.role}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '7px 14px',
            background: 'var(--admin-surface-2)',
            border: '1px solid var(--admin-border-2)',
            borderRadius: 7,
            color: 'var(--admin-muted)',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
