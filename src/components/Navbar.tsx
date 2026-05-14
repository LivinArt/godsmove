'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, Menu, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { getCartCount, setCartOpen, isMobileMenuOpen, setMobileMenuOpen } = useStore();
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
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          <button
            className={styles.menuBtn}
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            id="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className={styles.logo} id="nav-logo">
            GODSMOVE
          </Link>

          <div className={styles.links}>
            <Link href="/shop" className={styles.link}>Shop</Link>
            <Link href="/shop?collection=drop-001" className={styles.link}>Drops</Link>
            <Link href="/archive" className={styles.link}>Archive</Link>
          </div>

          <div className={styles.actions}>
            <Link href="/wishlist" className={styles.actionBtn} aria-label="Wishlist" id="nav-wishlist">
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span className={styles.badge}>{wishlistCount}</span>
              )}
            </Link>
            <button
              className={styles.actionBtn}
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              id="nav-cart"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className={styles.badge}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.mobileContent}>
          <div className={styles.mobileLinks}>
            <Link
              href="/shop"
              className={styles.mobileLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              href="/shop?collection=drop-001"
              className={styles.mobileLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Drops
            </Link>
            <Link
              href="/archive"
              className={styles.mobileLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              Archive
            </Link>
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
