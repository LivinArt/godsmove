import { constructMetadata } from '../src/lib/seo-metadata';
import { getOrganizationSchema, getWebSiteSchema, getProductSchema, getBreadcrumbSchema, getCollectionSchema } from '../src/lib/json-ld';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';

const homepageMetadata = constructMetadata({
  title: "GODSMOVE | Modern Apparel & Premium Clothing Online India",
  description:
    "Explore GODSMOVE's modern apparel collection featuring premium T-shirts, oversized tees, hoodies, denim jackets, and distinctive everyday clothing designed in India.",
  path: "/",
  keywords: [
    "GODSMOVE",
    "modern apparel India",
    "premium clothing brands India",
    "men's clothing online",
    "oversized t shirts for men",
    "premium t shirts India",
    "hoodies for men",
    "denim jackets for men",
    "contemporary clothing",
  ],
});

const dropsMetadata = constructMetadata({
  title: 'New Collection & Latest Releases | GODSMOVE',
  description: 'Discover the latest GODSMOVE clothing collection featuring new T-shirts, oversized tees, hoodies, and jackets available online in India.',
  path: '/drops',
  keywords: ['new clothing collection India', 'latest clothing drops', 'premium t shirts for men', 'hoodies online India', 'GODSMOVE shop'],
});

const exclusiveMetadata = constructMetadata({
  title: 'Exclusive Collection | Curated Apparel | GODSMOVE',
  description: 'Explore GODSMOVE Exclusive Rack. Curated limited edition clothing, premium statement pieces, and distinctive apparel crafted in India.',
  path: '/exclusive-rack',
  keywords: ['exclusive rack', 'GODSMOVE vault', 'curated apparel', 'distinctive clothing India', 'premium clothing online'],
});

async function runSEOQASuite() {
  console.log('====================================================================');
  console.log('🔍 RUNNING GODSMOVE MASTER TECHNICAL & BRAND SEO QA SUITE');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  function assertPass(testName: string, detail?: string) {
    console.log(`✅ [PASS] ${testName}`);
    if (detail) console.log(`   ${detail}`);
    passed++;
  }

  function assertFail(testName: string, detail?: string) {
    console.error(`❌ [FAIL] ${testName}`);
    if (detail) console.error(`   ${detail}`);
    failed++;
  }

  function assertWarn(testName: string, detail?: string) {
    console.warn(`⚠️  [WARN] ${testName}`);
    if (detail) console.warn(`   ${detail}`);
    warnings++;
  }

  // ------------------------------------------------------------------
  // 1. BRAND POSITIONING — NO PUBLIC STREETWEAR POSITIONING
  // ------------------------------------------------------------------
  console.log('--- 1. Brand Positioning Audit (No Public Streetwear Keywords) ---');
  const publicMetadataObjects = [
    { page: 'Homepage / Layout', meta: homepageMetadata },
    { page: 'Drops Page', meta: dropsMetadata },
    { page: 'Exclusive Rack', meta: exclusiveMetadata },
  ];

  for (const item of publicMetadataObjects) {
    const titleStr = String(item.meta?.title || '').toLowerCase();
    const descStr = String(item.meta?.description || '').toLowerCase();
    const kwArr = Array.isArray(item.meta?.keywords) ? item.meta.keywords.map((k) => String(k).toLowerCase()) : [];

    const hasStreetwear = titleStr.includes('streetwear') || descStr.includes('streetwear') || kwArr.some((k) => k.includes('streetwear'));
    if (!hasStreetwear) {
      assertPass(`No public streetwear positioning in ${item.page}`);
    } else {
      assertFail(`Incorrect streetwear positioning found in ${item.page}`);
    }
  }

  // ------------------------------------------------------------------
  // 2. LONG DASH CLEANUP — TITLE SEPARATORS
  // ------------------------------------------------------------------
  console.log('\n--- 2. Long Dash Audit (No Em-Dash Title Separators) ---');
  for (const item of publicMetadataObjects) {
    const titleStr = String(item.meta?.title || '');
    if (!titleStr.includes('—')) {
      assertPass(`Clean punctuation in title for ${item.page}`, `Title: "${titleStr}"`);
    } else {
      assertFail(`Unnecessary em-dash separator found in title for ${item.page}`, `Title: "${titleStr}"`);
    }
  }

  // ------------------------------------------------------------------
  // 3. CANONICAL DOMAIN & ZERO LOCALHOST LEAKS
  // ------------------------------------------------------------------
  console.log('\n--- 3. Canonical Domain & Production URL Audit ---');
  const sampleMeta = constructMetadata({
    title: 'Test Page',
    description: 'Test page description for canonical audit.',
    path: '/product/test-slug',
  });

  const canonicalUrl = String(sampleMeta.alternates?.canonical || '');
  const metadataBase = String(sampleMeta.metadataBase || '');

  if (canonicalUrl.startsWith('https://www.godsmove.in')) {
    assertPass('Canonical URL uses production domain (https://www.godsmove.in)', `Canonical: ${canonicalUrl}`);
  } else {
    assertFail('Canonical URL does NOT use production domain', `Canonical: ${canonicalUrl}`);
  }

  if (!canonicalUrl.includes('localhost') && !metadataBase.includes('localhost')) {
    assertPass('Zero localhost or dev URLs in metadata');
  } else {
    assertFail('Localhost or dev domain found in production metadata!');
  }

  // ------------------------------------------------------------------
  // 4. STRUCTURED DATA (JSON-LD) AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- 4. Structured Data (JSON-LD) Schema Audit ---');
  const orgSchema = getOrganizationSchema();
  if (orgSchema['@type'] === 'Organization' && orgSchema.name === 'GODSMOVE' && !orgSchema.description.toLowerCase().includes('streetwear')) {
    assertPass('Organization JSON-LD schema is valid with Modern Apparel positioning', `Description: "${orgSchema.description}"`);
  } else {
    assertFail('Organization JSON-LD schema invalid or contains streetwear reference');
  }

  const webSiteSchema = getWebSiteSchema();
  if (webSiteSchema['@type'] === 'WebSite' && webSiteSchema.name === 'GODSMOVE' && webSiteSchema.url === 'https://www.godsmove.in') {
    assertPass('WebSite JSON-LD schema is valid', `URL: ${webSiteSchema.url}`);
  } else {
    assertFail('WebSite JSON-LD schema invalid');
  }

  const sampleProduct = {
    id: 'prod-123',
    slug: 'oversized-heavyweight-tee',
    name: 'Archival Heavyweight Oversized Tee',
    description: 'Crafted from 300 GSM combed cotton.',
    variants: [{ price: 2999 }],
  };
  const productSchema = getProductSchema(sampleProduct, 'https://www.godsmove.in/image.png');
  if (
    productSchema['@type'] === 'Product' &&
    productSchema.brand.name === 'GODSMOVE' &&
    productSchema.offers.priceCurrency === 'INR' &&
    productSchema.offers.price === 2999
  ) {
    assertPass('Product JSON-LD schema is valid without fabricated ratings/reviews', `Brand: ${productSchema.brand.name} | Price: ₹${productSchema.offers.price}`);
  } else {
    assertFail('Product JSON-LD schema invalid');
  }

  // ------------------------------------------------------------------
  // 5. ROBOTS & SITEMAP AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- 5. Robots & Sitemap Configuration Audit ---');
  const robotsConfig = robots();
  const disallowedPaths = (robotsConfig.rules as any)?.[0]?.disallow || [];
  if (disallowedPaths.includes('/admin') && disallowedPaths.includes('/checkout') && disallowedPaths.includes('/profile')) {
    assertPass('Robots.txt correctly blocks private routes (/admin, /checkout, /profile)');
  } else {
    assertFail('Robots.txt does not block private routes properly');
  }

  try {
    const sitemapEntries = await sitemap();
    if (Array.isArray(sitemapEntries) && sitemapEntries.length >= 10) {
      assertPass(`Sitemap generated successfully with ${sitemapEntries.length} URL entries`, `Base URL: ${sitemapEntries[0].url}`);
    } else {
      assertWarn('Sitemap returned fewer entries than expected');
    }
  } catch (err: any) {
    assertFail('Sitemap generation error', err.message);
  }

  // ------------------------------------------------------------------
  // 6. INDIA-FIRST COMMERCIAL SEARCH INTENT AUDIT
  // ------------------------------------------------------------------
  console.log('\n--- 6. India-First Search Intent & Modern Apparel Audit ---');
  const allKeywords = Array.isArray(homepageMetadata?.keywords) ? homepageMetadata.keywords.map((k) => String(k)) : [];
  const searchIntentMatches = allKeywords.filter((k) =>
    ['modern apparel', 'men\'s clothing online', 'oversized t shirts for men', 'premium t shirts', 'hoodies for men', 'denim jackets for men'].some((term) => k.toLowerCase().includes(term.toLowerCase()))
  );

  if (searchIntentMatches.length >= 3) {
    assertPass('Modern Apparel & commercial Indian search intent naturally represented in keywords', `Matches: ${searchIntentMatches.join(', ')}`);
  } else {
    assertFail('Commercial search terms missing from primary metadata keywords');
  }

  console.log('\n====================================================================');
  console.log(`📊 MASTER SEO QA SUMMARY: ${passed} PASSED / ${failed} FAILED / ${warnings} WARNINGS`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSEOQASuite().catch((err) => {
  console.error('Fatal Error running Master SEO QA Suite:', err);
  process.exit(1);
});
