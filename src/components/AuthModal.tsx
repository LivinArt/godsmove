'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { initiateGoogleOAuth } from '@/lib/auth/oauth';
import { useAuth } from '@/context/AuthContext';
import { updateMyProfileOnboarding } from '@/actions/profile.actions';
import { isProfileComplete } from '@/lib/profile-utils';
import styles from './AuthModal.module.css';
import CustomDatePicker from '@/components/ui/CustomDatePicker';

import { LuxuryAuthLoader } from './LuxuryAuthLoader';

export { isProfileComplete };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  redirectPath?: string;
  forceOnboarding?: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess, redirectPath, forceOnboarding = false }: Props) {
  const supabase = createClient();
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Prefer not to say'>('Prefer not to say');

  const isOnboardingStep = forceOnboarding || (Boolean(user) && !isProfileComplete(profile));

  useEffect(() => {
    if (user && profile) {
      if (profile.firstName) setName(profile.firstName);
      else if (user.user_metadata?.full_name) setName(user.user_metadata.full_name);

      if (profile.phone) {
        setPhone(profile.phone.replace(/^\+91/, '').trim());
      }

      if (profile.dob) {
        try {
          const d = new Date(profile.dob);
          if (!isNaN(d.getTime())) {
            setDob(d.toISOString().split('T')[0]);
          }
        } catch (e) {
          // ignore
        }
      }

      if (profile.gender && ['Male', 'Female', 'Prefer not to say'].includes(profile.gender)) {
        setGender(profile.gender as any);
      }
    }
  }, [user, profile]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleGoogleLogin() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      let pendingReturnUrl: string | undefined;
      if (typeof window !== 'undefined') {
        const pendingStr = sessionStorage.getItem('godsmove_pending_action');
        if (pendingStr) {
          try {
            const pending = JSON.parse(pendingStr);
            if (pending.type === 'checkout' || pending.type === 'BUY_NOW' || pending.redirect === '/checkout') {
              pendingReturnUrl = '/checkout';
            } else if (pending.type === 'profile') {
              pendingReturnUrl = '/profile';
            } else if (pending.type === 'membership') {
              pendingReturnUrl = '/membership';
            } else if (pending.url) {
              pendingReturnUrl = pending.url;
            }
          } catch (e) {
            // ignore
          }
        }
      }

      const destination = redirectPath || pendingReturnUrl ||
        (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/profile');
      const { error } = await initiateGoogleOAuth(supabase, destination);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again.');
      setLoading(false);
    }
  }

  async function handleOnboardingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const mobileDigits = cleanPhone.length === 12 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;
    if (!/^[6-9]\d{9}$/.test(mobileDigits)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!dob) {
      setError('Please enter your Date of Birth.');
      return;
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
      setError('Please enter a valid Date of Birth.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateMyProfileOnboarding({
        firstName: trimmedName,
        phone: mobileDigits,
        dob,
        gender,
      });

      if (res.success) {
        await refreshProfile();
        setLoading(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <LuxuryAuthLoader isVisible={loading} />
      <div
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
        onClick={loading ? undefined : onClose}
        style={{ display: loading ? 'none' : undefined }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div
          className={styles.container}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle */}
          <div className={styles.dragHandle} />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={styles.closeBtn}
            aria-label="Close authentication modal"
          >
            <X size={18} />
          </button>

          {/* Brand Header */}
          <div className={styles.brandHeader}>
            <Image
              src="/images/logo/auth-modal-logo.png"
              alt="GODSMOVE"
              width={130}
              height={32}
              className={styles.logo}
              priority
            />
          </div>

          {/* Render Step 1 (Google Login) or Step 2 (First-Time Onboarding Form) */}
          {!isOnboardingStep ? (
            <>
              {/* Main Headings */}
              <h2 id="auth-modal-title" className={styles.title}>
                Join the Experience of Luxury with GODSMOVE
              </h2>
              <p className={styles.subtitle}>
                Sign in securely with Google to access your bag, wishlist, orders and exclusive member experiences.
              </p>

              {/* Error Alert */}
              {error && (
                <div className={styles.errorBanner} role="alert">
                  <span>{error}</span>
                </div>
              )}

              {/* Google OAuth Action Button */}
              <div className={styles.actionWrap}>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className={styles.btnGoogle}
                  aria-label="Continue with Google"
                >
                  {loading ? (
                    <Loader2 className={styles.spinner} size={18} />
                  ) : (
                    <svg className={styles.googleIcon} width="18" height="18" viewBox="0 0 24 24">
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
              </div>
            </>
          ) : (
            <>
              {/* Step 2: First-Time Profile Onboarding */}
              <h2 id="auth-modal-title" className={styles.title}>
                WELCOME TO GODSMOVE
              </h2>
              <p className={styles.subtitle}>
                Complete your profile to continue.
              </p>

              {/* Error Alert */}
              {error && (
                <div className={styles.errorBanner} role="alert">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleOnboardingSubmit} className={styles.onboardingForm}>
                {/* 1. NAME */}
                <div className={styles.inputGroup}>
                  <label htmlFor="onboarding-name" className={styles.inputLabel}>
                    NAME
                  </label>
                  <input
                    id="onboarding-name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={styles.inputField}
                    disabled={loading}
                  />
                </div>

                {/* 2. MOBILE (+91 Fixed Prefix) */}
                <div className={styles.inputGroup}>
                  <label htmlFor="onboarding-phone" className={styles.inputLabel}>
                    MOBILE
                  </label>
                  <div className={styles.phoneInputWrap}>
                    <span className={styles.phonePrefix}>🇮🇳 +91</span>
                    <input
                      id="onboarding-phone"
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className={`${styles.inputField} ${styles.phoneField}`}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* 3. DATE OF BIRTH */}
                <div className={styles.inputGroup}>
                  <label htmlFor="onboarding-dob" className={styles.inputLabel}>
                    DATE OF BIRTH
                  </label>
                  <CustomDatePicker
                    id="onboarding-dob"
                    value={dob}
                    onChange={(dateStr) => setDob(dateStr)}
                    disabled={loading}
                  />
                </div>

                {/* 4. GENDER */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>GENDER</label>
                  <div className={styles.genderGroup}>
                    {(['Male', 'Female', 'Prefer not to say'] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`${styles.genderOption} ${gender === option ? styles.genderOptionActive : ''}`}
                        onClick={() => setGender(option)}
                        disabled={loading}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.btnSubmit}
                >
                  {loading ? (
                    <Loader2 className={styles.spinner} size={18} />
                  ) : (
                    <>
                      <span>SAVE & CONTINUE</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Luxury Footer */}
          <div className={styles.footer}>
            <div className={styles.securityNote}>
              <ShieldCheck size={13} className={styles.shieldIcon} />
              <span>Secure Authentication powered by Google</span>
            </div>
            <div className={styles.legalLinks}>
              <Link href="/privacy" onClick={onClose}>
                Privacy Policy
              </Link>
              <span className={styles.dot}>•</span>
              <Link href="/terms" onClick={onClose}>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
