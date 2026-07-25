'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { initiateGoogleOAuth } from '@/lib/auth/oauth';
import Image from 'next/image';
import { LuxuryAuthLoader } from '@/components/LuxuryAuthLoader';

function AdminLoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'access_denied') {
      setError('Access Denied: This Google account is not authorised to access the GODSMOVE Administration Portal.');
    } else if (err) {
      setError(err);
    }
  }, [searchParams]);

  // Google OAuth Login specifically for Admin Portal
  async function handleAdminGoogleLogin() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await initiateGoogleOAuth(supabase, '/admin');
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <LuxuryAuthLoader isVisible={loading} title="Authenticating Admin..." subtitle="Verifying security credentials" />
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '48px 36px',
          background: 'rgba(12, 12, 12, 0.95)',
          border: '1px solid rgba(250, 248, 245, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(200, 164, 106, 0.15)',
          display: loading ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
      {/* Brand Logo */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
        <Image
          src="/images/logo/auth-modal-logo.png"
          alt="GODSMOVE ADMIN"
          width={160}
          height={40}
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '20px',
          fontWeight: 400,
          letterSpacing: '0.04em',
          color: '#FAF8F5',
          margin: '0 0 8px',
          textTransform: 'uppercase',
        }}
      >
        GODSMOVE ADMIN
      </h1>
      
      <p
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: '#c8a46a',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          margin: '0 0 32px',
        }}
      >
        GODSMOVE Administration Portal · Administrator Access
      </p>

      {/* Access Denied Alert */}
      {error && (
        <div
          role="alert"
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#ef4444',
            fontSize: '12px',
            lineHeight: 1.5,
            fontWeight: 500,
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            textAlign: 'left',
            boxSizing: 'border-box',
          }}
        >
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Google OAuth Action Button */}
      <button
        type="button"
        onClick={handleAdminGoogleLogin}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: '#FAF8F5',
          color: '#0c0c0c',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          padding: '16px 24px',
          fontFamily: 'var(--font-heading)',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          borderRadius: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#0c0c0c' }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>{loading ? 'Authenticating…' : 'Continue with Google'}</span>
      </button>

      {/* Security Note */}
      <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(250, 248, 245, 0.4)' }}>
        <ShieldCheck size={13} style={{ color: '#c8a46a' }} />
        <span>Restricted Area · Authorized Personnel Only</span>
      </div>
    </div>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#060606',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <Suspense fallback={<div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Loading admin security protocols…</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
