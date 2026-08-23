'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { isProfileComplete } from '@/lib/profile-utils';
import { registerEarlyAccessAction, getEarlyAccessStatusAction } from '@/actions/early-access.actions';
import PreBookingBenefitsModal from '@/components/PreBookingBenefitsModal';
import EarlyAccessSuccessModal from './EarlyAccessSuccessModal';
import EarlyAccessLegalModal from './EarlyAccessLegalModal';
import { Loader2, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import styles from './PreLaunchLanding.module.css';

export default function PreLaunchLanding() {
  const { user, profile, openAuthModal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredName, setRegisteredName] = useState<string | null>(null);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  // Extract first name for personalized concierge treatment
  const firstName = profile?.firstName
    ? profile.firstName.trim().split(' ')[0]
    : registeredName
    ? registeredName.trim().split(' ')[0]
    : null;

  // Synchronize Early Access registration status from DB
  useEffect(() => {
    if (user && profile) {
      if (profile.earlyAccessRegistered) {
        setIsRegistered(true);
        if (profile.firstName) setRegisteredName(profile.firstName);
      } else {
        getEarlyAccessStatusAction().then((res) => {
          if (res.isRegistered) {
            setIsRegistered(true);
            if (res.firstName) setRegisteredName(res.firstName);
          }
        });
      }
    }
  }, [user, profile]);

  // Handle trigger event from AuthContext after auth & onboarding completion
  useEffect(() => {
    const handleTriggerEvent = async () => {
      setLoading(true);
      try {
        const res = await registerEarlyAccessAction();
        if (res.success) {
          setIsRegistered(true);
          if (res.firstName) setRegisteredName(res.firstName);
          setShowSuccessModal(true);
        }
      } catch (err) {
        console.error('Early Access registration error:', err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('gm_trigger_early_access', handleTriggerEvent);
    return () => {
      window.removeEventListener('gm_trigger_early_access', handleTriggerEvent);
    };
  }, []);

  async function handleGetEarlyAccess() {
    // If already registered, simply show personalized success modal
    if (isRegistered) {
      setShowSuccessModal(true);
      return;
    }

    // 1. If unauthenticated, open existing AuthModal
    if (!user) {
      openAuthModal('early_access');
      return;
    }

    // 2. If authenticated but profile incomplete, open existing AuthModal to show onboarding step
    if (!isProfileComplete(profile)) {
      openAuthModal('early_access');
      return;
    }

    // 3. Authenticated and complete profile -> register directly
    if (loading) return;
    setLoading(true);

    try {
      const res = await registerEarlyAccessAction();
      if (res.success) {
        setIsRegistered(true);
        if (res.firstName) setRegisteredName(res.firstName);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Early Access registration failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.heroContainer}>
      {/* Background Campaign Visual & Ambient Dark Overlay */}
      <div className={styles.bgWrap}>
        <Image
          src="/images/hero/hero-main.png"
          alt="GODSMOVƎ SS26 Collection"
          fill
          priority
          className={styles.bgImage}
        />
        <div className={styles.bgOverlay} />
      </div>

      {/* Brand Header — Stationary Element (Does not escape Early Access) */}
      <header className={styles.header}>
        <div
          className={styles.logoWrap}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="GODSMOVƎ Archival Release"
        >
          <Image
            src="/images/logo/logo-horizontal-white.png"
            alt="GODSMOVƎ"
            width={160}
            height={36}
            priority
            className={styles.logoImage}
          />
        </div>
        <span className={styles.madeInIndiaTag}>
          MADE IN INDIA · MODERN APPAREL
        </span>
      </header>

      {/* Main Editorial Hero Content */}
      <main className={styles.mainContent}>
        <span className={styles.eyebrow}>
          {isRegistered && firstName
            ? `WELCOME BACK, ${firstName.toUpperCase()}`
            : 'SS26 ALLOCATIONS // PRE-LAUNCH ACCESS'}
        </span>

        <h1 className={styles.mainHeading}>
          {isRegistered
            ? 'YOUR EARLY ACCESS IS RESERVED.'
            : 'THE FIRST RELEASE IS NEAR.'}
        </h1>

        <p className={styles.supportingCopy}>
          {isRegistered
            ? 'Our concierge team will notify you once we are live. Thank you for trusting us.'
            : 'Limited in quantity. Built for custodians, not consumers. Get closer to the first release.'}
        </p>

        {/* Early Access Benefits Card */}
        <div className={styles.benefitsCard}>
          <div className={styles.benefitsHeader}>
            {isRegistered ? 'CONFIRMED LAUNCH PRIVILEGES' : 'EARLY ACCESS PRIVILEGES'}
          </div>
          <div className={styles.benefitsSubhead}>
            {isRegistered
              ? 'Your account has unlocked the following privileges:'
              : 'Early Access registrants unlock the following privileges:'}
          </div>

          <ul className={styles.benefitsList}>
            <li className={styles.benefitItem}>
              <span className={styles.bullet}>✦</span>
              <div className={styles.benefitContent}>
                <span>1 Year GODSMOVƎ Membership</span>
                <button
                  type="button"
                  className={styles.membershipLink}
                  onClick={() => setShowBenefitsModal(true)}
                >
                  VIEW MEMBERSHIP BENEFITS
                </button>
              </div>
            </li>
            <li className={styles.benefitItem}>
              <span className={styles.bullet}>✦</span>
              <span>Priority access at launch</span>
            </li>
            <li className={styles.benefitItem}>
              <span className={styles.bullet}>✦</span>
              <span>Exclusive member benefits</span>
            </li>
            <li className={styles.benefitItem}>
              <span className={styles.bullet}>✦</span>
              <span>ASSURED REWARD UP TO ₹1,000</span>
            </li>
          </ul>
        </div>

        {/* Primary Luxury CTA */}
        <button
          type="button"
          onClick={handleGetEarlyAccess}
          disabled={loading}
          className={styles.ctaButton}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : isRegistered ? (
            <>
              <ShieldCheck size={18} />
              <span>EARLY ACCESS RESERVED</span>
            </>
          ) : (
            <>
              <span>GET EARLY ACCESS</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {isRegistered && (
          <div className={styles.alreadyRegisteredBadge}>
            <CheckCircle2 size={14} />
            <span>EARLY ACCESS CONFIRMED // CONCIERGE NOTIFICATION ACTIVE</span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div>MADE IN INDIA · GODSMOVƎ ARCHIVAL MOVEMENT</div>
        <div className={styles.footerLinks}>
          <button
            type="button"
            className={styles.legalLinkBtn}
            onClick={() => setLegalModalType('privacy')}
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            className={styles.legalLinkBtn}
            onClick={() => setLegalModalType('terms')}
          >
            Terms of Service
          </button>
        </div>
      </footer>

      {/* Existing Membership Benefits Modal */}
      <PreBookingBenefitsModal
        isOpen={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
      />

      {/* Final Early Access Concierge Success Modal */}
      <EarlyAccessSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        customerName={firstName}
      />

      {/* Early Access Legal Modal (Privacy & Terms Overlay) */}
      <EarlyAccessLegalModal
        isOpen={Boolean(legalModalType)}
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
