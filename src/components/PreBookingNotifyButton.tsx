'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './PreBookingNotifyButton.module.css';

interface PreBookingNotifyButtonProps {
  product: {
    id: string;
    name?: string;
    isPreBooking?: boolean;
    [key: string]: any;
  };
  variant?: 'default' | 'compact' | 'iconOnly';
  fullWidth?: boolean;
  showSubText?: boolean;
  className?: string;
  onRegisteredChange?: (registered: boolean) => void;
}

export const PreBookingNotifyButton: React.FC<PreBookingNotifyButtonProps> = ({
  product,
  showSubText = true,
  className = '',
  onRegisteredChange,
}) => {
  const { requireAuth } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'registered'>('idle');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;
    if (product?.id) {
      import('@/actions/prebooking-interest.actions').then(({ checkPreBookingInterestAction }) => {
        checkPreBookingInterestAction(product.id).then((res) => {
          if (!isCancelled && res.isRegistered) {
            setStatus('registered');
            setNoticeMessage('You will be notified on launch.');
            if (onRegisteredChange) onRegisteredChange(true);
          }
        });
      });
    }

    const handleGlobalNotifyUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ productId: string; registered: boolean }>;
      if (customEvt.detail?.productId === product?.id) {
        const isReg = Boolean(customEvt.detail.registered);
        setStatus(isReg ? 'registered' : 'idle');
        setNoticeMessage(isReg ? 'You will be notified on launch.' : 'No notification on launch.');
        if (onRegisteredChange) onRegisteredChange(isReg);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gm_notify_interest_updated', handleGlobalNotifyUpdate);
    }

    return () => {
      isCancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('gm_notify_interest_updated', handleGlobalNotifyUpdate);
      }
    };
  }, [product?.id, onRegisteredChange]);

  const isConfirmed = status === 'registered';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPendingRef.current) return;

    requireAuth(
      'notify',
      async () => {
        // 1. OPTIMISTIC UPDATE: Immediate <10ms visual response
        const nextIsReg = !isConfirmed;
        const previousStatus = status;
        const previousMessage = noticeMessage;

        setStatus(nextIsReg ? 'registered' : 'idle');
        const optimisticMsg = nextIsReg ? 'You will be notified on launch.' : 'No notification on launch.';
        setNoticeMessage(optimisticMsg);

        if (onRegisteredChange) onRegisteredChange(nextIsReg);

        // Instantly dispatch global event to sync all matching bells on screen
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('gm_notify_interest_updated', {
              detail: { productId: product.id, registered: nextIsReg },
            })
          );
        }

        // 2. BACKGROUND PERSISTENCE
        isPendingRef.current = true;
        try {
          const { togglePreBookingInterestAction } = await import('@/actions/prebooking-interest.actions');
          const res = await togglePreBookingInterestAction(product.id);
          isPendingRef.current = false;

          if (!res.success) {
            // ROLLBACK ON SERVER FAILURE
            setStatus(previousStatus);
            setNoticeMessage("Couldn't save preference. Try again.");
            if (onRegisteredChange) onRegisteredChange(previousStatus === 'registered');
          }
        } catch (err) {
          isPendingRef.current = false;
          console.error('Notify Me background action failed:', err);
          // ROLLBACK ON EXCEPTION
          setStatus(previousStatus);
          setNoticeMessage("Couldn't save preference. Try again.");
          if (onRegisteredChange) onRegisteredChange(previousStatus === 'registered');
        }
      },
      { type: 'notify', product }
    );
  };

  const getAriaLabel = () => {
    if (isConfirmed) return 'Launch notification active. Click to turn off.';
    return 'Notify me when this product launches';
  };

  const buttonClasses = [
    styles.bellButton,
    isConfirmed ? styles.bellActive : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.bellWrapper}>
      <button
        type="button"
        onClick={handleClick}
        className={buttonClasses}
        aria-label={getAriaLabel()}
        title={getAriaLabel()}
      >
        <Bell
          size={18}
          className={styles.bellIcon}
          fill={isConfirmed ? '#C5A059' : 'none'}
          color={isConfirmed ? '#C5A059' : 'currentColor'}
        />
      </button>

      {showSubText && (
        <div className={styles.noticeContainer}>
          {noticeMessage && (
            <span
              className={`${styles.noticeText} ${isConfirmed ? styles.noticeActive : styles.noticeInactive}`}
              aria-live="polite"
            >
              {noticeMessage}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
