import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ScrollReveal from '@/components/ScrollReveal';
import styles from './our-story.module.css';

export const metadata = {
  title: 'Our Story | GODSMOVE',
  description: 'No Coincidence. Every design carries meaning. Clothing is a statement.',
};

export default function OurStoryPage() {
  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.main}>
        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroImageWrap}>
            <Image
              src="/images/campaign/editorial-01.png"
              alt="GODSMOVE Origin"
              fill
              className={styles.heroImage}
              priority
              sizes="100vw"
            />
            <div className={styles.heroOverlay} />
          </div>
          <div className={styles.heroContent}>
            <ScrollReveal>
              <h1 className={styles.heroTitle}>No Coincidence.</h1>
              <p className={styles.heroSubtitle}>
                Every design carries meaning. Clothing is a statement.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ── ORIGIN STORY ── */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.grid}>
              <ScrollReveal className={styles.textBlock}>
                <span className="caption">Origin</span>
                <h2 className="h2">The First Move.</h2>
                <p className={styles.bodyText}>
                  GODSMOVE wasn't born out of a desire to add more noise to an already crowded space. 
                  It was born from the exact opposite—a need for silence. We watched as streetwear 
                  became diluted, mass-produced, and stripped of its original rebellion.
                </p>
                <p className={styles.bodyText}>
                  We decided to move differently. To treat garments not as fast-moving consumer goods, 
                  but as deliberate statements of intent. Every drop is an observation, translated into 
                  heavyweight cotton.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={200} className={styles.imageBlock}>
                <Image
                  src="/images/campaign/editorial-02.png"
                  alt="Origin Story"
                  width={600}
                  height={800}
                  className={styles.gridImg}
                />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── PHILOSOPHY ── */}
        <section className={`${styles.section} ${styles.sectionDark}`}>
          <div className="container">
            <ScrollReveal>
              <div className={styles.centeredBlock}>
                <span className="caption" style={{ color: 'var(--fog)' }}>Philosophy</span>
                <h2 className={styles.quoteTitle}>
                  "Nothing is accidental."
                </h2>
                <p className={styles.centeredText}>
                  Our philosophy is simple: if it doesn't need to exist, we don't make it. 
                  We believe in scarcity not as a marketing tactic, but as a commitment to 
                  quality control and intentional consumption. When you wear a piece from our 
                  drops, you carry the weight of that intention.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── CRAFTSMANSHIP ── */}
        <section className={styles.section}>
          <div className="container">
            <div className={`${styles.grid} ${styles.gridReverse}`}>
              <ScrollReveal className={styles.textBlock}>
                <span className="caption">Craft</span>
                <h2 className="h2">Engineered Weight.</h2>
                <p className={styles.bodyText}>
                  The silhouette is our foundation. We start with custom-milled heavyweight 
                  fabrics—never below 300 GSM for tees, and significantly heavier for outerwear. 
                  This density gives the garments structure, allowing them to drape precisely 
                  as intended, falling away from the body rather than clinging to it.
                </p>
                <p className={styles.bodyText}>
                  The drop-shoulder cuts are calculated down to the millimeter to ensure they 
                  feel relaxed but never careless.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={200} className={styles.imageBlock}>
                <Image
                  src="/images/textures/fabric-texture.png"
                  alt="Fabric Texture"
                  width={600}
                  height={600}
                  className={styles.gridImgSq}
                />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── MISSION & MANIFESTO ── */}
        <section className={`${styles.section} ${styles.manifestoSection}`}>
          <div className="container">
            <ScrollReveal>
              <div className={styles.manifesto}>
                <h2 className="display">Doomed to Drip.</h2>
                <div className={styles.manifestoContent}>
                  <p className={styles.manifestoText}>
                    We are building a uniform for those who move with purpose. 
                    The decisive creators, the silent observers, the ones who execute 
                    at the highest level.
                  </p>
                  <p className={styles.manifestoText}>
                    This is not just a brand. This is a deliberate aesthetic movement.
                  </p>
                  <p className={styles.manifestoSignature}>
                    — The Inner Circle.
                  </p>
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
