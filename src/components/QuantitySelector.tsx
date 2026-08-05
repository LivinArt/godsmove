'use client';

import { Minus, Plus } from 'lucide-react';
import styles from './QuantitySelector.module.css';
import { useStore } from '@/store/useStore';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  max?: number;
  isExclusive?: boolean;
}

export default function QuantitySelector({ quantity, onChange, max = 99, isExclusive = false }: QuantitySelectorProps) {
  const { showExclusiveCartToast } = useStore();

  const handleDecrement = () => {
    if (quantity > 1) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Quantity</span>
      <div className={styles.controls}>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={quantity <= 1}
          className={styles.button}
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <span className={styles.value}>{quantity}</span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={quantity >= max || (isExclusive && quantity >= 1)}
          className={styles.button}
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
