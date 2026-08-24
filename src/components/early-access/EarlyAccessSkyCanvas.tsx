'use client';

import React from 'react';
import styles from './EarlyAccessSkyCanvas.module.css';

export default function EarlyAccessSkyCanvas() {
  return (
    <div className={styles.skyContainer} aria-hidden="true">
      {/* Background Soft Sky Gradient Overlay */}
      <div className={styles.skyGradient} />

      {/* SVG Fine-Line Contour Clouds & Vintage Airships Layer */}
      <svg
        className={styles.skySvg}
        viewBox="0 0 1440 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Subtle Golden-Ivory Line Gradient */}
          <linearGradient id="lineGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(197, 160, 89, 0.02)" />
            <stop offset="50%" stopColor="rgba(197, 160, 89, 0.16)" />
            <stop offset="100%" stopColor="rgba(197, 160, 89, 0.02)" />
          </linearGradient>

          <linearGradient id="lineIvory" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(249, 248, 246, 0.03)" />
            <stop offset="50%" stopColor="rgba(249, 248, 246, 0.12)" />
            <stop offset="100%" stopColor="rgba(249, 248, 246, 0.03)" />
          </linearGradient>
        </defs>

        {/* ── ARCHITECTURAL / EDITORIAL CLOUD CONTOUR PATHS ── */}
        <g className={styles.cloudsGroup}>
          {/* Top Cloud Formation */}
          <path
            d="M -100 180 C 150 120, 320 220, 540 150 C 720 90, 950 190, 1180 130 C 1350 85, 1500 160, 1600 140"
            stroke="url(#lineGold)"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          <path
            d="M -50 200 C 200 150, 380 240, 600 170 C 800 110, 1020 210, 1250 150 C 1400 110, 1550 180, 1650 160"
            stroke="url(#lineIvory)"
            strokeWidth="0.75"
          />

          {/* Mid Sky Cloud Waves */}
          <path
            d="M -80 380 C 180 320, 420 440, 700 360 C 940 290, 1150 410, 1400 340 C 1520 310, 1600 360, 1680 350"
            stroke="url(#lineGold)"
            strokeWidth="0.85"
          />
          <path
            d="M 100 420 C 350 370, 580 480, 840 400 C 1080 330, 1300 450, 1550 380"
            stroke="url(#lineIvory)"
            strokeWidth="0.75"
            strokeDasharray="6 3"
          />

          {/* Lower Horizon Contour */}
          <path
            d="M -120 620 C 120 560, 360 680, 680 590 C 960 510, 1220 650, 1520 570"
            stroke="url(#lineGold)"
            strokeWidth="1"
          />
        </g>

        {/* ── AIRSHIP 1: VINTAGE FLYING BOAT (Top Right to Center Drift) ── */}
        <g className={styles.airship1}>
          {/* Hull & Hull Lines */}
          <path
            d="M 0 0 C 25 -10, 65 -10, 90 0 C 70 12, 20 12, 0 0 Z"
            stroke="rgba(197, 160, 89, 0.22)"
            strokeWidth="0.85"
            fill="none"
          />
          {/* Mast & Sail Lines */}
          <line x1="45" y1="-10" x2="45" y2="-38" stroke="rgba(197, 160, 89, 0.2)" strokeWidth="0.75" />
          <path
            d="M 45 -38 C 65 -25, 75 -15, 85 -10"
            stroke="rgba(197, 160, 89, 0.18)"
            strokeWidth="0.75"
            fill="none"
          />
          {/* Keel Fins */}
          <path d="M 15 6 L 10 14 L 25 8" stroke="rgba(197, 160, 89, 0.18)" strokeWidth="0.75" />
        </g>

        {/* ── AIRSHIP 2: EDITORIAL FLYING VESSEL (Mid Sky Drift Left) ── */}
        <g className={styles.airship2}>
          {/* Elliptical Envelope / Aerostat */}
          <ellipse
            cx="40"
            cy="0"
            rx="40"
            ry="14"
            stroke="rgba(249, 248, 246, 0.18)"
            strokeWidth="0.75"
            strokeDasharray="3 2"
            fill="none"
          />
          {/* Gondola Boat below */}
          <path
            d="M 15 18 C 30 24, 50 24, 65 18 C 55 28, 25 28, 15 18 Z"
            stroke="rgba(197, 160, 89, 0.22)"
            strokeWidth="0.8"
            fill="none"
          />
          {/* Rigging Lines */}
          <line x1="20" y1="12" x2="20" y2="18" stroke="rgba(249, 248, 246, 0.15)" strokeWidth="0.6" />
          <line x1="40" y1="14" x2="40" y2="18" stroke="rgba(249, 248, 246, 0.15)" strokeWidth="0.6" />
          <line x1="60" y1="12" x2="60" y2="18" stroke="rgba(249, 248, 246, 0.15)" strokeWidth="0.6" />
        </g>

        {/* ── AIRSHIP 3: MINIMALIST DISCOVERY VESSEL (Lower Diagonal Drift) ── */}
        <g className={styles.airship3}>
          <path
            d="M 0 0 C 15 -8, 45 -8, 60 0 C 45 8, 15 8, 0 0 Z"
            stroke="rgba(197, 160, 89, 0.18)"
            strokeWidth="0.75"
            fill="none"
          />
          <line x1="30" y1="-8" x2="30" y2="-25" stroke="rgba(197, 160, 89, 0.15)" strokeWidth="0.6" />
          <path d="M 30 -25 C 42 -16, 50 -10, 56 -5" stroke="rgba(197, 160, 89, 0.15)" strokeWidth="0.6" fill="none" />
        </g>
      </svg>
    </div>
  );
}
