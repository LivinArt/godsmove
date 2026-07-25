'use client';

import { useEffect, useState } from 'react';
import { getExclusiveDashboardData } from '@/actions/exclusive.actions';
import { ExclusiveAccessPanel } from './ExclusiveAccessPanel';
import { useAuth } from '@/context/AuthContext';

export function ExclusiveAccessClient() {
  const { openAuthModal } = useAuth();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExclusiveDashboardData()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ opacity: 0.5 }}>Loading exclusive access…</p>;
  if (error === 'UNAUTHORIZED') {
    return (
      <div style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ marginBottom: 16, opacity: 0.7 }}>Sign in to view your exclusive access.</p>
        <button type="button" onClick={() => openAuthModal('profile')} className="btn-primary">Sign In</button>
      </div>
    );
  }
  if (error) return <p style={{ opacity: 0.6 }}>{error}</p>;
  if (!data) return null;

  return <ExclusiveAccessPanel data={data} />;
}
