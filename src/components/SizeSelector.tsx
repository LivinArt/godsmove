'use client';

import styles from './SizeSelector.module.css';

interface SizeSelectorProps {
  sizes: { label: string; available: boolean }[];
  selected: string | null;
  onSelect: (size: string) => void;
}

export default function SizeSelector({ sizes, selected, onSelect }: SizeSelectorProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>Size</span>
        {selected && <span className={styles.selected}>{selected}</span>}
      </div>
      <div className={styles.sizes}>
        {sizes.map((size) => (
          <button
            key={size.label}
            className={`${styles.size} ${selected === size.label ? styles.active : ''} ${!size.available ? styles.unavailable : ''}`}
            onClick={() => size.available && onSelect(size.label)}
            disabled={!size.available}
            aria-label={`Size ${size.label}${!size.available ? ' - sold out' : ''}`}
          >
            {size.label}
          </button>
        ))}
      </div>
    </div>
  );
}
