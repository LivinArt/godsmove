'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './MobileQuickAddSheet.module.css';

interface SizeItem {
  size: string;
  available: boolean;
}

interface MobileQuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  colors?: string[];
  sizes: SizeItem[];
  addingSize: string | null;
  onAddSize: (size: string, color?: string) => void;
  actionType?: 'buy' | 'add';
}

export default function MobileQuickAddSheet({
  isOpen,
  onClose,
  productName,
  colors = [],
  sizes,
  addingSize,
  onAddSize,
  actionType = 'add',
}: MobileQuickAddSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const [selectedColorState, setSelectedColorState] = useState<string>(colors && colors.length > 0 ? colors[0] : '');

  useEffect(() => {
    if (colors && colors.length > 0 && !selectedColorState) {
      setSelectedColorState(colors[0]);
    }
  }, [colors, selectedColorState]);

  // Allow natural page scrolling while drawer is open + close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 60) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${isOpen ? styles.sheetOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Select specifications for ${productName}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.label}>{actionType === 'buy' ? 'Instant Allocation' : 'Quick Add'}</span>
          <p className={styles.productName}>{productName}</p>
        </div>

        {/* Color Selection Step (if multiple colors exist) */}
        {colors && colors.length > 1 && (
          <div style={{ padding: '0 20px 16px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8a46a', display: 'block', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
              1. Select Colour: <strong style={{ color: '#FAF8F5' }}>{selectedColorState}</strong>
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {colors.map((c) => {
                const isSel = selectedColorState === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColorState(c)}
                    style={{
                      padding: '10px 16px',
                      minHeight: '44px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: isSel ? 'rgba(200, 164, 106, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSel ? '#c8a46a' : 'var(--text-secondary)',
                      border: isSel ? '1.5px solid #c8a46a' : '1px solid var(--border-medium)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size Grid */}
        <div style={{ padding: '0 20px 10px' }}>
          {colors && colors.length > 1 && (
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8a46a', display: 'block', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
              2. Select Size
            </span>
          )}
          <div className={styles.sizeGrid}>
            {sizes.map((item) => {
              const isAddingThis = addingSize === item.size;
              return (
                <button
                  key={item.size}
                  disabled={!item.available || addingSize !== null}
                  className={`${styles.sizeBtn} ${!item.available ? styles.sizeBtnDisabled : ''} ${isAddingThis ? styles.sizeBtnAdding : ''}`}
                  onClick={() => {
                    onAddSize(item.size, selectedColorState || undefined);
                    setTimeout(onClose, 700);
                  }}
                >
                  {isAddingThis ? (
                    <span className={styles.spinner} />
                  ) : (
                    item.size.replace('_', ' ')
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <p className={styles.footerNote}>
          {actionType === 'buy' ? 'Select specifications to proceed to checkout' : 'Select a size to add to your bag'}
        </p>
      </div>
    </>
  );
}
