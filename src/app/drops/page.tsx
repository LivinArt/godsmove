import { Metadata } from 'next';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { getStorefrontProducts, getStorefrontDrops, getStorefrontCategories } from '@/actions/storefront.actions';
import { constructMetadata } from '@/lib/seo-metadata';
import ShopClient from './ShopClient';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = constructMetadata({
  title: 'New Collection & Latest Releases | GODSMOVE',
  description: 'Discover the latest GODSMOVE clothing collection featuring new T-shirts, oversized tees, hoodies, and jackets available online in India.',
  path: '/drops',
  keywords: ['new clothing collection India', 'latest clothing drops', 'premium t shirts for men', 'hoodies online India', 'GODSMOVE shop'],
});

export default async function ShopPage() {
  const [products, drops, categories] = await Promise.all([
    getStorefrontProducts({ isExclusiveRack: false }),
    getStorefrontDrops(),
    getStorefrontCategories(),
  ]);

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        <div className="container">
          <Suspense fallback={<div className={styles.empty}><p>Loading pieces...</p></div>}>
            <ShopClient 
              initialProducts={products} 
              drops={drops}
              categories={categories}
            />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
