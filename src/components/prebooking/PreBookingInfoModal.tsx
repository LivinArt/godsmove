'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ShieldCheck, FileText } from 'lucide-react';
import styles from './PreBookingInfoModal.module.css';

export interface PreBookingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'benefits' | 'terms';
  product?: any;
}

export default function PreBookingInfoModal({
  isOpen,
  onClose,
  initialTab = 'benefits',
}: PreBookingInfoModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefits' | 'terms'>(initialTab);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent background scrolling while modal is open
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const canonicalBenefits = [
    {
      title: 'Free GODSMOVE Membership for 1 year',
      badge: 'Worth ₹5,999',
      desc: 'Complimentary VIP membership unlocked automatically upon pre-booking confirmation.',
    },
    {
      title: 'Invite-only access to fashion events across India',
      desc: 'Exclusive invitations to intimate brand exhibitions, runway showcases, and private dinners.',
    },
    {
      title: 'Pre-Launch Access to top articles of GODSMOVE',
      desc: 'Gain private early access to future limited drops before public release.',
    },
    {
      title: 'Priority Dispatch',
      desc: 'Your pre-booked pieces are processed and dispatched within 24–72 hours of launch.',
    },
    {
      title: 'GODSMOVE Care Access',
      desc: 'Dedicated concierge customer care reserved exclusively for members.',
    },
    {
      title: 'Members-only discounts on other products',
      desc: 'Enjoy preferential private pricing across the complete GODSMOVE catalog.',
    },
    {
      title: 'Guaranteed Allocation',
      desc: 'Your order is physically ring-fenced in our atelier and held strictly under your name.',
    },
    {
      title: 'Exclusive Pre-Booking prices',
      desc: 'Lock in preferential pricing before public launch with zero post-launch price escalation.',
    },
    {
      title: 'Future Loyalty Benefits',
      desc: 'Earn tier credits and provenance rewards for future collection releases.',
    },
  ];

  const canonicalTerms = [
    'Strict Allocation Thresholds — Pre-booking availability is strictly capped per release.',
    'Refunds are issued in GODSMOVE Wallet in case of an eligible return, subject to the applicable return policy.',
    'Free membership provided through Pre-Booking is limited to 1 year from activation date.',
    'Pre-Booking allocation is confirmed only after successful payment verification.',
    'Launch and dispatch timelines are indicative and may be subject to operational circumstances, while the applicable dispatch commitment shown for the product remains authoritative.',
  ];

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prebooking-info-modal-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>GODSMOVE ATELIER</div>
            <h2 id="prebooking-info-modal-title" className={styles.title}>
              Pre-Booking Privileges & Terms
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'benefits' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('benefits')}
          >
            <ShieldCheck size={14} /> BENEFITS
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'terms' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            <FileText size={14} /> TERMS & CONDITIONS
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {activeTab === 'benefits' ? (
            <div className={styles.benefitsList}>
              {canonicalBenefits.map((item, idx) => (
                <div key={idx} className={styles.benefitCard}>
                  <Check size={16} className={styles.checkIcon} />
                  <div>
                    <div className={styles.benefitTitle}>
                      {item.title}
                      {item.badge && <span className={styles.badgeVal}>{item.badge}</span>}
                    </div>
                    <div className={styles.benefitDesc}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.termsList}>
              {canonicalTerms.map((term, idx) => (
                <div key={idx} className={styles.termItem}>
                  <span className={styles.termNum}>0{idx + 1}.</span>
                  <span>{term}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
