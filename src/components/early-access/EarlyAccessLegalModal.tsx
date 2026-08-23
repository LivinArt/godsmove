'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import PrivacyPolicyContent from '@/components/legal/PrivacyPolicyContent';
import TermsContent from '@/components/legal/TermsContent';
import styles from './EarlyAccessLegalModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms' | null;
}

export default function EarlyAccessLegalModal({ isOpen, onClose, type }: Props) {
  // ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !type) return null;

  const modalTitle = type === 'privacy' ? 'PRIVACY POLICY' : 'TERMS OF SERVICE';

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-access-legal-modal-title"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Sticky Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.brandEyebrow}>GODSMOVƎ ARCHIVAL LEGAL</span>
            <h2 id="early-access-legal-modal-title" className={styles.title}>
              {modalTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close legal document"
          >
            <span>CLOSE</span>
            <X size={14} />
          </button>
        </div>

        {/* Scrollable Legal Content Area */}
        <div className={styles.scrollArea}>
          {type === 'privacy' ? <PrivacyPolicyContent /> : <TermsContent />}
        </div>

        {/* Footer Bar */}
        <div className={styles.footerBar}>
          <span>LIVINART TECHNOLOGIES PRIVATE LIMITED</span>
          <button
            type="button"
            onClick={onClose}
            className={styles.footerCloseBtn}
          >
            CLOSE DOCUMENT ×
          </button>
        </div>
      </div>
    </div>
  );
}
