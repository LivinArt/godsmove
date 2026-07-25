import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollReveal from '@/components/ScrollReveal';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/actions/product.actions';
import { constructMetadata } from '@/lib/seo-metadata';
import styles from './our-story.module.css';

export const metadata: Metadata = constructMetadata({
  title: 'Our Story — GODSMOVE Atelier Archive',
  description: 'No Coincidence. Every design carries meaning. Clothing is a statement of intent. Explore the origin and manifesto of GODSMOVE.',
  path: '/our-story',
  keywords: ['GODSMOVE story', 'atelier archive', 'fashion manifesto', 'luxury streetwear origin'],
});

export default async function OurStoryPage() {
  const exploreProducts = await getProducts({ status: 'ACTIVE', take: 6 }).catch(() => []);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.coffeeTableBookPage}>
        {/* ── COVER SPREAD: FULL-WIDTH LUXURY HERO ── */}
        <section className={styles.coverHero}>
          <div className={styles.coverImageWrap}>
            <Image
              src="/images/campaign/editorial-01.png"
              alt="GODSMOVE Atelier Campaign"
              fill
              className={styles.coverImage}
              priority
              sizes="100vw"
            />
            <div className={styles.coverGradientOverlay} />
          </div>
          <div className={styles.coverHeroContent}>
            <ScrollReveal>
              <span className={styles.volumeBadge}>VOLUME I · ARCHIVAL MANIFESTO</span>
              <h1 className={styles.coverTitle}>NO COINCIDENCE.</h1>
              <p className={styles.coverSubtitle}>
                Every design carries meaning. Clothing is a statement.
              </p>
              <div className={styles.goldLineDivider} />
            </ScrollReveal>
          </div>
        </section>

        {/* ── CHAPTER 01: ORIGIN SPREAD (ALTERNATING EDITORIAL LAYOUT) ── */}
        <section className={styles.chapterSection}>
          <div className={styles.chapterContainer}>
            <div className={styles.editorialSpreadRow}>
              <ScrollReveal className={styles.editorialTextCol}>
                <div className={styles.chapterHeader}>
                  <span className={styles.chapterTag}>CHAPTER 01</span>
                  <h2 className={styles.editorialHeading}>The First Move.</h2>
                </div>
                <p className={styles.leadParagraph}>
                  GODSMOVE wasn't born out of a desire to add more noise to an already crowded space. 
                  It was born from the exact opposite—a need for silence.
                </p>
                <p className={styles.editorialBodyText}>
                  We watched as streetwear became diluted, mass-produced, and stripped of its original rebellion. 
                  We decided to move differently. To treat garments not as fast-moving consumer goods, 
                  but as deliberate statements of intent. Every drop is an observation, translated into 
                  heavyweight cotton.
                </p>
                <div className={styles.quoteCardInline}>
                  <p className={styles.quoteTextInline}>
                    "We choose restraint over volume. Purpose over trends."
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200} className={styles.editorialMediaCol}>
                <div className={styles.editorialPhotoFrame}>
                  <Image
                    src="/images/campaign/editorial-02.png"
                    alt="GODSMOVE Origin Photography"
                    width={800}
                    height={1000}
                    className={styles.magazinePhoto}
                  />
                  <div className={styles.photoCaptionBar}>
                    <span>FIGURE 1.1 — ATELIER OBSERVATION</span>
                    <span className="mono">2026 ARCHIVE</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── CHAPTER 02: PHILOSOPHY IMMERSIVE DARK BANNER ── */}
        <section className={styles.philosophyDarkBanner}>
          <div className={styles.bannerContainer}>
            <ScrollReveal>
              <div className={styles.philosophyCenterContent}>
                <span className={styles.philosophyTag}>CORE PHILOSOPHY</span>
                <h2 className={styles.philosophyMainTitle}>
                  "Nothing is accidental."
                </h2>
                <p className={styles.philosophyDesc}>
                  Our philosophy is simple: if it doesn't need to exist, we don't make it. 
                  We believe in scarcity not as a marketing tactic, but as a commitment to 
                  quality control and intentional consumption. When you wear a piece from our 
                  drops, you carry the weight of that intention.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── CHAPTER 03: CRAFTSMANSHIP & MATERIAL ENGINEERING ── */}
        <section className={styles.chapterSection}>
          <div className={styles.chapterContainer}>
            <div className={`${styles.editorialSpreadRow} ${styles.rowReverse}`}>
              <ScrollReveal className={styles.editorialTextCol}>
                <div className={styles.chapterHeader}>
                  <span className={styles.chapterTag}>CHAPTER 02</span>
                  <h2 className={styles.editorialHeading}>Engineered Weight.</h2>
                </div>
                <p className={styles.leadParagraph}>
                  The silhouette is our foundation. We start with custom-milled heavyweight 
                  fabrics—never below 300 GSM for tees, and significantly heavier for outerwear.
                </p>
                <p className={styles.editorialBodyText}>
                  This density gives the garments structure, allowing them to drape precisely 
                  as intended, falling away from the body rather than clinging to it. The drop-shoulder cuts are calculated down to the millimeter to ensure they feel relaxed but never careless.
                </p>
                <div className={styles.specTripleGrid}>
                  <div className={styles.miniSpecBlock}>
                    <span className={styles.specNum}>300+</span>
                    <span className={styles.specName}>MINIMUM GSM</span>
                  </div>
                  <div className={styles.specTripleGridDivider} />
                  <div className={styles.miniSpecBlock}>
                    <span className={styles.specNum}>100%</span>
                    <span className={styles.specName}>ORGANIC COTTON</span>
                  </div>
                  <div className={styles.specTripleGridDivider} />
                  <div className={styles.miniSpecBlock}>
                    <span className={styles.specNum}>0.1mm</span>
                    <span className={styles.specName}>CUT PRECISION</span>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200} className={styles.editorialMediaCol}>
                <div className={styles.editorialPhotoFrame}>
                  <Image
                    src="/images/textures/fabric-texture.png"
                    alt="Fabric Texture & Weave"
                    width={800}
                    height={800}
                    className={styles.magazinePhotoSquare}
                  />
                  <div className={styles.photoCaptionBar}>
                    <span>FIGURE 2.1 — HEAVYWEIGHT TEXTILE WEAVE</span>
                    <span className="mono">SPECIFICATION 400GSM</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── CHAPTER 04: MANIFESTO & BRAND IDENTITY ── */}
        <section className={styles.manifestoDarkSection}>
          <div className={styles.chapterContainer}>
            <ScrollReveal>
              <div className={styles.manifestoCard}>
                <span className={styles.manifestoEyebrow}>CHAPTER 03 · THE MANIFESTO</span>
                <h2 className={styles.manifestoHeading}>Worn With Intent.</h2>
                <div className={styles.manifestoParagraphs}>
                  <p>
                    We are building a uniform for those who move with purpose. 
                    The decisive creators, the silent observers, the ones who execute 
                    at the highest level.
                  </p>
                  <p>
                    This is not just a brand. This is a deliberate aesthetic movement.
                  </p>
                </div>
                <div className={styles.manifestoSignatureBlock}>
                  <span className={styles.goldLineShort} />
                  <p className={styles.manifestoSignatureText}>— The Inner Circle</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── BOTTOM SECTION: EXPLORE ALL DROPS (1 x 6 PRODUCT GRID) ── */}
        <section className={styles.exploreDropsSection}>
          <div className={styles.chapterContainer}>
            <ScrollReveal>
              <div className={styles.exploreHeader}>
                <span className={styles.exploreEyebrow}>ARCHIVAL CATALOGUE</span>
                <h2 className={styles.exploreTitle}>EXPLORE ALL DROPS</h2>
                <p className={styles.exploreSubtitle}>
                  Discover current allocations and formulated drop selections.
                </p>
              </div>

              <div className={styles.exploreGrid6}>
                {exploreProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} theme="dark" />
                ))}
              </div>

              <div className={styles.exploreCtaRow}>
                <Link href="/drops" className={styles.exploreAllBtn}>
                  VIEW COMPLETE CATALOGUE →
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
