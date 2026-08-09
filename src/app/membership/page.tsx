'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  PackageCheck,
  CheckCircle2,
  Clock,
  Tag,
  Loader2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { getMyMembership } from '@/actions/membership.actions';
import styles from './membership.module.css';

export default function MembershipPage() {
  const router = useRouter();
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

  const isActiveMember = Boolean(membership && membership.status === 'ACTIVE');

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {authLoading || loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: '#d4af37' }} />
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
                    Your access to the GODSMOVE world is active.
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
                  <span className={styles.metaLabel}>Acquisition Source</span>
                  <span className={styles.metaValue}>
                    {membership?.source === 'PRE_BOOKING' ? 'PRE-BOOKING ALLOCATION' : membership?.source || 'MEMBER'}
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
                      : 'Active'}
                  </span>
                </div>
                {membership?.sourceOrder && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Source Order</span>
                    <span className={styles.metaValue}>
                      #{membership.sourceOrder.orderNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Member Privileges */}
              <div className={styles.perksGrid}>
                <div className={styles.perkCard}>
                  <Zap size={20} className={styles.perkIcon} />
                  <div className={styles.perkText}>
                    <span className={styles.perkTitle}>Pre-Booking Privileges</span>
                    <span className={styles.perkDesc}>
                      Guaranteed early allocation on upcoming drops before public release.
                    </span>
                  </div>
                </div>

                <div className={styles.perkCard}>
                  <Crown size={20} className={styles.perkIcon} />
                  <div className={styles.perkText}>
                    <span className={styles.perkTitle}>Exclusive Rack Access</span>
                    <span className={styles.perkDesc}>
                      Privileged browsing and priority claims on vaulted single-piece items.
                    </span>
                  </div>
                </div>

                <div className={styles.perkCard}>
                  <ShieldCheck size={20} className={styles.perkIcon} />
                  <div className={styles.perkText}>
                    <span className={styles.perkTitle}>GODSMOVE Atelier Care</span>
                    <span className={styles.perkDesc}>
                      Complimentary product care assessment and repair services.
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.memberActions}>
                <Link href="/profile?tab=prebookings" className={styles.memberPrimaryBtn}>
                  MY PRE-BOOKINGS <ArrowRight size={14} />
                </Link>

                <Link href="/exclusive-rack" className={styles.memberSecondaryBtn}>
                  EXPLORE THE VAULT
                </Link>

                <Link href="/our-story" className={styles.memberSecondaryBtn}>
                  MEMBERSHIP PERKS
                </Link>
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
                      Secure a pre-booking allocation and receive complimentary GODSMOVE membership included with your purchase.
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
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
