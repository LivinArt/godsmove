import React from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import styles from './LegalLayout.module.css';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showDisclaimer?: boolean;
}

export default function LegalLayout({ title, subtitle, children, showDisclaimer = false }: LegalLayoutProps) {
  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.logoWrap}>
              <Image 
                src="/images/godsmove-logo.png" 
                alt="GODSMOVE" 
                width={200} 
                height={28} 
                className={styles.logoImage} 
              />
            </div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>

          <div className={styles.content}>
            {children}
          </div>

          {showDisclaimer && (
            <div className={styles.disclaimer}>
              <p>
                Product descriptions, narratives, symbolic interpretations, specifications, material references, availability statements, and storytelling elements are provided for brand communication and illustrative purposes. Certain details may vary based on availability, manufacturing considerations, and operational requirements. All purchases remain subject to applicable terms and conditions.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
