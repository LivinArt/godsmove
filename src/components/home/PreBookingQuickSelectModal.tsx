'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import styles from './PreBookingQuickSelectModal.module.css';

interface PreBookingQuickSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export default function PreBookingQuickSelectModal({
  isOpen,
  onClose,
  product,
}: PreBookingQuickSelectModalProps) {
  const router = useRouter();
  const { beginInstantCheckout } = useStore();
  const { requireAuth } = useAuth();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedSize(null);
    setError(false);

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product || !mounted) return null;

  // Extract available sizes from variants
  const variants = product.variants || [];
  const sizes = variants.map((v: any) => ({
    label: v.size,
    available: (v.inventory?.totalStock ?? 1) > 0 && v.isActive !== false,
  }));

  const handleProceed = () => {
    if (!selectedSize) {
      setError(true);
      return;
    }
    setError(false);

    const orderType = 'PRE_BOOKING';
    requireAuth(
      'checkout',
      () => {
        beginInstantCheckout({
          product,
          size: selectedSize,
          quantity: 1,
          orderType,
        });
        onClose();
        router.push('/checkout');
      },
      { type: 'checkout', product, size: selectedSize, quantity: 1, orderType }
    );
  };

  const modalContent = (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>SELECT ALLOCATION SIZE</span>
            <h3 className={styles.title}>{product.name}</h3>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className={styles.sizeGrid}>
          {sizes.map((s: any) => {
            const isSelected = selectedSize === s.label;
            const isDisabled = !s.available;
            return (
              <button
                key={s.label}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  setSelectedSize(s.label);
                  setError(false);
                }}
                className={`${styles.sizeBtn} ${isSelected ? styles.sizeBtnActive : ''} ${isDisabled ? styles.sizeBtnDisabled : ''}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {error && <p className={styles.error}>Please select a size to proceed with pre-booking</p>}

        <button type="button" className={styles.checkoutBtn} onClick={handleProceed}>
          <span>PROCEED TO PRE-BOOK CHECKOUT</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
