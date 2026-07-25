'use client';

import { useState } from 'react';
import { ChevronDown, List } from 'lucide-react';
import styles from './LegalPageLayout.module.css';

export interface TocSection {
  id: string;
  title: string;
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  subtitle,
  sections,
  children,
}: {
  title: string;
  lastUpdated: string;
  subtitle: string;
  sections: TocSection[];
  children: React.ReactNode;
}) {
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileTocOpen(false);
  };

  return (
    <div className={styles.legalWrap}>
      {/* Hero Header */}
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>GODSMOVE LEGAL CONCIERGE</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          <span className={styles.lastUpdated}>Effective Date: {lastUpdated}</span>
        </div>
      </section>

      {/* Main Body Grid */}
      <div className={styles.mainContainer}>
        {/* Mobile Accordion TOC */}
        <div className={styles.mobileToc}>
          <button
            type="button"
            className={styles.mobileTocTrigger}
            onClick={() => setMobileTocOpen(!mobileTocOpen)}
            aria-expanded={mobileTocOpen}
          >
            <div className={styles.mobileTocTitle}>
              <List size={16} />
              <span>Table of Contents</span>
            </div>
            <ChevronDown
              size={16}
              style={{ transform: mobileTocOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {mobileTocOpen && (
            <ul className={styles.mobileTocList}>
              {sections.map((sec) => (
                <li key={sec.id}>
                  <button type="button" onClick={() => scrollToSection(sec.id)}>
                    {sec.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Content Grid */}
        <div className={styles.grid}>
          {/* Desktop Sticky Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarSticky}>
              <h3 className={styles.sidebarHeading}>Table of Contents</h3>
              <ul className={styles.sidebarList}>
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <button type="button" onClick={() => scrollToSection(sec.id)}>
                      {sec.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Article Text Content */}
          <article className={styles.articleContent}>{children}</article>
        </div>
      </div>
    </div>
  );
}
