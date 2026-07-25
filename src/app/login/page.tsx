'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import styles from './login-page.module.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || searchParams.get('next') || '/profile';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Parse error query params
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setError(err);
  }, [searchParams]);

  // Google OAuth Login
  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
        <Image
          src="/images/logo/Scroll.png"
          alt="GODSMOVE"
          width={150}
          height={38}
          priority
          style={{ objectFit: 'contain' }}
        />
      </div>
      
      <h2 className={styles.title} style={{ fontWeight: 400, fontFamily: 'var(--font-heading)' }}>
        Join the Experience of Luxury with GODSMOVE
      </h2>
      <p className={styles.subtitle}>
        Sign in securely with Google to access your bag, wishlist, orders and exclusive member experiences.
      </p>

      {error && (
        <div style={{ fontSize: '12px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.12)', padding: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', marginBottom: '24px' }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ fontSize: '12px', textAlign: 'center', background: 'rgba(34, 197, 94, 0.12)', padding: '12px', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: '#22c55e', marginBottom: '24px' }}>
          {message}
        </div>
      )}

      {/* Google OAuth Action Button */}
      <button
        type="button"
        className={styles.btnGoogle}
        onClick={handleGoogleLogin}
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
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.25s ease',
        }}
      >
        {loading ? (
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
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
        <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
      </button>

      {/* Security Footer */}
      <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#c8a46a', fontWeight: 500 }}>
          <ShieldCheck size={13} />
          <span>Secure Authentication powered by Google</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
          <Link href="/policies" style={{ color: 'rgba(255, 255, 255, 0.45)', textDecoration: 'none' }}>Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" style={{ color: 'rgba(255, 255, 255, 0.45)', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className={`${styles.page} ${jakarta.className}`}>
      <div className={styles.card}>
        <Suspense fallback={<div className="text-zinc-500 text-center text-sm">Loading security protocols...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
