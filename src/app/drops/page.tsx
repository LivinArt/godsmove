import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { getStorefrontProducts, getStorefrontDrops, getStorefrontCategories } from '@/actions/storefront.actions';
import ShopClient from './ShopClient';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shop — GODSMOVE',
};

export default async function ShopPage() {
  const [products, drops, categories] = await Promise.all([
    getStorefrontProducts(),
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
