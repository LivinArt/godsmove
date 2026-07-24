import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import { getStorefrontProducts } from '@/actions/storefront.actions';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Exclusive Locked Drops — GODSMOVE',
  description: 'Invitation-only gated artifacts. Access is earned, not given.',
};

export default async function ExclusiveUnlockPage() {
  const products = await getStorefrontProducts({ channel: 'EXCLUSIVE_UNLOCK' });

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        <div className="container">
          <ScrollReveal>
            <header className={styles.hero}>
              <span className={styles.eyebrow}>Classified Access</span>
              <h1 className={styles.title}>Exclusive Locked Drops</h1>
              <p className={styles.lead}>
                Gated artifacts with reservation protocols and draw mechanics. One custodian
                per piece. Not listed in the public shop.
              </p>
              <nav className={styles.accessNav} aria-label="Access destinations">
                <Link href="/exclusive-unlock" className={styles.accessNavActive}>
                  Locked Drops
                </Link>
                <Link href="/exclusive-rack" className={styles.accessNavLink}>
                  Exclusive Rack
                </Link>
              </nav>
            </header>
          </ScrollReveal>

          {products.length > 0 ? (
            <div className={styles.grid}>
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  theme="dark"
                  showCta
                />
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No locked drops are active at this time.</p>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
