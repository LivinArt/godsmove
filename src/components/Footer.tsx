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
            <Link href="/" className={styles.logo}>GODSMOVE</Link>
            <p className={styles.tagline}>Doomed to Drip. SS26.</p>
          </div>

          <div className={styles.columns}>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Shop</h4>
              <Link href="/shop" className={styles.colLink}>All Products</Link>
              <Link href="/shop?collection=drop-001" className={styles.colLink}>Drop 001</Link>
              <Link href="/shop?collection=drop-002" className={styles.colLink}>Drop 002</Link>
            </div>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>World</h4>
              <Link href="/archive" className={styles.colLink}>Archive</Link>
              <Link href="#" className={styles.colLink}>About</Link>
              <Link href="#" className={styles.colLink}>Contact</Link>
            </div>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Help</h4>
              <Link href="#" className={styles.colLink}>Sizing</Link>
              <Link href="#" className={styles.colLink}>Shipping</Link>
              <Link href="#" className={styles.colLink}>Returns</Link>
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
            <button type="submit" className={styles.nlBtn} id="footer-subscribe">
              <ArrowUpRight size={18} />
            </button>
          </form>
        </div>

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span>© 2026 GODSMOVE. All rights reserved.</span>
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
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
