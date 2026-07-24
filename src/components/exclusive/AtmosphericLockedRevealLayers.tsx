'use client';

import type { CSSProperties } from 'react';
import styles from './atmospheric-locked-reveal.module.css';

type Props = {
  imageUrl: string;
};

/**
 * Layered atmospheric stack only — no pointer logic.
 * Parent must use class `gm-atmospheric-reveal-host` + useAtmosphericRevealPointer on that node
 * so touch / reduced-motion rules apply.
 */
export function AtmosphericLockedRevealLayers({ imageUrl }: Props) {
  const bg = { backgroundImage: `url("${imageUrl}")` } as CSSProperties;

  return (
    <div className={styles.stage} aria-hidden>
      <div className={styles.layerSilhouette} style={bg} />
      <div className={styles.layerEmergence} style={bg} />
      <div className={styles.layerDiffusion} style={bg} />
      <div className={styles.layerGrain} />
      <div className={styles.layerAmbient} />
      <div className={styles.layerVignette} />
    </div>
  );
}
