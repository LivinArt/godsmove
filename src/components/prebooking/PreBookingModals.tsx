'use client';

import React, { useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Tag,
  Clock,
  Sparkles,
  Users,
  Award,
  Crown,
  Gift,
  Compass,
  CheckCircle2,
  Lock,
  Truck,
  HelpCircle,
  FileText,
  Headphones,
  Check
} from 'lucide-react';
import { formatExpectedDispatchText } from '@/lib/launch-engine';
import styles from './PreBookingModals.module.css';

import { createPortal } from 'react-dom';

interface PreBookingBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
}

export function PreBookingBenefitsModal({ isOpen, onClose, product }: PreBookingBenefitsModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      window.addEventListener('keydown', handleKey);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const dispatchText = formatExpectedDispatchText(product?.expectedDispatch, product?.customExpectedDispatch);

  const benefits = [
    {
      title: 'Extra Launch Discount',
      desc: 'Lock in preferential pre-booking pricing before the official public release. Rates revert to standard MSRP upon launch.',
      icon: <Tag size={15} />,
    },
    {
      title: 'Guaranteed Allocation Before Public Release',
      desc: 'Your reserved piece is ring-fenced from the limited production run and held exclusively for your custody.',
      icon: <ShieldCheck size={15} />,
    },
    {
      title: 'Priority Dispatch',
      desc: 'Pre-booked reservations receive top queue placement and dispatch immediately once the launch window opens.',
      icon: <Truck size={15} />,
    },
    {
      title: 'Members Only Early Access',
      desc: 'Unlock 24-hour advance discovery privileges on future capsule drops and archival catalog additions.',
      icon: <Crown size={15} />,
    },
    {
      title: 'Access To Upcoming Collections',
      desc: 'Private previews and material exploration dossiers of unreleased seasons before public announcements.',
      icon: <Compass size={15} />,
    },
    {
      title: 'Invite Only Community Events',
      desc: 'Access to private brand exhibitions, runway previews, atelier open evenings, and collector salons.',
      icon: <Users size={15} />,
    },
    {
      title: 'Chance To Become Top 1% Collector',
      desc: 'Accelerated tier points and badge recognition toward our highest archival membership status.',
      icon: <Award size={15} />,
    },
    {
      title: 'Priority Support',
      desc: 'Direct white-glove concierge assistance and dedicated dispatch specialists for all reservation inquiries.',
      icon: <Headphones size={15} />,
    },
    {
      title: 'Future Loyalty Benefits',
      desc: 'Accumulate permanent collector status credits that unlock bespoke customization and private pricing.',
      icon: <Gift size={15} />,
    },
    {
      title: 'Exclusive Drops Before Public',
      desc: 'Guaranteed access to secret micro-drops and vault pieces unavailable on the general storefront.',
      icon: <Sparkles size={15} />,
    },
  ];

  const terms = [
    {
      title: 'Separate Scheduled Dispatch',
      desc: `Pre-booking pieces follow a dedicated production schedule (${dispatchText}) and are dispatched independently from ready-to-ship catalog items.`,
    },
    {
      title: 'Price Lock & Full Allocation Custody',
      desc: 'Your pre-booking price is permanently locked and guaranteed. The piece is physically reserved for you upon completed payment.',
    },
    {
      title: '100% Cancellation & Refund Protection',
      desc: 'You may cancel your reservation at any time prior to physical dispatch for an immediate 100% refund to your original payment method.',
    },
    {
      title: 'Strict Allocation Thresholds',
      desc: 'Once the maximum pre-booking allocation limit is reached, reservations close permanently and the item becomes sold out until launch.',
    },
  ];

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Pre Booking Benefits">
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.eyebrow}>GODSMOVE ALLOCATION PROGRAM</span>
            <h2 className={styles.title}>WHY PRE BOOK?</h2>
            <p className={styles.subtitle}>
              Private reservation privileges curated for decisive collectors before public release.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Key Highlight Metrics */}
          <div className={styles.highlightBanner}>
            <div className={styles.highlightItem}>
              <span className={styles.highlightLabel}>ALLOCATION CUSTODY</span>
              <span className={styles.highlightValue}>100% Guaranteed Reserved Unit</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.highlightLabel}>EXPECTED DISPATCH</span>
              <span className={styles.highlightValue}>{dispatchText}</span>
            </div>
            <div className={styles.highlightItem}>
              <span className={styles.highlightLabel}>PRICE LOCK STATUS</span>
              <span className={styles.highlightValue}>Frozen Archival Rate</span>
            </div>
          </div>

          {/* Benefits 2-Col Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={14} color="#c8a46a" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a46a' }}>
                RESERVATION PRIVILEGES
              </span>
            </div>
            <div className={styles.benefitsGrid}>
              {benefits.map((b, i) => (
                <div key={i} className={styles.benefitCard}>
                  <div className={styles.benefitIconWrap}>{b.icon}</div>
                  <div className={styles.benefitContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={12} color="#c8a46a" strokeWidth={3} />
                      <h3 className={styles.benefitTitle}>{b.title}</h3>
                    </div>
                    <p className={styles.benefitDesc}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pre Booking Terms Section */}
          <div className={styles.termsSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={14} color="#c8a46a" />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a46a' }}>
                PRE BOOKING TERMS
              </span>
            </div>
            <div className={styles.termsList}>
              {terms.map((t, idx) => (
                <div key={idx} className={styles.termsRow}>
                  <span className={styles.termsBullet}>✓</span>
                  <div>
                    <strong className={styles.termsItemTitle}>{t.title}:</strong>{' '}
                    <span className={styles.termsItemDesc}>{t.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerNote}>
            <ShieldCheck size={14} color="#c8a46a" />
            <span>Secure checkout • Real-time tracking • 100% Cancellation protection</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

interface PreBookingTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
}

export function PreBookingTermsModal({ isOpen, onClose, product }: PreBookingTermsModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      window.addEventListener('keydown', handleKey);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const dispatchText = formatExpectedDispatchText(product?.expectedDispatch, product?.customExpectedDispatch);

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Pre Booking Terms & Conditions">
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.eyebrow}>LEGAL & CUSTODY PROTOCOL</span>
            <h2 className={styles.title}>PRE BOOKING TERMS & CONDITIONS</h2>
            <p className={styles.subtitle}>
              Clear, transparent guidelines governing our scheduled launch and reservation system.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.termsSection}>
            <div className={styles.termsBlock}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="#c8a46a" />
                <h3 className={styles.termsHeading}>1. DISPATCH TIMELINE & SEPARATE SHIPMENT</h3>
              </div>
              <p className={styles.termsText}>
                Pre-booking items are scheduled for production and will dispatch according to the stated launch window ({dispatchText}). Because pre-booking pieces follow a designated release schedule, they do not ship immediately and will be dispatched independently from in-stock catalog items.
              </p>
            </div>

            <div className={styles.termsBlock}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={15} color="#c8a46a" />
                <h3 className={styles.termsHeading}>2. PAYMENT & FROZEN PRICING GUARANTEE</h3>
              </div>
              <p className={styles.termsText}>
                To secure your allocation in the production run, full payment is processed at the time of reservation via verified online gateways (Razorpay). Pre-booking guarantees a locked price; your price will never increase even if retail MSRP rises upon public launch.
              </p>
            </div>

            <div className={styles.termsBlock}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={15} color="#c8a46a" />
                <h3 className={styles.termsHeading}>3. PHYSICAL ALLOCATION RING-FENCING</h3>
              </div>
              <p className={styles.termsText}>
                Every confirmed pre-booking directly reserves a physical unit against our limited batch capacity. We never practice overselling. Once maximum pre-booking thresholds are met, the piece closes to further reservations automatically.
              </p>
            </div>

            <div className={styles.termsBlock}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} color="#c8a46a" />
                <h3 className={styles.termsHeading}>4. CANCELLATION & REFUND RIGHTS</h3>
              </div>
              <p className={styles.termsText}>
                Collectors retain complete flexibility. If you wish to cancel your pre-booking reservation before physical dispatch, you may request cancellation through your Profile or Care Desk for a 100% full refund back to your original payment method.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerNote}>
            <FileText size={14} color="#c8a46a" />
            <span>GODSMOVE Editorial Commerce • Version 2026.1</span>
          </div>
          <button className={styles.acknowledgeBtn} onClick={onClose}>
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
