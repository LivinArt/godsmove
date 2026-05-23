'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import styles from './Footer.module.css';

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logoWrap} aria-label="GODSMOVE Home">
              <img src="/images/godsmove-logo.png" alt="GODSMOVE" className={styles.logoImage} />
            </Link>
            <p className={styles.tagline}>Worn With Intent. SS26.</p>
          </div>

          <div className={styles.columns}>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Shop</h4>
              <Link href="/drops" className={styles.colLink}>Explore Drops</Link>
            </div>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>World</h4>
              <Link href="/archive" className={styles.colLink}>Archive</Link>
              <Link href="/our-story" className={styles.colLink}>Our Story</Link>
              <Link href="#" className={styles.colLink}>Contact</Link>
            </div>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Help</h4>
              <Link href="/sizing" className={styles.colLink}>Sizing</Link>
              <Link href="/shipping" className={styles.colLink}>Shipping</Link>
            </div>
          </div>
        </div>

        <div className={styles.newsletter}>
          <p className={styles.nlLabel}>Move with purpose.</p>
          <form className={styles.nlForm} onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Email address"
              className={styles.nlInput}
              id="footer-email"
              aria-label="Email for newsletter"
            />
            <button type="submit" className={styles.nlBtn} id="footer-subscribe" aria-label="Subscribe">
              <ArrowUpRight size={18} />
            </button>
          </form>
        </div>

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span>© 2026 GODSMOVE. All rights reserved.</span>
            <Link href="/policies">Our Policies</Link>
            <Link href="/terms">Terms & Conditions</Link>
          </div>
          <div className={styles.social}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <InstagramIcon size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
