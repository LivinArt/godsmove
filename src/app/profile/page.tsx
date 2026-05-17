'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Heart, 
  Wallet, 
  RotateCcw,
  Sparkles,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { ExclusiveAccessClient } from '@/components/profile/ExclusiveAccessClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './profile.module.css';

const TABS = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'orders', label: 'Order History', icon: ShoppingBag },
  { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
  { id: 'wallet', label: 'Store Credit', icon: Wallet },
  { id: 'exclusive', label: 'Exclusive Access', icon: Sparkles },
  { id: 'returns', label: 'Returns & Exchanges', icon: RotateCcw },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <ScrollReveal>
              <div className={styles.logoWrap}>
                <img src="/images/godsmove-logo.png" alt="GODSMOVE" className={styles.logoImage} />
              </div>
              <h1 className="h1">Your Profile</h1>
              <p className={styles.subtitle}>Everything you own. Everything you claim.</p>
            </ScrollReveal>
          </div>

          <div className={styles.dashboard}>
            <ScrollReveal className={styles.sidebar}>
              <nav className={styles.nav}>
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon size={18} />
                      <span>{tab.label}</span>
                      <ChevronRight size={16} className={styles.navChevron} />
                    </button>
                  );
                })}
                <div className={styles.navDivider} />
                <Link href="/wishlist" className={styles.navItem}>
                  <Heart size={18} />
                  <span>Wishlist Shortcut</span>
                  <ChevronRight size={16} className={styles.navChevron} />
                </Link>
                <button className={`${styles.navItem} ${styles.logoutBtn}`}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </nav>
            </ScrollReveal>

            <ScrollReveal delay={100} className={styles.content}>
              {activeTab === 'personal' && (
                <div className={styles.panel}>
                  <h2 className="h3">Personal Information</h2>
                  <p className={styles.panelDesc}>Manage your account details and contact information.</p>
                  
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>First Name</label>
                      <input type="text" defaultValue="Guest" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Last Name</label>
                      <input type="text" defaultValue="User" className={styles.input} />
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Email Address</label>
                      <input type="email" defaultValue="guest@godsmove.in" className={styles.input} readOnly />
                    </div>
                    <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                      <label>Phone Number</label>
                      <input type="tel" placeholder="+91" className={styles.input} />
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: 'var(--space-xl)' }}>
                    Save Changes
                  </button>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className={styles.panel}>
                  <h2 className="h3">Order History</h2>
                  <p className={styles.panelDesc}>View and track your recent orders.</p>
                  
                  <div className={styles.emptyState}>
                    <ShoppingBag size={48} className={styles.emptyIcon} />
                    <h3 className="h3">No orders yet.</h3>
                    <p className={styles.emptyText}>When you make a move, it will appear here.</p>
                    <Link href="/drops" className="btn btn-primary">Explore Drops</Link>
                  </div>
                </div>
              )}

              {activeTab === 'addresses' && (
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <div>
                      <h2 className="h3">Saved Addresses</h2>
                      <p className={styles.panelDesc}>Manage your shipping and billing addresses.</p>
                    </div>
                    <button className="btn btn-secondary">Add New</button>
                  </div>

                  <div className={styles.emptyState}>
                    <MapPin size={48} className={styles.emptyIcon} />
                    <h3 className="h3">No addresses saved.</h3>
                    <p className={styles.emptyText}>Add an address for faster checkout.</p>
                  </div>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className={styles.panel}>
                  <h2 className="h3">Store Credit</h2>
                  <p className={styles.panelDesc}>Your available balance for future drops.</p>

                  <div className={styles.walletCard}>
                    <span className="caption" style={{ color: 'var(--smoke)' }}>Available Balance</span>
                    <h2 className="display" style={{ margin: 'var(--space-sm) 0' }}>₹0.00</h2>
                    <p className={styles.panelDesc}>Applicable automatically at checkout.</p>
                  </div>

                  <div className={styles.transactions}>
                    <h3 className="h4">Recent Transactions</h3>
                    <p className={styles.panelDesc}>No recent wallet activity.</p>
                  </div>
                </div>
              )}

              {activeTab === 'exclusive' && (
                <div className={styles.panel}>
                  <h2 className="h3">Exclusive Access</h2>
                  <p className={styles.panelDesc}>
                    Unlocked products, reservations, draw status, and wallet credits.
                  </p>
                  <ExclusiveAccessClient />
                </div>
              )}

              {activeTab === 'returns' && (
                <div className={styles.panel}>
                  <h2 className="h3">Returns & Exchanges</h2>
                  <p className={styles.panelDesc}>Track your return requests and exchanges.</p>

                  <div className={styles.emptyState}>
                    <RotateCcw size={48} className={styles.emptyIcon} />
                    <h3 className="h3">No active requests.</h3>
                    <p className={styles.emptyText}>If you need to make a return, start from your order history.</p>
                  </div>
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
