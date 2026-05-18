import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import { getStorefrontProductBySlug, getStorefrontProducts } from '@/actions/storefront.actions';
import { getActiveDraw, getProductUnlockStatus } from '@/actions/exclusive.actions';
import { createClient } from '@/lib/supabase/server';
import ProductClient from './ProductClient';
import styles from './page.module.css';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) return { title: 'Product Not Found — GODSMOVE' };
  
  return {
    title: `${product.seoTitle || product.name} — GODSMOVE`,
    description: product.seoDescription || product.shortDesc || product.description.substring(0, 160),
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products (same category or drop)
  const relatedProducts = await getStorefrontProducts({ 
    dropId: product.dropId || undefined,
    take: 5 
  }).then(res => res.filter(p => p.id !== product.id).slice(0, 4));

  // Extract available sizes from variants & inventory
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONE_SIZE'];
  const variants = product.variants || [];
  
  const availableSizes = allSizes.map(sizeLabel => {
    const variant = variants.find(v => v.size === sizeLabel);
    if (!variant) return null;
    
    // Check stock: total - reserved - sold > 0
    const inv = variant.inventory;
    const isAvailable = inv ? (inv.totalStock - inv.reservedStock - inv.soldStock) > 0 : false;
    
    return {
      label: sizeLabel,
      available: isAvailable
    };
  }).filter(Boolean) as { label: string, available: boolean }[];

  const isExclusiveUnlock = product.channel === 'EXCLUSIVE_UNLOCK';
  let access = { unlocked: true, reservation: null as any };
  let draw = null;

  let isLoggedIn = false;
  if (isExclusiveUnlock) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
    access = user
      ? await getProductUnlockStatus(product.id)
      : { unlocked: false, reservation: null };
    draw = await getActiveDraw(product.id);
  }

  const coverImage = product.images?.[0]?.url ?? product.frontImageUrl ?? null;

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/drops">Drops</Link>
            <span>/</span>
            <span>{product.name}</span>
          </nav>

          <ProductClient
            product={product}
            availableSizes={availableSizes}
            exclusiveAccess={isExclusiveUnlock ? access : undefined}
            exclusiveDraw={isExclusiveUnlock ? (draw as { id: string; endsAt: string; status: string } | null) : undefined}
            coverImage={coverImage}
            isLoggedIn={isLoggedIn}
          />

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className={styles.related}>
              <ScrollReveal>
                <h2 className={styles.relatedTitle}>From the same collection</h2>
              </ScrollReveal>
              <div className={styles.relatedGrid}>
                {relatedProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
