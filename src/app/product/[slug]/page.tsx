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
import { resolveProductImages } from '@/lib/image-resolver';
import { Metadata } from 'next';
import { constructMetadata } from '@/lib/seo-metadata';
import JsonLd from '@/components/JsonLd';
import { getProductSchema, getBreadcrumbSchema } from '@/lib/json-ld';
import styles from './page.module.css';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) {
    return constructMetadata({
      title: 'Piece Not Found',
      description: 'The requested statement piece could not be located in the GODSMOVE archive.',
      path: `/product/${slug}`,
      noIndex: true,
    });
  }

  const images = resolveProductImages(product);
  const primaryImage = images.frontImage || images.backImage || null;

  return constructMetadata({
    title: `${product.seoTitle || product.name} | GODSMOVE`,
    description:
      product.seoDescription ||
      product.shortDesc ||
      product.tagline ||
      (product.description ? product.description.substring(0, 160) : `Shop ${product.name} from GODSMOVE. Architectural silhouettes engineered with heavy cotton and drop-shoulder cut.`),
    path: `/product/${product.slug}`,
    image: primaryImage,
    keywords: [
      product.name,
      product.category?.name || 'Streetwear',
      product.collectionName || 'Archival Piece',
      'GODSMOVE apparel',
      'oversized t-shirt',
      'drop shoulder tee',
    ],
  });
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

  const { frontImage } = resolveProductImages(product);
  const coverImage = frontImage;
  const breadcrumb = getProductBreadcrumb(product);

  const productJsonLd = getProductSchema(product, coverImage);
  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: breadcrumb.label, url: breadcrumb.href },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  let profile: any = null;
  try {
    profile = await getMyProfile();
  } catch (e) {
    // Guest
  }

  if (product.isExclusiveRack || product.channel === 'EXCLUSIVE_RACK') {
    return (
      <div style={{ backgroundColor: '#050505', color: '#ffffff', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
        <JsonLd schema={[productJsonLd, breadcrumbJsonLd]} />
        <Navbar variant="exclusive-rack" />
        <CartDrawer />
        <ProductClient
          product={product}
          availableSizes={availableSizes}
          coverImage={coverImage}
          profile={profile}
        />
        <Footer />
      </div>
    );
  }

  return (
    <>
      <JsonLd schema={[productJsonLd, breadcrumbJsonLd]} />
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
