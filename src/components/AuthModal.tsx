'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './AuthModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setEmail('');
      setOtp(['', '', '', '', '', '']);
      setStep('email');
      setError(null);
      setMessage(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
      setLoading(false);
    }
  }

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
        },
      });
      if (error) throw error;

      setStep('otp');
      setMessage(`Security code sent to ${email}`);
      // Focus first OTP field
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send security code');
    } finally {
      setLoading(false);
    }
  }

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

      // Successful login
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid security code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, val: string) {
    if (isNaN(Number(val))) return; // only allow numbers

    const newOtp = [...otp];
    // Take only the last character if pasted/entered
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto-focus next field
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Auto-focus previous field on backspace if current field is empty
      otpRefs.current[index - 1]?.focus();
    }
  }

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} strokeWidth={1.5} />
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <img
            src="/images/logo/logo-horizontal-white.png"
            alt="GODSMOVE"
            style={{ height: '22px', width: 'auto' }}
          />
        </div>
        <h3 className={styles.title} style={{ fontWeight: 400, fontFamily: 'var(--font-heading)' }}>Welcome back.</h3>
        <p className={styles.subtitle}>Continue to your collection, or create your GODSMOVE profile.</p>

        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}

        {step === 'email' ? (
          <>
            <button className={styles.btnGoogle} onClick={handleGoogleLogin} disabled={loading}>
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

            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="auth-email" className={styles.label}>Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? 'Sending...' : 'Continue with Email'}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>
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

            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
              {!loading && <ArrowRight size={14} />}
            </button>

            <p className={styles.resendText} onClick={handleSendOtp}>
              Didn't receive the code? Resend email
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
