'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { isProfileComplete } from '@/lib/profile-utils';
import { updateMyProfileOnboarding } from '@/actions/profile.actions';
import { registerEarlyAccessAction, getEarlyAccessStatusAction } from '@/actions/early-access.actions';
import PreBookingBenefitsModal from '@/components/PreBookingBenefitsModal';
import EarlyAccessSuccessModal from './EarlyAccessSuccessModal';
import EarlyAccessLegalModal from './EarlyAccessLegalModal';
import EarlyAccessRegisterModal from './EarlyAccessRegisterModal';
import EarlyAccessAudio from './EarlyAccessAudio';
import { Loader2, ArrowRight, Check } from 'lucide-react';
import styles from './PreLaunchLanding.module.css';

export default function PreLaunchLanding() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredName, setRegisteredName] = useState<string | null>(null);

  // Modal Visibility States
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
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

  // Handle post-OAuth return & registration trigger
  useEffect(() => {
    const handleTriggerEvent = async (e?: any) => {
      setLoading(true);
      setShowRegisterModal(false);
      try {
        let details = e?.detail?.details;
        if (!details) {
          const pendingStr = sessionStorage.getItem('godsmove_pending_action');
          if (pendingStr) {
            try {
              const pending = JSON.parse(pendingStr);
              details = pending.details;
            } catch (err) {
              // ignore
            }
          }
        }

        const onboardingPayload = details
          ? {
              firstName: details.name,
              phone: details.phone,
              dob: details.dob,
              gender: details.gender,
            }
          : undefined;

        const res = await registerEarlyAccessAction(undefined, onboardingPayload);
        if (res.success) {
          setIsRegistered(true);
          if (res.firstName) setRegisteredName(res.firstName);
          setShowSuccessModal(true);
          refreshProfile();
        }
      } catch (err) {
        console.error('Early Access registration error:', err);
      } finally {
        sessionStorage.removeItem('godsmove_pending_action');
        setLoading(false);
      }
    };

    window.addEventListener('gm_trigger_early_access', handleTriggerEvent);
    return () => {
      window.removeEventListener('gm_trigger_early_access', handleTriggerEvent);
    };
  }, [refreshProfile]);

  async function handleGetEarlyAccess() {
    // 1. If already registered, show concierge modal
    if (isRegistered) {
      setShowSuccessModal(true);
      return;
    }

    // 2. If authenticated AND profile is complete -> register directly
    if (user && profile && isProfileComplete(profile)) {
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
      return;
    }

    // 3. Otherwise (unauthenticated or incomplete profile) -> Open 2-step Early Access Register Modal
    setShowRegisterModal(true);
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

      {/* Brand Header */}
      <header className={styles.header}>
        <div
          className={styles.logoWrap}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="GODSMOVƎ Archival Release"
        >
          <Image
            src="/images/logo/logo-horizontal-white.png"
            alt="GODSMOVƎ"
            width={150}
            height={34}
            priority
            className={styles.logoImage}
          />
        </div>

        <div className={styles.headerRight}>
          <EarlyAccessAudio />
          <span className={styles.madeInIndiaTag}>
            MADE IN INDIA · MODERN APPAREL
          </span>
        </div>
      </header>

      {/* Main Editorial Hero Content */}
      <main className={styles.mainContent}>
        <h1 className={styles.mainHeading}>
          {isRegistered ? 'YOUR PLACE IS RESERVED.' : 'YOUR PLACE IN THE FIRST RELEASE.'}
        </h1>

        <p className={styles.supportingCopy}>
          {isRegistered
            ? "We'll be in touch when GODSMOVƎ is ready for you."
            : 'Be among the first to experience GODSMOVƎ.'}
        </p>

        {/* Clean Editorial Privileges List */}
        <div className={styles.privilegesListWrap}>
          <div className={`${styles.privilegeItem} ${styles.stagger1}`}>
            <span className={styles.privilegeNumber}>01</span>
            <span className={styles.privilegeText}>
              Up to ₹1,000 in assured shopping rewards
            </span>
          </div>

          <div className={`${styles.privilegeItem} ${styles.stagger2}`}>
            <span className={styles.privilegeNumber}>02</span>
            <div className={styles.privilegeContent}>
              <span className={styles.privilegeText}>
                One year of GODSMOVƎ Membership
              </span>
              <button
                type="button"
                className={styles.membershipPerksBtn}
                onClick={() => setShowBenefitsModal(true)}
              >
                VIEW MEMBERSHIP PERKS
              </button>
            </div>
          </div>

          <div className={`${styles.privilegeItem} ${styles.stagger3}`}>
            <span className={styles.privilegeNumber}>03</span>
            <span className={styles.privilegeText}>
              Complimentary GODSMOVƎ launch gifts
            </span>
          </div>

          <div className={`${styles.privilegeItem} ${styles.stagger4}`}>
            <span className={styles.privilegeNumber}>04</span>
            <span className={styles.privilegeText}>
              Exclusive privileges reserved for GODSMOVƎ members
            </span>
          </div>
        </div>

        {/* Primary CTA / Registered Status Element */}
        <div className={styles.ctaWrap}>
          {isRegistered ? (
            <div className={styles.registeredStatusBadge} onClick={() => setShowSuccessModal(true)}>
              <Check size={15} className={styles.checkIcon} />
              <span>EARLY ACCESS RESERVED</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGetEarlyAccess}
              disabled={loading}
              className={styles.ctaButton}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>GET EARLY ACCESS</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
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

      {/* 2-Step Strict Early Access Registration Modal */}
      <EarlyAccessRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        initialName={profile?.firstName || ''}
        initialPhone={profile?.phone || ''}
        initialDob={profile?.dob ? new Date(profile.dob).toISOString().split('T')[0] : ''}
        initialGender={(profile?.gender as any) || 'Prefer not to say'}
      />

      {/* Membership Perks Modal */}
      <PreBookingBenefitsModal
        isOpen={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
      />

      {/* Final Early Access Concierge Success Modal */}
      <EarlyAccessSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        customerName={firstName}
        isReturning={isRegistered}
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
