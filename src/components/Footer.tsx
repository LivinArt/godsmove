'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  Truck, 
  Zap, 
  Wallet, 
  Headset, 
  Sparkles, 
  Award, 
  ArrowRight
} from 'lucide-react';
import styles from './Footer.module.css';

const SERVICE_ITEMS = [
  {
    icon: Truck,
    title: 'Complimentary Shipping',
    subtitle: 'Free delivery across India.',
  },
  {
    icon: Zap,
    title: 'Express Dispatch',
    subtitle: 'Quick order processing & shipping.',
  },
  {
    icon: Wallet,
    title: 'Instant Wallet Credit',
    subtitle: 'Fast returns credited to your GODSMOVE Wallet.',
  },
  {
    icon: Headset,
    title: '24×7 Concierge Support',
    subtitle: 'Email, WhatsApp & Phone Assistance.',
  },
  {
    icon: Sparkles,
    title: 'Luxury Shopping Experience',
    subtitle: 'Premium shopping from start to finish.',
  },
  {
    icon: Award,
    title: 'Master Craftsmanship',
    subtitle: 'Designed with precision and premium quality.',
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* ============================================================
            PART 1: LUXURY SERVICE STRIP (MONOCHROME CARDS)
            ============================================================ */}
        <section className={styles.serviceStripSection} aria-label="Luxury Brand Commitments">
          <div className={styles.serviceMarqueeContainer}>
            <div className={styles.serviceMarqueeTrack}>
              {/* Primary Track */}
              {SERVICE_ITEMS.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={`p-${idx}`} className={styles.serviceCard}>
                    <div className={styles.serviceIconWrap}>
                      <IconComp size={20} strokeWidth={1.25} className={styles.serviceIcon} />
                    </div>
                    <div className={styles.serviceContent}>
                      <h4 className={styles.serviceTitle}>{item.title}</h4>
                      <p className={styles.serviceSubtitle}>{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
              {/* Duplicate Track for Seamless Infinite Mobile Marquee Loop */}
              {SERVICE_ITEMS.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={`d-${idx}`} className={`${styles.serviceCard} ${styles.serviceCardDuplicate}`}>
                    <div className={styles.serviceIconWrap}>
                      <IconComp size={20} strokeWidth={1.25} className={styles.serviceIcon} />
                    </div>
                    <div className={styles.serviceContent}>
                      <h4 className={styles.serviceTitle}>{item.title}</h4>
                      <p className={styles.serviceSubtitle}>{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.logoWrap}>
            <Image
              src="/images/logo/logo-horizontal-white.png"
              alt="GODSMOVE"
              width={300}
              height={38}
              className={styles.logoImg}
            />
          </div>
          <p className={styles.editorialSentence}>Worn With Intent. Crafted for Permanence.</p>
        </div>

        {/* ============================================================
            PART 2: FOUR MAIN COLUMNS + CONTACT & NEWSLETTER
            ============================================================ */}
        <div className={styles.grid}>
          {/* Column 1: SHOP */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Shop</h3>
            <ul className={styles.colList}>
              <li><Link href="/drops">New Arrivals</Link></li>
              <li><Link href="/drops">Drops</Link></li>
              <li><Link href="/exclusive-rack">Exclusive Rack</Link></li>
              <li><Link href="/category/tees">Collections</Link></li>
            </ul>
          </div>

          {/* Column 2: ACCOUNT */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Account</h3>
            <ul className={styles.colList}>
              <li><Link href="/profile">My Profile</Link></li>
              <li><Link href="/profile?tab=collection">Your Collection</Link></li>
              <li><Link href="/profile?tab=prebookings">My Pre-Bookings</Link></li>
              <li><Link href="/profile?tab=returns">Returns & Exchanges</Link></li>
              <li><Link href="/profile?tab=credits">GODSMOVE Credits</Link></li>
              <li><Link href="/profile?tab=care">GODSMOVE Care</Link></li>
              <li><Link href="/wishlist">Wishlist</Link></li>
            </ul>
          </div>

          {/* Column 3: LEGAL */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Legal & Policies</h3>
            <ul className={styles.colList}>
              <li><Link href="/terms">Terms & Conditions</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms#pre-booking-terms">Pre-Booking Terms</Link></li>
              <li><Link href="/terms#membership-terms">Membership Terms</Link></li>
              <li><Link href="/shipping-exchange-policy">Shipping & Exchange Policy</Link></li>
              <li><Link href="/cancellation-refund-policy">Cancellation & Refund Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: ABOUT */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>About</h3>
            <ul className={styles.colList}>
              <li><Link href="/our-story">Our Story</Link></li>
              <li><Link href="/our-story">Craftsmanship</Link></li>
              <li><Link href="/library">GODSMOVE Library</Link></li>
              <li><Link href="/contact">Concierge Support</Link></li>
            </ul>
          </div>

          {/* Column 5: CONTACT & NEWSLETTER */}
          <div className={`${styles.col} ${styles.contactCol}`}>
            <h3 className={styles.colTitle}>Concierge Contact</h3>
            <ul className={styles.contactList}>
              <li>
                <span className={styles.contactLabel}>Email:</span>{' '}
                <a href="mailto:support@godsmove.in" className={styles.contactValue}>support@godsmove.in</a>
              </li>
              <li>
                <span className={styles.contactLabel}>Phone:</span>{' '}
                <a href="tel:+918827175801" className={styles.contactValue}>+91 8827175801</a>
              </li>
              <li>
                <span className={styles.contactLabel}>WhatsApp:</span>{' '}
                <a href="https://wa.me/918827175801" target="_blank" rel="noopener noreferrer" className={styles.contactValue}>+91 8827175801</a>
              </li>
            </ul>

            <div className={styles.newsletterBox}>
              <h4 className={styles.newsletterTitle}>Newsletter</h4>
              <p className={styles.newsletterText}>
                Receive archival releases, editorial notes and limited drop allocations.
              </p>
              <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={styles.newsletterInput}
                  id="footer-newsletter-email"
                  required
                />
                <button type="submit" className={styles.newsletterBtn} aria-label="Subscribe to newsletter">
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Social Icons */}
        <div className={styles.bottom}>
          <div className={styles.bottomLeft}>
            <span>Designed & Engineered in India.</span>
            <span className={styles.copyright}>© {new Date().getFullYear()} GODSMOVE. All Rights Reserved.</span>
          </div>

          <div className={styles.socials}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              <span>Instagram</span>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
              <span>Facebook</span>
            </a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Pinterest</span>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
              <span>YouTube</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
