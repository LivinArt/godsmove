import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import ExclusiveRack from '@/components/ExclusiveRack';
import { getStorefrontProducts, getActiveDrop } from '@/actions/storefront.actions';
import styles from './page.module.css';

export default async function Home() {
  const [featured, exclusiveUnlockProducts, exclusiveRackProducts, activeDrop] = await Promise.all([
    getStorefrontProducts({ channel: 'DROP', isFeatured: true, take: 8 }),
    getStorefrontProducts({ channel: 'EXCLUSIVE_UNLOCK', take: 4 }),
    getStorefrontProducts({ channel: 'EXCLUSIVE_RACK', take: 5 }),
    getActiveDrop()
  ]);
  
  const drop001 = activeDrop || {
    name: 'Permanent Collection',
    tagline: 'Always available.',
    description: 'The foundation of the GODSMOVE wardrobe.',
    heroImageUrl: '/images/hero/hero-main.png',
    slug: 'permanent'
  };

  const limitedPieces = featured.filter(p => {
    const stock = p.variants.reduce((acc, v) => {
      const inv = v.inventory;
      if (!inv) return acc;
      return acc + (inv.totalStock - inv.reservedStock - inv.soldStock);
    }, 0);
    return stock <= 10 && stock > 0;
  }).slice(0, 4);

  const displayLimited = limitedPieces.length > 0 ? limitedPieces : featured.slice(0, 4);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main>
        {/* ── CINEMATIC HERO ── */}
        <section className={styles.hero} id="hero">
          <div className={styles.heroImageWrap}>
            <Image
              src="/images/hero/hero-main.png"
              alt="GODSMOVE Campaign"
              fill
              className={styles.heroImage}
              priority
              sizes="100vw"
            />
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className="caption">SS26 / {drop001.name}</span>
            </div>
            <h1 className={styles.heroTitle}>
              Doomed<br />to <span className={styles.heroTitleAccent}>Drip.</span>
            </h1>
            <p className={styles.heroSub}>
              No Coincidence.
            </p>
            <p className={styles.heroDesc}>
              Every piece is deliberate. Limited in quantity. Heavy in meaning.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/drops" className={`btn btn-primary ${styles.heroCta}`} id="hero-cta">
                Explore the Drop
              </Link>
              <Link href="/our-story" className={`btn btn-secondary ${styles.heroCtaSecondary}`} id="hero-cta-secondary">
                Our Story
              </Link>
            </div>
          </div>

          <div className={styles.heroScroll}>
            <ArrowDown size={16} />
            <span>Scroll</span>
          </div>
        </section>

        {/* ── EXCLUSIVE UNLOCK ── */}
        {exclusiveUnlockProducts.length > 0 && (
          <section className={styles.products} id="exclusive-unlock" style={{ backgroundColor: 'var(--black)' }}>
            <div className="container">
              <ScrollReveal>
                <div className={styles.productsHeader}>
                  <span className="caption" style={{ color: 'var(--admin-warning)' }}>Classified</span>
                  <h2 className="h2">Exclusive Unlock</h2>
                  <p className={styles.limitedDesc} style={{ color: 'var(--muted)', marginTop: '8px' }}>
                    Gated artifacts. Strictly limited to one per custodian.
                  </p>
                </div>
              </ScrollReveal>
              <div className={styles.productsGrid}>
                {exclusiveUnlockProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── EXCLUSIVE RACK ── */}
        <ExclusiveRack products={exclusiveRackProducts} />

        {/* ── STAR PIECES ── */}
        <section className={styles.products} id="products">
          <div className="container">
            <ScrollReveal>
              <div className={styles.productsHeader}>
                <span className="caption">Featured Drop</span>
                <h2 className="h2">Star Pieces</h2>
              </div>
            </ScrollReveal>
            <div className={styles.productsGrid}>
              {featured.slice(0, 4).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
            <ScrollReveal delay={200}>
              <div className={styles.productsCta}>
                <Link href="/drops" className="btn btn-secondary" id="products-cta">
                  View All Pieces
                  <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── EXPLORE OUR RANGES ── */}
        {displayLimited.length > 0 && (
          <section className={styles.limited} id="limited">
            <div className="container">
              <ScrollReveal>
                <div className={styles.limitedHeader}>
                  <h2 className="h2">Explore Our Ranges</h2>
                  <p className={styles.limitedDesc}>Discover the worlds we are building.</p>
                </div>
              </ScrollReveal>
              <div className={styles.productsGrid}>
                {displayLimited.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── OUR STORY PREVIEW ── */}
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
              <span className="caption" style={{ color: 'var(--fog)' }}>Philosophy</span>
              <h2 className={styles.editorialQuote}>
                Nothing is accidental. Every design carries meaning.
              </h2>
              <Link href="/our-story" className={`btn btn-secondary ${styles.editorialCta}`}>
                Read Our Story
              </Link>
            </ScrollReveal>
          </div>
        </section>

        {/* ── NEWSLETTER ── */}
        <section className={styles.newsletter} id="newsletter">
          <div className="container">
            <ScrollReveal>
              <div className={styles.nlInner}>
                <h2 className="h2">Get Early Access.</h2>
                <p className={styles.nlDesc}>
                  Be first when the next move drops.
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
                    Join the Inner Circle
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
