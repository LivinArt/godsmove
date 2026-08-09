import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollReveal from '@/components/ScrollReveal';
import { constructMetadata } from '@/lib/seo-metadata';
import styles from './our-story.module.css';

export const metadata: Metadata = constructMetadata({
  title: 'Our Story — WEAR THE CRAFT. HONOUR THE HANDS. — GODSMOVE',
  description: 'Luxury begins long before a garment reaches the body. Explore the philosophy of GODSMOVE: honoring the tailors, craftsmen, and human hands behind every garment.',
  path: '/our-story',
  keywords: ['GODSMOVE story', 'wear the craft', 'honour the hands', 'atelier philosophy', 'craftsmanship fashion'],
});

export default async function OurStoryPage() {
  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.storyPage}>
        {/* ── 1. HERO SPREAD ── */}
        <section className={styles.heroSpread}>
          <div className={styles.heroMediaWrap}>
            <Image
              src="/images/campaign/editorial-01.png"
              alt="GODSMOVE Atelier Craftsmanship"
              fill
              priority
              className={styles.heroImage}
              sizes="100vw"
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <ScrollReveal>
              <span className={styles.volumeTag}>ATELIER JOURNAL · VOLUME I</span>
              <h1 className={styles.brandTitle}>GODSMOVE</h1>
              <p className={styles.heroManifesto}>
                WEAR THE CRAFT.<br />HONOUR THE HANDS.
              </p>
              <p className={styles.heroSubText}>
                Luxury begins long before a garment reaches the body.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── 2. OUR BELIEF ── */}
        <section className={styles.beliefSection}>
          <div className="container">
            <ScrollReveal>
              <div className={styles.beliefContent}>
                <span className={styles.sectionEyebrow}>OUR BELIEF</span>
                <h2 className={styles.statementTitle}>
                  "We believe clothing should feel extraordinary not because it demands attention, but because every detail deserves it."
                </h2>
                <p className={styles.statementLead}>
                  GODSMOVE was established on a single principle: true luxury is quiet, deliberate, and deeply human. We reject mass retail and fast-turnaround trends in favor of architectural silhouettes, custom textiles, and uncompromising construction.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── 3. THE HANDS BEHIND THE GARMENT ── */}
        <section className={styles.handsSection}>
          <div className="container">
            <div className={styles.handsGrid}>
              <ScrollReveal className={styles.handsTextCol}>
                <span className={styles.sectionEyebrow}>THE HUMAN ELEMENT</span>
                <h2 className={styles.sectionHeading}>The Hands Behind The Garment.</h2>
                <p className={styles.bodyParagraph}>
                  Behind every piece of fabric is a journey. Before a jacket drapes across a shoulder or a heavy cotton tee holds form against the wind, countess human hands have shaped its existence.
                </p>
                <p className={styles.bodyParagraph}>
                  The tailors. The master pattern makers. The textile weavers. The seamstress who inspects every double-needle row. The craftsmen who preserve centuries of garment construction. These hands transform raw woven thread into a physical statement of intent.
                </p>
                <div className={styles.quoteCard}>
                  <p className={styles.quoteText}>
                    "Those hands are what bring fashion to your body. We wear their intent."
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={150} className={styles.handsMediaCol}>
                <div className={styles.photoFrame}>
                  <Image
                    src="/images/campaign/editorial-02.png"
                    alt="Tailor hands shaping fabric"
                    width={700}
                    height={900}
                    className={styles.photo}
                  />
                  <div className={styles.captionBar}>
                    <span>FIGURE 1.1 — ATELIER CONSTRUCTION</span>
                    <span>CRAFT MANIFESTO</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── 4. THE CRAFT (Unified ScrollReveal Section Container — Prevents Scroll Fighting) ── */}
        <section className={styles.craftSection}>
          <div className="container">
            <ScrollReveal>
              <div className={styles.craftHeader}>
                <span className={styles.sectionEyebrow}>ARCHITECTURAL FOUNDATION</span>
                <h2 className={styles.sectionHeading}>Obsessed With Detail.</h2>
              </div>

              <div className={styles.craftTripleGrid}>
                <div className={styles.craftCard}>
                  <span className={styles.cardNum}>01</span>
                  <h3>TEXTILE DENSITY</h3>
                  <p>
                    We engineer custom-milled organic cottons starting from 300+ GSM. Fabrics formulated for density, weight, and a precise drape that resists body cling.
                  </p>
                </div>

                <div className={styles.craftCard}>
                  <span className={styles.cardNum}>02</span>
                  <h3>PATTERN PRECISION</h3>
                  <p>
                    Drop-shoulder proportions, calculated collar tensions, and reinforced seam architectures cut down to the tenth of a millimeter for posture and permanence.
                  </p>
                </div>

                <div className={styles.craftCard}>
                  <span className={styles.cardNum}>03</span>
                  <h3>HONEST FINISHING</h3>
                  <p>
                    Internal bias taping, blind stitching, and subtle hand-applied hardware. Every seam is finished cleanly inside and out.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── 5. THE EXPERIENCE & BRAND OF PEOPLE ── */}
        <section className={styles.manifestoDarkSection}>
          <div className="container">
            <ScrollReveal>
              <div className={styles.manifestoInner}>
                <span className={styles.manifestoTag}>A BRAND OF PEOPLE, FOR PEOPLE</span>
                <h2 className={styles.manifestoHeading}>
                  "GODSMOVE is not simply selling apparel.<br />We are creating an experience around what people wear."
                </h2>
                <p className={styles.manifestoDesc}>
                  When you slip on a GODSMOVE piece, you step into a feeling of effortless refinement. Not loud. Not flashy. Confident. Restrained. Distinctive. You feel extraordinarily well dressed because you carry the weight of thousands of deliberate decisions.
                </p>
                <div className={styles.ctaGroup}>
                  <Link href="/drops" className={styles.primaryCta}>
                    EXPLORE THE DROPS →
                  </Link>
                  <Link href="/exclusive-rack" className={styles.secondaryCta}>
                    ENTER THE VAULT →
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
