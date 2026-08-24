'use client';

import React from 'react';
import { X } from 'lucide-react';
import styles from './EarlyAccessSuccessModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string | null;
  isReturning?: boolean;
}

export default function EarlyAccessSuccessModal({
  isOpen,
  onClose,
  customerName,
  isReturning = false,
}: Props) {
  if (!isOpen) return null;

  const firstName = customerName ? customerName.trim().split(' ')[0].toUpperCase() : null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close message"
        >
          <X size={16} />
        </button>

        <div className={styles.badgeTag}>EARLY ACCESS CONFIRMED</div>

        <h2 className={styles.welcomeHeading}>
          {isReturning
            ? firstName
              ? `${firstName}, YOUR PLACE IS RESERVED.`
              : 'YOUR PLACE IS RESERVED.'
            : firstName
            ? `WELCOME, ${firstName}.`
            : 'WELCOME.'}
        </h2>

        <div className={styles.content}>
          <p className={styles.primaryText}>
            Our concierge team will notify you once we are live.
          </p>
          <p className={styles.secondaryText}>
            THANK YOU FOR TRUSTING US.
          </p>
        </div>

        <div className={styles.divider} />

        <div className={styles.conciergeContact}>
          <a
            href="https://www.instagram.com/godsmove.in/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactItem}
          >
            <span className={styles.contactLabel}>INSTAGRAM</span>
            <span>@godsmove.in</span>
          </a>

          <a href="mailto:support@godsmove.in" className={styles.contactItem}>
            <span className={styles.contactLabel}>EMAIL</span>
            <span>support@godsmove.in</span>
          </a>

          <a href="tel:+918827175801" className={styles.contactItem}>
            <span className={styles.contactLabel}>CONCIERGE</span>
            <span>+91 8827175801</span>
          </a>
        </div>
      </div>
    </div>
  );
}
