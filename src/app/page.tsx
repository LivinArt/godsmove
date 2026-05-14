
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import { getStorefrontProducts, getActiveDrop } from '@/actions/storefront.actions';
import styles from './page.module.css';

export default async function Home() {
  const [featured, activeDrop] = await Promise.all([
    getStorefrontProducts({ isFeatured: true, take: 4 }),
    getActiveDrop()
  ]);
  
  const drop001 = activeDrop || {
    name: 'Permanent Collection',
    tagline: 'Always available.',
    description: 'The foundation of the GODSMOVE wardrobe.',
    heroImageUrl: '/images/hero/hero-main.png',
    slug: 'permanent'
  };

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main>
        {/* ── HERO ── */}
        <section className={styles.hero} id="hero">
          <div className={styles.heroImageWrap}>
            <Image
              src="/images/hero/hero-main.png"
              alt="GODSMOVE SS26 Campaign"
              fill
              className={styles.heroImage}
              priority
              sizes="100vw"
            />
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className="caption">SS26 / Drop 001</span>
            </div>
            <h1 className={styles.heroTitle}>
              GODS<span className={styles.heroTitleAccent}>MOVE</span>
            </h1>
            <p className={styles.heroSub}>
              Doomed to Drip.
            </p>
            <Link href="/shop" className={`btn btn-secondary ${styles.heroCta}`} id="hero-cta">
              Shop Drop 001
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.heroScroll}>
            <ArrowDown size={16} />
            <span>Scroll</span>
          </div>
        </section>

        {/* ── DROP INTRO ── */}
        <section className={styles.dropIntro} id="drop-intro">
          <div className="container">
            <ScrollReveal>
              <div className={styles.dropIntroInner}>
                <div className={styles.dropIntroText}>
                  <span className="caption">{drop001.name}</span>
                  <h2 className={`h1 ${styles.dropTitle}`}>{drop001.tagline}</h2>
                  <p className={styles.dropDesc}>{drop001.description}</p>
                  <Link href="/shop?collection=drop-001" className="btn-ghost" id="drop-cta">
                    View Full Drop
                  </Link>
                </div>
                <div className={styles.dropIntroImage}>
                  <Image
                    src={drop001.heroImageUrl || '/images/hero/hero-main.png'}
                    alt={drop001.name}
                    width={640}
                    height={800}
                    className={styles.dropImg}
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── FEATURED PRODUCTS ── */}
        <section className={styles.products} id="products">
          <div className="container">
            <ScrollReveal>
              <div className={styles.productsHeader}>
                <span className="caption">The Collection</span>
                <h2 className="h2">Selected Pieces</h2>
              </div>
            </ScrollReveal>
            <div className={styles.productsGrid}>
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
            <ScrollReveal delay={200}>
              <div className={styles.productsCta}>
                <Link href="/shop" className="btn btn-secondary" id="products-cta">
                  View All
                  <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── EDITORIAL BREAK ── */}
        <section className={styles.editorial} id="editorial">
          <div className={styles.editorialImageWrap}>
            <Image
              src="/images/campaign/editorial-02.png"
              alt="GODSMOVE Editorial"
              fill
              className={styles.editorialImage}
              sizes="100vw"
            />
            <div className={styles.editorialOverlay} />
          </div>
          <div className={styles.editorialContent}>
            <ScrollReveal>
              <span className="caption" style={{ color: 'var(--fog)' }}>Observation</span>
              <h2 className={styles.editorialQuote}>
                Comfort looks different when you stop performing it.
              </h2>
            </ScrollReveal>
          </div>
        </section>

        {/* ── BRAND WORLD / TEXTURE ── */}
        <section className={styles.world} id="world">
          <div className="container">
            <div className={styles.worldGrid}>
              <ScrollReveal className={styles.worldTextBlock}>
                <span className="caption">Material</span>
                <h3 className="h3">300 GSM. Heavyweight.</h3>
                <p className={styles.worldBody}>
                  Every piece starts at 300 grams per square meter. Dense cotton that holds its shape 
                  after fifty washes. The kind of weight you notice when you pick it up.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={100} className={styles.worldImageBlock}>
                <Image
                  src="/images/textures/fabric-texture.png"
                  alt="Fabric texture closeup"
                  width={600}
                  height={400}
                  className={styles.worldImg}
                />
              </ScrollReveal>
              <ScrollReveal delay={200} className={styles.worldTextBlock2}>
                <span className="caption">Fit</span>
                <h3 className="h3">Drop Shoulder. Oversized.</h3>
                <p className={styles.worldBody}>
                  Cut to sit below the natural shoulder line. Relaxed through the body. 
                  Room to move. Designed to look better the longer you wear it.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── ARCHIVE TEASER ── */}
        <section className={styles.archiveTeaser} id="archive-teaser">
          <div className="container">
            <ScrollReveal>
              <div className={styles.archiveInner}>
                <div className={styles.archiveText}>
                  <span className="caption">The Archive</span>
                  <h2 className="h2">Process. Culture. Observation.</h2>
                  <p className={styles.archiveDesc}>
                    Dispatches from inside the move. Production diaries, 
                    colour studies, and deliberate observations.
                  </p>
                  <Link href="/archive" className="btn-ghost" id="archive-cta">
                    Enter the Archive
                  </Link>
                </div>
                <div className={styles.archiveCards}>
                  <div className={styles.archiveCard}>
                    <Image
                      src="/images/textures/fabric-texture.png"
                      alt="Fabric study"
                      width={300}
                      height={200}
                      style={{ objectFit: 'cover', width: '100%', height: '160px' }}
                    />
                    <span className={`caption ${styles.archiveCardType}`}>Editorial</span>
                    <h4 className={styles.archiveCardTitle}>The Weight of a T-Shirt</h4>
                  </div>
                  <div className={styles.archiveCard}>
                    <Image
                      src="/images/campaign/editorial-01.png"
                      alt="Scroll fatigue"
                      width={300}
                      height={200}
                      style={{ objectFit: 'cover', width: '100%', height: '160px' }}
                    />
                    <span className={`caption ${styles.archiveCardType}`}>Observation</span>
                    <h4 className={styles.archiveCardTitle}>Scroll Fatigue</h4>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── NEWSLETTER ── */}
        <section className={styles.newsletter} id="newsletter">
          <div className="container">
            <ScrollReveal>
              <div className={styles.nlInner}>
                <h2 className="h2">Stay inside.</h2>
                <p className={styles.nlDesc}>
                  Drop alerts, archive updates, and nothing you didn't ask for.
                </p>
                <form className={styles.nlForm} action="/api/newsletter" method="POST">
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    className={styles.nlInput}
                    id="newsletter-email"
                    aria-label="Email for newsletter"
                  />
                  <button type="submit" className="btn btn-primary" id="newsletter-submit">
                    Subscribe
                  </button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
