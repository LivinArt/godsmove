'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Tag, Rocket, Lock, Award } from 'lucide-react';
import styles from './PreBookingBenefitsModal.module.css';

interface PreBookingBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

export default function PreBookingBenefitsModal({
  isOpen,
  onClose,
  productName,
}: PreBookingBenefitsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Calculate scrollbar width to prevent horizontal layout shift
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

  const benefits = [
    {
      index: '01',
      title: 'GUARANTEED ALLOCATION',
      desc: 'Secure your statement piece before the public drop. Your allocation is strictly reserved upon pre-booking and protected from sell-out.',
      icon: ShieldCheck,
    },
    {
      index: '02',
      title: 'EXCLUSIVE PRE-BOOKING PRICE',
      desc: 'Enjoy special priority tier pricing reserved exclusively for patrons who participate during the pre-booking window.',
      icon: Tag,
    },
    {
      index: '03',
      title: 'PRIORITY EARLY DISPATCH',
      desc: 'Pre-booked orders enter the atelier queue first and ship immediately within 24 hours of official release.',
      icon: Rocket,
    },
    {
      index: '04',
      title: 'LIMITED ARCHIVAL ACCESS',
      desc: 'Gain first-choice access to limited sizing and colorways before general store catalog availability.',
      icon: Lock,
    },
    {
      index: '05',
      title: 'COLLECTOR PROVENANCE',
      desc: 'Includes official atelier release documentation and priority tier allocation status for future archival releases.',
      icon: Award,
    },
  ];

  const modalContent = (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>RESERVATION PRIVILEGES</span>
            <h2 className={styles.title}>WHY PRE-BOOK?</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close privileges modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {benefits.map((b) => {
            const IconComp = b.icon;
            return (
              <div key={b.index} className={styles.benefitItem}>
                <div className={styles.iconWrap}>
                  <IconComp size={18} />
                </div>
                <div className={styles.itemContent}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemIndex}>{b.index}</span>
                    <span className={styles.itemTitle}>{b.title}</span>
                  </div>
                  <p className={styles.itemDesc}>{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <span className={styles.footerNote}>
            {productName ? `Pre-booking privileges for ${productName}` : 'GODSMOVE Atelier Allocation'}
          </span>
          <button type="button" className={styles.actionBtn} onClick={onClose}>
            UNDERSTOOD
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
