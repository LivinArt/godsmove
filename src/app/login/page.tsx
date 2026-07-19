'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Plus_Jakarta_Sans } from 'next/font/google';
import styles from './login-page.module.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/profile';

  // Tabs: 'email' (OTP code) | 'password' (Password credential)
  const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

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
      setError(err.message || 'Google authentication failed');
      setLoading(false);
    }
  }

  // OTP Request
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;

      setStep('otp');
      setMessage(`Security code sent to ${email}`);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send security code');
    } finally {
      setLoading(false);
    }
  }

  // OTP Verification
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.join('');
    if (token.length < 6) {
      setError('Please enter the complete 6-digit security code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;

      // Ensure gm_logged_out cookie is removed upon successful login
      document.cookie = 'gm_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid security code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Password Sign In
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Handle Remember Me session longevity configurations
      document.cookie = 'gm_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setLoading(false);
    }
  }

  // OTP Fields navigation
  function handleOtpChange(index: number, val: string) {
    if (isNaN(Number(val))) return;

    const newOtp = [...otp];
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  // Dev Mode Sandbox Bypass Actions
  const handleDevBypass = (role: 'ADMIN' | 'USER') => {
    // Clear sign out cookies and set dev role cookie
    document.cookie = 'gm_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = `gm_dev_role=${role}; path=/; max-age=604800;`;
    
    setMessage(`Bypassed as Dev ${role}. Synchronizing workspace...`);
    setTimeout(() => {
      router.push(redirectTo);
      router.refresh();
    }, 400);
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <img
          src="/images/logo/logo-horizontal-white.png"
          alt="GODSMOVE"
          style={{ height: '24px', width: 'auto' }}
        />
      </div>
      
      <h2 className={styles.title} style={{ fontWeight: 400, fontFamily: 'var(--font-heading)' }}>
        Welcome Back.
      </h2>
      <p className={styles.subtitle}>Worn With Intent. Authenticate to manage your collections.</p>

      {error && <p className={styles.error} style={{ fontSize: '11px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '2px', color: '#ef4444', marginBottom: '20px' }}>{error}</p>}
      {message && <p className={styles.success} style={{ fontSize: '11px', textAlign: 'center', background: 'rgba(34, 197, 94, 0.1)', padding: '10px', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '2px', color: '#22c55e', marginBottom: '20px' }}>{message}</p>}

      {step === 'input' ? (
        <>
          {/* Tab Switcher Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'email' ? '2px solid #fff' : '2px solid transparent',
                color: activeTab === 'email' ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                padding: '12px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Security Code (OTP)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'password' ? '2px solid #fff' : '2px solid transparent',
                color: activeTab === 'password' ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                padding: '12px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Password
            </button>
          </div>

          <button className={styles.btnGoogle} onClick={handleGoogleLogin} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.823-6.3-6.3s2.822-6.3 6.3-6.3c1.706 0 3.23.684 4.35 1.797l3.07-3.07C19.385 2.766 15.992 1.5 12.24 1.5 6.42 1.5 1.7 6.22 1.7 12s4.72 10.5 10.54 10.5c5.73 0 10.54-4.12 10.54-10.5 0-.712-.06-1.215-.22-1.715H12.24z" />
            </svg>
            Continue with Google
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          {activeTab === 'email' ? (
            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="login-email" className={styles.label}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="Enter email address"
                    className={styles.input}
                    style={{ paddingLeft: '38px' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={loading} style={{ cursor: 'pointer' }}>
                {loading ? 'Sending Code...' : 'Continue with Email'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="password-email" className={styles.label}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    id="password-email"
                    type="email"
                    required
                    placeholder="Enter email address"
                    className={styles.input}
                    style={{ paddingLeft: '38px' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="login-password" className={styles.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="Enter password"
                    className={styles.input}
                    style={{ paddingLeft: '38px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#c8a46a', width: '14px', height: '14px', cursor: 'pointer' }}
                />
                <label htmlFor="remember-me" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', userSelect: 'none' }}>
                  Remember me on this device
                </label>
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={loading} style={{ cursor: 'pointer' }}>
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>
          )}

          {/* Dev Mode Sandbox Bypasses */}
          {isDevMode && (
            <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(200, 164, 106, 0.04)', border: '1px solid rgba(200, 164, 106, 0.15)', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#c8a46a', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Sparkles size={12} />
                <span>Dev Sandbox Session Bypass</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleDevBypass('ADMIN')}
                  className={styles.btnSubmit}
                  style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '10px', padding: '10px', height: 'auto', cursor: 'pointer' }}
                >
                  Bypass as Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDevBypass('USER')}
                  className={styles.btnSubmit}
                  style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '10px', padding: '10px', height: 'auto', cursor: 'pointer' }}
                >
                  Bypass as Customer
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleVerifyOtp} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Enter 6-Digit Security Code</label>
            <div className={styles.otpGrid}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className={styles.otpInput}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  disabled={loading}
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={loading} style={{ cursor: 'pointer' }}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
            {!loading && <ArrowRight size={14} />}
          </button>

          <p className={styles.resendText} onClick={handleSendOtp} style={{ cursor: 'pointer', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '12px' }}>
            Didn't receive the code? Resend email
          </p>
        </form>
      )}
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
