import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ProductCard from '@/components/ProductCard';
import ScrollReveal from '@/components/ScrollReveal';
import { getStorefrontProductBySlug, getStorefrontProducts } from '@/actions/storefront.actions';
import { getActiveDraw, getProductUnlockStatus } from '@/actions/exclusive.actions';
import { getMyProfile } from '@/actions/profile.actions';
import { createClient } from '@/lib/supabase/server';
import ProductClient from './ProductClient';
import { getProductBreadcrumb } from '@/lib/product-channel-label';
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

  // Fetch related products (with dynamic priority: Same Collection -> Same Drop -> Same Category -> Featured -> Newest)
  const candidates = await getStorefrontProducts({ take: 50 }).then((res) =>
    res.filter((p) => p.id !== product.id)
  );

  const rankedRelated = candidates
    .map((p) => {
      let score = 0;
      if (product.collectionName && p.collectionName === product.collectionName) {
        score += 10000;
      }
      if (product.dropId && p.dropId === product.dropId) {
        score += 1000;
      }
      if (product.categoryId && p.categoryId === product.categoryId) {
        score += 100;
      }
      if (p.isFeatured) {
        score += 10;
      }
      return { product: p, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const timeA = new Date(a.product.publishedAt || a.product.createdAt).getTime();
      const timeB = new Date(b.product.publishedAt || b.product.createdAt).getTime();
      return timeB - timeA;
    })
    .map((item) => item.product)
    .slice(0, 4);

  let relatedTitle = 'Allocated For You';
  if (rankedRelated.length > 0) {
    const top = rankedRelated[0];
    if (product.collectionName && top.collectionName === product.collectionName) {
      relatedTitle = 'More From This Collection';
    } else if (product.dropId && top.dropId === product.dropId) {
      relatedTitle = 'From The Same Drop';
    } else if (product.categoryId && top.categoryId === product.categoryId) {
      relatedTitle = 'Allocated For You';
    } else {
      relatedTitle = 'Recommended Pieces';
    }
  }

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
  const breadcrumb = getProductBreadcrumb(product);

  let profile: any = null;
  try {
    profile = await getMyProfile();
  } catch (e) {
    // Guest
  }

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main className={styles.page}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
            <span>/</span>
            <span>{product.name}</span>
          </nav>

          <ProductClient
            product={product}
            availableSizes={availableSizes}
            coverImage={coverImage}
            profile={profile}
          />

          {/* Related Products */}
          {rankedRelated.length > 0 && (
            <section className={styles.related}>
              <ScrollReveal>
                <h2 className={styles.relatedTitle}>{relatedTitle}</h2>
              </ScrollReveal>
              <div className={styles.grid}>
                {rankedRelated.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    index={i}
                    theme={product.channel !== 'DROP' ? 'dark' : 'default'}
                  />
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
