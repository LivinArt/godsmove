'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand Header: Large Logo & Small Editorial statement */}
        <div className={styles.brandHeader}>
          <div className={styles.logoWrap}>
            <Image
              src="/images/logo/logo-horizontal-white.png"
              alt="GODSMOVE"
              width={320}
              height={40}
              className={styles.logoImg}
            />
          </div>
          <p className={styles.editorialSentence}>Crafted for permanence.</p>
        </div>

        {/* Elegant divider */}
        <div className={styles.divider} />

        {/* Navigation Grid */}
        <div className={styles.grid}>
          {/* Column 1: Shop */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Shop</h3>
            <ul className={styles.colList}>
              <li><Link href="/drops">Drops</Link></li>
              <li><Link href="/exclusive-rack">Exclusive Rack</Link></li>
              <li><Link href="/drops">Collections</Link></li>
              <li><Link href="/#new-arrivals">New Arrivals</Link></li>
              <li><Link href="/#editors-selection">Editor's Selection</Link></li>
            </ul>
          </div>

          {/* Column 2: Client Services */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Client Services</h3>
            <ul className={styles.colList}>
              <li><Link href="/profile">Orders</Link></li>
              <li><Link href="/shipping">Shipping</Link></li>
              <li><Link href="/profile">Returns</Link></li>
              <li><span className={styles.inactiveLink}>Repair & Care</span></li>
              <li><Link href="/our-story">Contact</Link></li>
            </ul>
          </div>

          {/* Column 3: Members */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Members</h3>
            <ul className={styles.colList}>
              <li><Link href="/wishlist">Wishlist</Link></li>
              <li><Link href="/profile">Passport</Link></li>
              <li><Link href="/profile">Wallet</Link></li>
              <li><Link href="/profile">Account</Link></li>
              <li><Link href="/archive">Archive</Link></li>
            </ul>
          </div>

          {/* Column 4: World of GODSMOVE */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>World of GODSMOVE</h3>
            <ul className={styles.colList}>
              <li><Link href="/our-story">Story</Link></li>
              <li><span className={styles.inactiveLink}>Journal</span></li>
              <li><Link href="/our-story">Craftsmanship</Link></li>
              <li><Link href="/our-story">Materials</Link></li>
              <li><span className={styles.inactiveLink}>Careers</span></li>
              <li><span className={styles.inactiveLink}>Press</span></li>
            </ul>
          </div>

          {/* Column 5: Newsletter */}
          <div className={`${styles.col} ${styles.newsletterCol}`}>
            <h3 className={styles.colTitle}>Newsletter</h3>
            <p className={styles.newsletterText}>
              Receive archival releases, editorial notes and limited drops.
            </p>
            <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                className={styles.newsletterInput}
                id="footer-newsletter-email"
                required
              />
              <button type="submit" className={styles.newsletterBtn} aria-label="Subscribe">
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className={styles.bottom}>
          <div className={styles.bottomLeft}>
            <span>Designed in India. Crafted with intent.</span>
            <span className={styles.copyright}>© GODSMOVE.</span>
          </div>
          <div className={styles.socials}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer">Pinterest</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
