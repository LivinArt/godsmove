'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Crown,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  Tag,
  Loader2,
  Calendar,
  Sparkles,
  Award,
  Truck,
  HeartHandshake,
  Percent,
  CheckCircle,
  FileText,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { getMyMembership } from '@/actions/membership.actions';
import styles from './membership.module.css';

export default function MembershipPage() {
  const { user, loading: authLoading } = useAuth();
  const [membership, setMembership] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembership() {
      if (user) {
        try {
          const res = await getMyMembership();
          setMembership(res);
        } catch (err) {
          console.error('Failed to load membership status:', err);
        }
      }
      setLoading(false);
    }

    if (!authLoading) {
      loadMembership();
    }
  }, [user, authLoading]);

  const now = new Date();
  const isActiveMember = Boolean(
    membership &&
      membership.status === 'ACTIVE' &&
      membership.expiresAt &&
      new Date(membership.expiresAt) > now
  );
  const isScheduledMember = Boolean(
    membership && membership.status === 'SCHEDULED'
  );

  const daysRemaining = membership?.expiresAt
    ? Math.max(0, Math.ceil((new Date(membership.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {authLoading || loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: '#c5a059' }} />
            </div>
          ) : isScheduledMember ? (
            /* STATE SCHEDULED — RESERVED EARLY ACCESS MEMBERSHIP */
            <div className={styles.memberDashboard}>
              <div className={styles.memberHeaderRow}>
                <div className={styles.memberInfo}>
                  <span className={styles.memberStatusBadge}>
                    <Crown size={14} /> 1-YEAR MEMBERSHIP RESERVED
                  </span>
                  <h1 className={styles.title}>MEMBERSHIP ACTIVATES AT LAUNCH</h1>
                  <p className={styles.subtitle}>
                    Your 1-year GODSMOVƎ VIP Membership entitlement is reserved and will activate on the official GODSMOVƎ store launch.
                  </p>
                </div>
              </div>

              {/* Membership Meta Details */}
              <div className={styles.memberMetaRow}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Status</span>
                  <span className={styles.metaValue} style={{ color: '#c5a059' }}>
                    ● SCHEDULED (PENDING LAUNCH)
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Membership Source</span>
                  <span className={styles.metaValue}>
                    {membership?.source === 'EARLY_ACCESS' ? 'EARLY ACCESS REGISTRATION' : membership?.source || 'RESERVED'}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Activation Date</span>
                  <span className={styles.metaValue}>
                    {membership?.activatedAt
                      ? new Date(membership.activatedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'On Official Store Launch'}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Duration</span>
                  <span className={styles.metaValue}>1 Year VIP (From Launch)</span>
                </div>
              </div>
            </div>
          ) : isActiveMember ? (
            /* STATE B — ACTIVE MEMBER DASHBOARD */
            <div className={styles.memberDashboard}>
              <div className={styles.memberHeaderRow}>
                <div className={styles.memberInfo}>
                  <span className={styles.memberStatusBadge}>
                    <Crown size={14} /> GODSMOVE MEMBER
                  </span>
                  <h1 className={styles.title}>MEMBERSHIP ACTIVE</h1>
                  <p className={styles.subtitle}>
                    Your privileged access to the GODSMOVE ecosystem is active.
                  </p>
                </div>
              </div>

              {/* Membership Meta Details */}
              <div className={styles.memberMetaRow}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Status</span>
                  <span className={styles.metaValue} style={{ color: '#4cd964' }}>
                    ● ACTIVE
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Membership Source</span>
                  <span className={styles.metaValue}>
                    {membership?.source === 'PRE_BOOKING' ? 'Activated through Pre-Booking' : membership?.source || 'MEMBER'}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Membership Start</span>
                  <span className={styles.metaValue}>
                    {membership?.activatedAt
                      ? new Date(membership.activatedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Membership Ends</span>
                  <span className={styles.metaValue}>
                    {membership?.expiresAt
                      ? new Date(membership.expiresAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Duration</span>
                  <span className={styles.metaValue}>1 Year ({daysRemaining} days left)</span>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.memberActions}>
                <Link href="/drops" className={styles.memberPrimaryBtn}>
                  EXPLORE DROPS <ArrowRight size={14} />
                </Link>

                <Link href="/profile?tab=prebookings" className={styles.memberSecondaryBtn}>
                  MY PRE-BOOKINGS
                </Link>

                <Link href="/exclusive-rack" className={styles.memberSecondaryBtn}>
                  EXCLUSIVE RACK
                </Link>
              </div>

              {/* BENEFITS SECTION FOR MEMBER */}
              <div className={styles.benefitsSection} style={{ marginTop: '48px' }}>
                <h3 className={styles.sectionHeading}>MEMBERSHIP PRIVILEGES</h3>
                <div className={styles.benefitsGrid}>
                  <div className={styles.benefitCard}>
                    <Crown size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Free 1-Year Membership</h4>
                      <p className={styles.benefitDesc}>Included with your eligible Pre-Booking order.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Sparkles size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Invite-Only Fashion Events</h4>
                      <p className={styles.benefitDesc}>Access to private brand pop-ups across India.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Zap size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Pre-Launch Access</h4>
                      <p className={styles.benefitDesc}>Priority access on selected GODSMOVE releases.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Truck size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Priority Dispatch</h4>
                      <p className={styles.benefitDesc}>Fast-track fulfillment and logistics processing.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <HeartHandshake size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>GODSMOVE Care Access</h4>
                      <p className={styles.benefitDesc}>Complimentary garment care and assessment support.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Percent size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Members-Only Discounts</h4>
                      <p className={styles.benefitDesc}>Special pricing on eligible Drops & Exclusive Rack items.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TERMS & CONDITIONS FOR MEMBER */}
              <div className={styles.tncSection}>
                <h3 className={styles.sectionHeading}>MEMBERSHIP TERMS & CONDITIONS</h3>
                <ul className={styles.tncList}>
                  <li>Membership obtained through Pre-Booking is valid for 1 calendar year from your first successful payment.</li>
                  <li>Additional Pre-Bookings during an active membership period do not extend or reset the 1-year duration.</li>
                  <li>Member discounts apply strictly to eligible catalog items configured for member pricing.</li>
                  <li>Membership privileges are non-transferable and personal to the authenticated customer account.</li>
                  <li>Failed, abandoned, or refunded orders do not grant or maintain active membership status.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* STATE A — NON-MEMBER LANDING EXPERIENCE */
            <>
              <div className={styles.heroHeader}>
                <span className={styles.eyebrow}>
                  <Crown size={13} /> ACCESS & TRUST
                </span>
                <h1 className={styles.title}>GODSMOVE MEMBERSHIP</h1>
                <p className={styles.subtitle}>
                  Membership represents access, trust, and participation in the GODSMOVE ecosystem. Pre-booking is your gateway into GODSMOVE membership.
                </p>
              </div>

              <div className={styles.optionsGrid}>
                {/* OPTION 1 — PRE-BOOKING (ACTIVE) */}
                <div className={`${styles.card} ${styles.cardActive}`}>
                  <span className={`${styles.cardBadge} ${styles.cardBadgeActive}`}>RECOMMENDED</span>
                  <div className={styles.cardTop}>
                    <div className={styles.cardIcon}>
                      <Tag size={20} />
                    </div>
                    <h2 className={styles.cardTitle}>MAKE A PRE-BOOKING</h2>
                    <p className={styles.cardDesc}>
                      Purchasing any eligible Pre-Booking product activates 1-year GODSMOVE Membership included with your allocation.
                    </p>
                  </div>

                  <Link href="/drops" className={styles.ctaBtnActive}>
                    EXPLORE PRE-BOOKINGS <ArrowRight size={14} />
                  </Link>
                </div>

                {/* OPTION 2 — BUY MEMBERSHIP (DISABLED / COMING SOON) */}
                <div className={`${styles.card} ${styles.cardDisabled}`}>
                  <span className={`${styles.cardBadge} ${styles.cardBadgeDisabled}`}>FUTURE RELEASE</span>
                  <div className={styles.cardTop}>
                    <div className={`${styles.cardIcon} ${styles.cardIconDisabled}`}>
                      <Lock size={20} />
                    </div>
                    <h2 className={styles.cardTitle}>BUY MEMBERSHIP</h2>
                    <p className={styles.cardDesc}>
                      Direct standalone membership purchases will be available soon in an upcoming platform release.
                    </p>
                  </div>

                  <button type="button" className={styles.ctaBtnDisabled} disabled>
                    <Lock size={13} /> COMING SOON
                  </button>
                </div>
              </div>

              {/* NON-MEMBER BENEFITS */}
              <div className={styles.benefitsSection}>
                <h3 className={styles.sectionHeading}>MEMBERSHIP BENEFITS</h3>
                <div className={styles.benefitsGrid}>
                  <div className={styles.benefitCard}>
                    <Crown size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Free GODSMOVE Membership for 1 Year</h4>
                      <p className={styles.benefitDesc}>Activated automatically upon your first successful Pre-Booking.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Sparkles size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Invite-Only Fashion Events</h4>
                      <p className={styles.benefitDesc}>Exclusive invitations to fashion presentations across India.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Zap size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Pre-Launch Access</h4>
                      <p className={styles.benefitDesc}>Early access windows on selected GODSMOVE releases.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Truck size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Priority Dispatch</h4>
                      <p className={styles.benefitDesc}>Priority order processing and accelerated logistics delivery.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <HeartHandshake size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>GODSMOVE Care Access</h4>
                      <p className={styles.benefitDesc}>Garment care assessment and repair services for members.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Percent size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Members-Only Discounts</h4>
                      <p className={styles.benefitDesc}>Special pricing on eligible Drops & Exclusive Rack items.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <CheckCircle size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Guaranteed Allocation</h4>
                      <p className={styles.benefitDesc}>Priority reservation on eligible Pre-Bookings.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Tag size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Exclusive Pre-Booking Prices</h4>
                      <p className={styles.benefitDesc}>Preferential pricing tiers reserved for early supporters.</p>
                    </div>
                  </div>
                  <div className={styles.benefitCard}>
                    <Award size={18} className={styles.benefitIcon} />
                    <div>
                      <h4 className={styles.benefitTitle}>Future Loyalty Benefits</h4>
                      <p className={styles.benefitDesc}>Tier progression and exclusive vault reward access.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* NON-MEMBER TERMS & CONDITIONS */}
              <div className={styles.tncSection}>
                <h3 className={styles.sectionHeading}>MEMBERSHIP TERMS & CONDITIONS</h3>
                <ul className={styles.tncList}>
                  <li>Membership obtained through Pre-Booking is valid for 1 calendar year from your first successful payment date.</li>
                  <li>Membership starts from the timestamp of the user's first successful eligible Pre-Booking order.</li>
                  <li>Additional Pre-Bookings completed during an active membership period do not extend or reset the 1-year duration.</li>
                  <li>Membership benefits apply only to eligible products and services as configured by GODSMOVE.</li>
                  <li>Member discounts are subject to individual product settings and do not stack with Pre-Booking discounts.</li>
                  <li>Membership is strictly personal to the authenticated customer account and is non-transferable.</li>
                  <li>Failed, abandoned, or unconfirmed payments do not activate membership.</li>
                  <li>Cash on Delivery (COD) cannot activate Pre-Booking membership.</li>
                  <li>Any order cancellation or return treatment follows the canonical GODSMOVE refund and return policy.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

