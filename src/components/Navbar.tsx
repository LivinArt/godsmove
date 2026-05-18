'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, Menu, X, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Image from 'next/image';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/drops', label: 'Drops' },
  { href: '/exclusive-unlock', label: 'Access' },
  { href: '/exclusive-rack', label: 'Exclusive Rack' },
  { href: '/our-story', label: 'Story' },
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { setCartOpen, isMobileMenuOpen, setMobileMenuOpen } = useStore();
  const cartCount = useStore((s) => s.cart.length > 0 ? s.getCartCount() : 0);
  const wishlistCount = useStore((s) => s.wishlist.length);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          <div className={styles.leftZone}>
            <button
              className={styles.menuBtn}
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              id="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <nav className={styles.links} aria-label="Primary">
              {NAV_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.centerZone}>
            <Link href="/" className={styles.logoWrap} id="nav-logo" aria-label="GODSMOVE Home">
              <div className={styles.logoImage}>
                <Image
                  src="/images/godsmove-logo.png"
                  alt="GODSMOVE"
                  width={320}
                  height={40}
                  priority
                  className={styles.img}
                />
              </div>
            </Link>
          </div>

          <div className={styles.rightZone}>
            <div className={styles.actions}>
              <div className={styles.actionWrapper}>
                <Link
                  href="/wishlist"
                  className={styles.actionBtn}
                  aria-label="Your Wishlist"
                  id="nav-wishlist"
                >
                  <Heart size={20} strokeWidth={1.8} />
                  {wishlistCount > 0 && <span className={styles.badge}>{wishlistCount}</span>}
                </Link>
                <span className={styles.tooltip}>Your Wishlist</span>
              </div>

              <div className={styles.actionWrapper}>
                <Link
                  href="/profile"
                  className={styles.actionBtn}
                  aria-label="Your Profile"
                  id="nav-profile"
                >
                  <User size={20} strokeWidth={1.8} />
                </Link>
                <span className={styles.tooltip}>Your Profile</span>
              </div>

              <div className={styles.actionWrapper}>
                <button
                  className={styles.actionBtn}
                  onClick={() => setCartOpen(true)}
                  aria-label="Your Bag"
                  id="nav-cart"
                >
                  <ShoppingBag size={20} strokeWidth={1.8} />
                  {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
                </button>
                <span className={styles.tooltip}>Your Bag</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.mobileContent}>
          <div className={styles.mobileLinks}>
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/profile"
              className={styles.mobileLinkSecondary}
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/wishlist"
              className={styles.mobileLinkSecondary}
              onClick={() => setMobileMenuOpen(false)}
            >
              Wishlist
            </Link>
            <button
              type="button"
              className={styles.mobileLinkSecondary}
              onClick={() => {
                setMobileMenuOpen(false);
                setCartOpen(true);
              }}
            >
              Cart
            </button>
          </div>
          <div className={styles.mobileMeta}>
            <p className="caption">SS26 Collection</p>
            <p className={styles.mobileTag}>Make your move.</p>
          </div>
        </div>
      </div>
    </>
  );
}
