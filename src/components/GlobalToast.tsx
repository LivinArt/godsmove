'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { X } from 'lucide-react';
import styles from './GlobalToast.module.css';

export default function GlobalToast() {
  const { toast, hideToast } = useStore();

  useEffect(() => {
    if (toast?.isOpen) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast) return null;

  return (
    <div className={`${styles.toastWrapper} ${toast.isOpen ? styles.open : ''}`}>
      <div className={styles.toast}>
        <div className={styles.content}>
          <h4 className={styles.title}>{toast.title}</h4>
          {toast.message ? <p className={styles.message}>{toast.message}</p> : null}
        </div>
        <button onClick={hideToast} className={styles.closeBtn} aria-label="Close notification">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
