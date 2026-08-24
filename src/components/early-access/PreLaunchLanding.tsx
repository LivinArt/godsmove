'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { isProfileComplete } from '@/lib/profile-utils';
import { registerEarlyAccessAction, getEarlyAccessStatusAction } from '@/actions/early-access.actions';
import PreBookingBenefitsModal from '@/components/PreBookingBenefitsModal';
import EarlyAccessSuccessModal from './EarlyAccessSuccessModal';
import EarlyAccessLegalModal from './EarlyAccessLegalModal';
import EarlyAccessRegisterModal from './EarlyAccessRegisterModal';
import EarlyAccessAudio from './EarlyAccessAudio';
import EarlyAccessVideo from './EarlyAccessVideo';
import EarlyAccessSkyCanvas from './EarlyAccessSkyCanvas';
import { Loader2, ArrowRight, Check, ChevronDown } from 'lucide-react';
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
    // Notify audio engine of user interaction to start audio if browser autoplay was delayed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gm_user_interaction'));
    }

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
    <div className={styles.pageWrap}>
      {/* ── SECTION 01: CINEMATIC EARLY ACCESS HERO (position: relative) ── */}
      <section className={styles.heroViewport}>
        {/* Background Visual Layer */}
        <EarlyAccessVideo backgroundImage="/images/early-access/early-access-background.jpg" />

        {/* Top Center Masthead Logo (Mathematically Centered: left 50%, transform translateX(-50%)) */}
        <div
          className={`${styles.topCenterLogo} ${styles.fadeInLogo}`}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="GODSMOVƎ"
        >
          <Image
            src="/images/logo/logo-horizontal-white.png"
            alt="GODSMOVƎ"
            width={170}
            height={38}
            priority
            className={styles.logoImage}
          />
        </div>

        {/* Top Right Sound Icon (position: absolute inside heroViewport) */}
        <div className={styles.soundIconAbsoluteWrap}>
          <EarlyAccessAudio />
        </div>

        {/* Hero Central Content */}
        <div className={styles.heroInner}>
          <div className={`${styles.madeInIndiaTag} ${styles.fadeInTag}`}>
            <span>MADE IN INDIA</span>
          </div>

          <h1 className={`${styles.heroTitle} ${styles.fadeInTitle}`}>
            YOU&apos;RE EARLY.
          </h1>

          <p className={`${styles.heroSubtitle} ${styles.fadeInSubtitle}`}>
            Be among the first to enter GODSMOVƎ.
          </p>

          <div className={`${styles.ctaWrap} ${styles.fadeInCta}`}>
            {isRegistered ? (
              <div
                className={styles.registeredStatusBadge}
                onClick={() => setShowSuccessModal(true)}
                role="button"
                tabIndex={0}
              >
                <Check size={14} className={styles.checkIcon} />
                <span>
                  ✓ EARLY ACCESS RESERVED
                  {firstName && ` · ${firstName}`}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGetEarlyAccess}
                disabled={loading}
                className={styles.ctaButton}
                aria-label="Get Early Access"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <span>GET EARLY ACCESS</span>
                    <ArrowRight size={15} className={styles.ctaArrow} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Center Animated Scroll Indicator (position: absolute inside heroViewport) */}
        <div
          className={`${styles.scrollIndicatorWrap} ${styles.fadeInScroll}`}
          aria-hidden="true"
        >
          <div className={styles.scrollVerticalLine} />
          <div className={styles.chevronGroup}>
            <ChevronDown size={13} className={styles.chevron1} />
            <ChevronDown size={13} className={styles.chevron2} />
          </div>
        </div>
      </section>

      {/* ── SECTION 02: EDITORIAL PRIVILEGES STORY + DREAMLIKE SKY & VINTAGE AIRSHIPS ── */}
      <section className={styles.storySection}>
        {/* Fine-Line Architectural Cloud & Airship Canvas */}
        <EarlyAccessSkyCanvas />

        <div className={styles.storyContainer}>
          <div className={styles.storyHeader}>
            <span className={styles.storyEyebrow}>THE PRE-LAUNCH ADVANTAGE</span>
            <h2 className={styles.storyTitle}>
              SOMETHING WORTH ARRIVING EARLY FOR.
            </h2>
          </div>

          {/* Editorial Vertical List (01 to 04) */}
          <div className={styles.benefitsVerticalList}>
            <div className={styles.benefitItem}>
              <div className={styles.benefitNumberWrap}>
                <span className={styles.benefitNumber}>01</span>
                <div className={styles.benefitLine} />
              </div>
              <div className={styles.benefitBody}>
                <h3 className={styles.benefitHeading}>
                  UP TO ₹1,000 IN ASSURED SHOPPING REWARDS
                </h3>
                <p className={styles.benefitDesc}>
                  Allocated automatically to your GODSMOVƎ account ledger upon launch.
                </p>
              </div>
            </div>

            <div className={styles.benefitItem}>
              <div className={styles.benefitNumberWrap}>
                <span className={styles.benefitNumber}>02</span>
                <div className={styles.benefitLine} />
              </div>
              <div className={styles.benefitBody}>
                <h3 className={styles.benefitHeading}>
                  ONE YEAR OF GODSMOVƎ MEMBERSHIP
                </h3>
                <p className={styles.benefitDesc}>
                  Complimentary tier unlock with priority dispatch and private curation.
                </p>
                <button
                  type="button"
                  className={styles.membershipPerksLink}
                  onClick={() => setShowBenefitsModal(true)}
                >
                  VIEW MEMBERSHIP PERKS →
                </button>
              </div>
            </div>

            <div className={styles.benefitItem}>
              <div className={styles.benefitNumberWrap}>
                <span className={styles.benefitNumber}>03</span>
                <div className={styles.benefitLine} />
              </div>
              <div className={styles.benefitBody}>
                <h3 className={styles.benefitHeading}>
                  COMPLIMENTARY GODSMOVƎ LAUNCH GIFTS
                </h3>
                <p className={styles.benefitDesc}>
                  Curated physical artifacts included with initial collection orders.
                </p>
              </div>
            </div>

            <div className={styles.benefitItem}>
              <div className={styles.benefitNumberWrap}>
                <span className={styles.benefitNumber}>04</span>
                <div className={styles.benefitLine} />
              </div>
              <div className={styles.benefitBody}>
                <h3 className={styles.benefitHeading}>
                  EXCLUSIVE PRIVILEGES RESERVED FOR GODSMOVƎ MEMBERS
                </h3>
                <p className={styles.benefitDesc}>
                  Private door access to drop allocations prior to public releases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Editorial Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerTag}>
          MADE IN INDIA · GODSMOVƎ ARCHIVAL MOVEMENT
        </div>
        <div className={styles.footerLinks}>
          <button
            type="button"
            className={styles.legalLinkBtn}
            onClick={() => setLegalModalType('privacy')}
          >
            Privacy Policy
          </button>
          <span className={styles.dot}>•</span>
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
