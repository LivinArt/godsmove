'use client';

import { Minus, Plus } from 'lucide-react';
import styles from './QuantitySelector.module.css';
import { useStore } from '@/store/useStore';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  max?: number;
  isExclusiveRack?: boolean;
}

export default function QuantitySelector({ quantity, onChange, max = 99, isExclusiveRack = false }: QuantitySelectorProps) {
  const { showToast } = useStore();

  const handleDecrement = () => {
    if (quantity > 1) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (isExclusiveRack && quantity >= 1) {
      showToast("One Artifact Per Custodian", "Each Exclusive Rack piece is reserved as a singular acquisition. Only one artifact may be claimed by each custodian.");
      return;
    }
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
          disabled={quantity >= max || (isExclusiveRack && quantity >= 1)}
          className={styles.button}
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
