import { prisma } from '../src/lib/prisma';
import { getStorefrontProductBySlug } from '../src/actions/storefront.actions';
import { upsertProductRecord } from '../src/actions/product.actions';

async function runProductDetailsSectionsQASuite() {
  console.log('====================================================================');
  console.log('🧪 RUNNING GODSMOVE PRODUCT DETAILS & TECHNICAL ARCHIVE QA SUITE');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   ${detail}`);
      failed++;
    }
  }

  // Ensure category exists
  let category = await prisma.category.findFirst({ where: { slug: 'hoodies' } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Hoodies', slug: 'hoodies' },
    });
  }

  const testSlug = `qa-details-archive-${Date.now()}`;

  // ------------------------------------------------------------------
  // TEST 1: Product Creation with Default & Custom Storytelling Data
  // ------------------------------------------------------------------
  console.log('--- 1. Testing Product Creation & Storytelling Field Persistence ---');
  let product: any;
  try {
    product = await upsertProductRecord({
      name: 'QA Archival Heavyweight Hoodie',
      slug: testSlug,
      description: 'Architectural heavy cotton silhouette engineered for statement drape.',
      status: 'ACTIVE',
      channel: 'DROP',
      categoryId: category.id,
      mrp: 5999,
      storytelling: {
        detailsEyebrow: 'DESIGN SPECIFICATION',
        detailsTitle: 'PRODUCT DETAILS & SYMBOLISM',
        detailsIntro: 'Custom storytelling narrative intro.',
        detailsBlocks: [
          { eyebrow: 'FABRIC', heading: '380 GSM Cotton', description: 'Heavyweight loopback fleece.', icon: 'Layers' },
        ],
        archiveEyebrow: 'TECHNICAL ARCHIVE',
        archiveTitle: 'GARMENT SPECIFICATIONS',
        archiveBadgeText: 'ATELIER BATCH #001',
        archiveSpecs: [
          { label: 'COMPOSITION', value: '100% Combed Cotton' },
        ],
      },
      images: [{ url: '/images/products/test.png', position: 0, isCover: true }],
      variants: [{ sku: `${testSlug}-L`, size: 'L', initialStock: 25, price: 5999, position: 0, isActive: true }],
    } as any);

    assert(Boolean(product?.id), 'Product created successfully', `Product ID: ${product?.id}`);
  } catch (err: any) {
    assert(false, 'Product Creation Test', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 2: Storefront Query fetches Storytelling field
  // ------------------------------------------------------------------
  console.log('\n--- 2. Testing Storefront Query Storytelling Resolution ---');
  try {
    const sfProduct = await getStorefrontProductBySlug(testSlug);
    assert(sfProduct !== null, 'getStorefrontProductBySlug returns product', `Slug: ${testSlug}`);
    assert(sfProduct?.storytelling !== null, 'getStorefrontProductBySlug includes storytelling field', `Title: ${(sfProduct?.storytelling as any)?.detailsTitle}`);
    assert((sfProduct?.storytelling as any)?.detailsTitle === 'PRODUCT DETAILS & SYMBOLISM', 'detailsTitle matches exact design specification');
    assert((sfProduct?.storytelling as any)?.archiveTitle === 'GARMENT SPECIFICATIONS', 'archiveTitle matches exact technical archive specification');
  } catch (err: any) {
    assert(false, 'Storefront Query Storytelling Test', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 3: Null Storytelling Fallback Simulation
  // ------------------------------------------------------------------
  console.log('\n--- 3. Testing Null Storytelling Product Compatibility ---');
  try {
    const allProds = await prisma.product.findMany({ select: { slug: true, name: true, storytelling: true } });
    const nullStoryProduct = allProds.find((p) => !p.storytelling);

    if (nullStoryProduct) {
      const sfNullProduct = await getStorefrontProductBySlug(nullStoryProduct.slug);
      assert(sfNullProduct !== null, `Null storytelling product "${nullStoryProduct.name}" fetched successfully`);
      assert(sfNullProduct?.storytelling === null, 'Database product has storytelling: null (will use runtime fallback)');
    } else {
      console.log('   ℹ️  No product with storytelling: null found in DB.');
    }
  } catch (err: any) {
    assert(false, 'Null Storytelling Fallback Test', err.message);
  }

  // Clean up QA test product
  console.log('\n--- 4. Cleaning up QA Test Records ---');
  try {
    await prisma.product.deleteMany({
      where: { slug: { startsWith: 'qa-details-archive-' } },
    });
    console.log('✅ [CLEANUP SUCCESS] Temporary test products removed safely.');
  } catch (err: any) {
    console.warn('⚠️ [CLEANUP NOTE]', err.message);
  }

  console.log('\n====================================================================');
  console.log(`📊 QA RESULT SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runProductDetailsSectionsQASuite().catch((err) => {
  console.error('Fatal Error running Product Details Sections QA Suite:', err);
  process.exit(1);
});
