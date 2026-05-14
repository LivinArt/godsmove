'use client';

import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollReveal from '@/components/ScrollReveal';
import { archiveEntries } from '@/data/collections';
import styles from './page.module.css';

const typeLabels: Record<string, string> = {
  editorial: 'Editorial',
  moodboard: 'Colour Study',
  observation: 'Observation',
  artifact: 'Process',
};

export default function ArchivePage() {
  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        <div className="container">
          <ScrollReveal>
            <div className={styles.header}>
              <span className="caption">The Archive</span>
              <h1 className={`h1 ${styles.title}`}>Inside the Sphere</h1>
              <p className={styles.intro}>
                Production notes. Colour studies. Cultural observations. 
                Fragments from the process of making things that feel right.
              </p>
            </div>
          </ScrollReveal>

          <div className={styles.grid}>
            {archiveEntries.map((entry, i) => (
              <ScrollReveal key={entry.id} delay={i * 80}>
                <article className={styles.card}>
                  <div className={styles.cardImage}>
                    <Image
                      src={entry.image}
                      alt={entry.title}
                      width={600}
                      height={400}
                      className={styles.cardImg}
                    />
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardType}>{typeLabels[entry.type] || entry.type}</span>
                      <span className={styles.cardDate}>
                        {new Date(entry.date).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    <h2 className={styles.cardTitle}>{entry.title}</h2>
                    <p className={styles.cardExcerpt}>{entry.excerpt}</p>
                    <div className={styles.tags}>
                      {entry.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className={styles.footer}>
              <p className={styles.footerText}>
                The archive grows with each drop. Check back.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </>
  );
}
