'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { initiateGoogleOAuth } from '@/lib/auth/oauth';
import styles from './EarlyAccessRegisterModal.module.css';
import CustomDatePicker from '@/components/ui/CustomDatePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  initialPhone?: string;
  initialDob?: string;
  initialGender?: 'Male' | 'Female' | 'Prefer not to say';
}

export default function EarlyAccessRegisterModal({
  isOpen,
  onClose,
  initialName = '',
  initialPhone = '',
  initialDob = '',
  initialGender = 'Prefer not to say',
}: Props) {
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile Form State
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [dob, setDob] = useState(initialDob);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Prefer not to say'>(initialGender);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setLoading(false);
      if (initialName) setName(initialName);
      if (initialPhone) setPhone(initialPhone.replace(/^\+91/, '').trim());
      if (initialDob) setDob(initialDob);
      if (initialGender) setGender(initialGender);
    }
  }, [isOpen, initialName, initialPhone, initialDob, initialGender]);

  // Handle ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  // Lock body scroll when open
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

  // Step 1: Validate Profile Details & Transition to Step 2 Login Modal (NO OAuth yet)
  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    // Details verified -> move to Step 2 Login Modal
    setStep(2);
  }

  // Step 2: User explicitly clicks "CONTINUE WITH GOOGLE" -> Launch OAuth
  async function handleGoogleLogin() {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const mobileDigits = cleanPhone.length === 12 && cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;

      // Store pending early access details & action payload
      const pendingPayload = {
        type: 'early_access',
        timestamp: Date.now(),
        details: {
          name: name.trim(),
          phone: mobileDigits,
          dob,
          gender,
        },
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('godsmove_pending_action', JSON.stringify(pendingPayload));
        const cookieVal = encodeURIComponent(JSON.stringify(pendingPayload.details));
        document.cookie = `godsmove_ea_details=${cookieVal}; path=/; max-age=1800; SameSite=Lax`;
      }

      // Initiate Google OAuth with forceSelectAccount: true
      const { error } = await initiateGoogleOAuth(supabase, '/', { forceSelectAccount: true });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
      onClick={loading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ea-modal-title"
    >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Mobile Drag Handle */}
        <div className={styles.dragHandle} />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className={styles.closeBtn}
          aria-label="Close Early Access Modal"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <Image
            src="/images/logo/auth-modal-logo.png"
            alt="GODSMOVƎ"
            width={130}
            height={32}
            className={styles.logo}
            priority
          />
        </div>

        {step === 1 ? (
          <>
            {/* STEP 1: Profile Details Form */}
            <h2 id="ea-modal-title" className={styles.title}>
              EARLY ACCESS REGISTRATION
            </h2>
            <p className={styles.subtitle}>
              Reserve your place before the first release.
            </p>

            {error && (
              <div className={styles.errorBanner} role="alert">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className={styles.onboardingForm}>
              {/* 1. NAME */}
              <div className={styles.inputGroup}>
                <label htmlFor="ea-name" className={styles.inputLabel}>
                  NAME
                </label>
                <input
                  id="ea-name"
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.inputField}
                  disabled={loading}
                />
              </div>

              {/* 2. MOBILE (+91 Prefix) */}
              <div className={styles.inputGroup}>
                <label htmlFor="ea-phone" className={styles.inputLabel}>
                  MOBILE
                </label>
                <div className={styles.phoneInputWrap}>
                  <span className={styles.phonePrefix}>🇮🇳 +91</span>
                  <input
                    id="ea-phone"
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
                <label htmlFor="ea-dob" className={styles.inputLabel}>
                  DATE OF BIRTH
                </label>
                <CustomDatePicker
                  id="ea-dob"
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

              <button type="submit" disabled={loading} className={styles.btnSubmit}>
                <span>CONTINUE</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </>
        ) : (
          <>
            {/* STEP 2: Login Modal */}
            <h2 id="ea-modal-title" className={styles.title}>
              CONTINUE TO EARLY ACCESS
            </h2>
            <p className={styles.subtitle}>
              Sign in to reserve your early access and secure your launch privileges.
            </p>

            {/* Profile Summary Badge */}
            <div className={styles.profileSummary}>
              <Check size={14} className={styles.summaryIcon} />
              <span>Registrant: {name.trim()} (+91 {phone.replace(/\D/g, '')})</span>
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert">
                <span>{error}</span>
              </div>
            )}

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
                <span>{loading ? 'Connecting to Google...' : 'CONTINUE WITH GOOGLE'}</span>
              </button>

              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep(1)}
                disabled={loading}
              >
                ← Edit Registration Details
              </button>
            </div>
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
  );
}
