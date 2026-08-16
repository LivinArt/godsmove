'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Menu, X, User, Home, Sparkles, Star, BookOpen, Crown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/drops', label: 'Drops' },
  { href: '/exclusive-rack', label: 'Exclusive Rack' },
  { href: '/library', label: 'GODSMOVE Library' },
  { href: '/our-story', label: 'Story' },
] as const;

const HAMBURGER_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/drops', label: 'Drops', icon: Sparkles },
  { href: '/exclusive-rack', label: 'Exclusive Rack', icon: Star },
  { href: '/membership', label: 'MEMBERSHIP', icon: Crown },
  { href: '/library', label: 'GODSMOVE Library', icon: BookOpen },
  { href: '/our-story', label: 'Story', icon: BookOpen },
] as const;

interface NavbarProps {
  variant?: 'default' | 'exclusive-rack';
}

export default function Navbar({ variant = 'default' }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, openAuthModal, requireAuth } = useAuth();
  const isActiveMember = Boolean((profile as any)?.membership?.status === 'ACTIVE');
  const [scrolled, setScrolled] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const { isCartOpen, setCartOpen, isMobileMenuOpen, setMobileMenuOpen } = useStore();
  const cartCount = useStore((s) => s.cart.length > 0 ? s.getCartCount() : 0);
  const wishlistCount = useStore((s) => s.wishlist.length);

  const [pendingNav, setPendingNav] = useState<'wishlist' | 'profile' | 'membership' | 'cart' | null>(null);

  const isCartActive = isCartOpen || pathname === '/checkout';
  const isWishlistActive = !isCartActive && pathname.startsWith('/wishlist');
  const isProfileActive = !isCartActive && pathname.startsWith('/profile');

  // Reset pending state on route change or cart drawer state update
  useEffect(() => {
    setPendingNav(null);
  }, [pathname, isCartOpen]);

  // Intelligent prefetching for instant route navigation
  const prefetchRoute = (path: string) => {
    try {
      router.prefetch(path);
    } catch {}
  };

  useEffect(() => {
    prefetchRoute('/wishlist');
    prefetchRoute('/profile');
    prefetchRoute('/membership');
    prefetchRoute('/library');
  }, []);

  const handleWishlistClick = () => {
    if (pendingNav === 'wishlist') return;
    setPendingNav('wishlist');
    requireAuth(
      'wishlist',
      () => {
        router.push('/wishlist');
      },
      { type: 'wishlist' }
    );
  };

  const handleProfileClick = () => {
    if (pendingNav === 'profile') return;
    setPendingNav('profile');
    if (user) {
      router.push('/profile');
    } else {
      openAuthModal('profile');
      setPendingNav(null);
    }
  };

  const handleMembershipClick = () => {
    if (pendingNav === 'membership') return;
    setPendingNav('membership');
    if (user) {
      router.push('/membership');
    } else {
      openAuthModal('membership');
      setPendingNav(null);
    }
  };

  const handleCartClick = () => {
    if (pendingNav === 'cart') return;
    setPendingNav('cart');
    setCartOpen(true);
    setTimeout(() => setPendingNav(null), 200);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 60);
      
      const isHome = window.location.pathname === '/';
      if (isHome) {
        setScrolledPastHero(scrollY >= window.innerHeight - 88);
      } else {
        setScrolledPastHero(true);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

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

  const isHome = pathname === '/';
  const showHeroLogo = isHome && !scrolledPastHero;

  return (
    <>
      <nav className={`${styles.nav} ${variant === 'exclusive-rack' ? styles.exclusiveRackNav : ''} ${(scrolled || !isHome) ? styles.scrolled : ''} ${showHeroLogo ? styles.heroActive : ''}`}>
        <div className={styles.inner}>
          <div className={styles.leftZone}>
            <button
              className={styles.menuBtn}
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-menu"
              id="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
            </button>
            <nav className={styles.links} aria-label="Primary">
              {NAV_LINKS.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                    onMouseEnter={() => prefetchRoute(item.href)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className={styles.centerZone}>
            <Link href="/" className={styles.logoWrap} id="nav-logo" aria-label="GODSMOVE Home">
              <div className={styles.logoContainer}>
                {/* Banner Logo (Hero active style) */}
                <div className={`${styles.logoSingle} ${showHeroLogo ? styles.visible : ''}`}>
                  <Image
                    src="/images/logo/Banner.png"
                    alt="GODSMOVE"
                    width={280}
                    height={75}
                    priority
                    className={styles.horizontalLogoImg}
                  />
                </div>
                {/* Scroll Logo (Scrolled/Light page state) */}
                <div className={`${styles.logoSingle} ${!showHeroLogo ? styles.visible : ''}`}>
                  <Image
                    src="/images/logo/Scroll.png"
                    alt="GODSMOVE"
                    width={280}
                    height={75}
                    priority
                    className={styles.horizontalLogoImg}
                  />
                </div>
              </div>
            </Link>
          </div>

          <div className={styles.rightZone}>
            <div className={styles.actions}>
              <div className={styles.actionWrapper}>
                <button
                  type="button"
                  onClick={handleWishlistClick}
                  onMouseEnter={() => prefetchRoute('/wishlist')}
                  onTouchStart={() => prefetchRoute('/wishlist')}
                  className={`${styles.actionBtn} ${isWishlistActive ? styles.actionBtnActive : ''} ${pendingNav === 'wishlist' ? styles.actionBtnPending : ''}`}
                  aria-label="Your Wishlist"
                  id="nav-wishlist"
                >
                  <Heart size={20} strokeWidth={1.8} />
                  {wishlistCount > 0 && <span className={styles.badge}>{wishlistCount}</span>}
                </button>
                <span className={styles.tooltip}>Your Wishlist</span>
              </div>

              <div className={styles.actionWrapper}>
                <button
                  type="button"
                  onClick={handleProfileClick}
                  onMouseEnter={() => prefetchRoute('/profile')}
                  onTouchStart={() => prefetchRoute('/profile')}
                  className={`${styles.actionBtn} ${isProfileActive ? styles.actionBtnActive : ''} ${pendingNav === 'profile' ? styles.actionBtnPending : ''}`}
                  aria-label={user ? 'Your Profile' : 'Sign In'}
                  id="nav-profile"
                >
                  <User size={20} strokeWidth={1.8} />
                </button>
                <span className={styles.tooltip}>{user ? 'Your Profile' : 'Sign In'}</span>
              </div>

              {/* Membership Icon & Indicator (Desktop Only) */}
              <div className={`${styles.actionWrapper} ${styles.desktopOnlyNavAction}`}>
                <button
                  type="button"
                  onClick={handleMembershipClick}
                  onMouseEnter={() => prefetchRoute('/membership')}
                  onTouchStart={() => prefetchRoute('/membership')}
                  className={`${styles.actionBtn} ${pathname.startsWith('/membership') ? styles.actionBtnActive : ''} ${pendingNav === 'membership' ? styles.actionBtnPending : ''}`}
                  aria-label="GODSMOVE Membership"
                  id="nav-membership"
                >
                  <Crown size={20} strokeWidth={1.8} style={{ color: isActiveMember ? '#d4af37' : 'currentColor' }} />
                  {isActiveMember && <span className={styles.memberDot} />}
                </button>
                <span className={styles.tooltip}>{isActiveMember ? 'GODSMOVE Member' : 'Membership'}</span>
              </div>

              <div className={styles.actionWrapper}>
                <button
                  className={`${styles.actionBtn} ${isCartActive ? styles.actionBtnActive : ''} ${pendingNav === 'cart' ? styles.actionBtnPending : ''}`}
                  onClick={handleCartClick}
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

      {/* Task 6: Mobile Half-Screen Luxury Side Drawer */}
      <div
        id="mobile-nav-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={`${styles.mobileOverlay} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div className={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
          <div>
            <div className={styles.mobileDrawerHeader}>
              <span className={styles.mobileDrawerTitle}>GODSMOVE</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className={styles.mobileDrawerCloseBtn}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.mobileLinks}>
              {HAMBURGER_LINKS.map((item) => {
                const IconComp = item.icon;
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <IconComp size={16} style={{ color: isActive ? '#c8a46a' : 'rgba(255,255,255,0.7)' }} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={styles.mobileMeta}>
            <p className={styles.mobileTag}>Make your move.</p>
          </div>
        </div>
      </div>
    </>
  );
}
