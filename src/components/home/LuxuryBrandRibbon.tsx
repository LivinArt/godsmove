import React from 'react';
import styles from './LuxuryBrandRibbon.module.css';

const DROP_ITEMS = Array(12).fill('DROP');
const EXCLUSIVE_ITEMS = Array(10).fill('EXCLUSIVE RACK');

export default function LuxuryBrandRibbon() {
  return (
    <div className={styles.section} aria-hidden="true">
      {/* Ribbon 1: DROP — Premium Charcoal Black Graphic Ribbon */}
      <div className={`${styles.ribbon} ${styles.ribbonDrop}`}>
        <div className={styles.trackDrop}>
          {[...DROP_ITEMS, ...DROP_ITEMS].map((text, idx) => (
            <span key={`drop-${idx}`} className={styles.itemDrop}>
              {text} <span className={styles.dotGold} />
            </span>
          ))}
        </div>
      </div>

      {/* Ribbon 2: EXCLUSIVE RACK — Premium Warm White Graphic Ribbon */}
      <div className={`${styles.ribbon} ${styles.ribbonExclusive}`}>
        <div className={styles.trackExclusive}>
          {[...EXCLUSIVE_ITEMS, ...EXCLUSIVE_ITEMS].map((text, idx) => (
            <span key={`exc-${idx}`} className={styles.itemExclusive}>
              {text} <span className={styles.dotDark} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
