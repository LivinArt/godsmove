import { prisma } from '../src/lib/prisma';
import { upsertProductRecord } from '../src/actions/product.actions';

async function runMediaPersistenceQASuite() {
  console.log('====================================================================');
  console.log('🧪 RUNNING GODSMOVE PRODUCT MEDIA PERSISTENCE & IDEMPOTENCY QA SUITE');
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

  // Ensure test category exists
  let testCategory = await prisma.category.findFirst({ where: { slug: 'hoodies' } });
  if (!testCategory) {
    testCategory = await prisma.category.create({
      data: { name: 'Hoodies', slug: 'hoodies' },
    });
  }

  const sampleImages = [
    { url: '/images/products/media-test-01.png', position: 0, isCover: true, alt: 'Front Angle' },
    { url: '/images/products/media-test-02.png', position: 1, isCover: false, alt: 'Back Angle' },
    { url: '/images/products/media-test-03.png', position: 2, isCover: false, alt: 'Detail Zoom' },
  ];

  const testSlug = `qa-media-persistence-${Date.now()}`;

  // ------------------------------------------------------------------
  // TEST 1: Initial Publish with 3 Images
  // ------------------------------------------------------------------
  console.log('--- 1. Testing Initial Publish (3 Images) ---');
  let p1: any;
  try {
    p1 = await upsertProductRecord({
      name: 'QA Media Persistence Jacket',
      slug: testSlug,
      description: 'Media persistence verification test product.',
      status: 'ACTIVE',
      channel: 'DROP',
      categoryId: testCategory.id,
      mrp: 4999,
      images: sampleImages,
      variants: [
        { sku: `${testSlug}-M`, size: 'M', initialStock: 50, price: 4999, position: 0, isActive: true },
      ],
    } as any);

    const dbProduct = await prisma.product.findUnique({
      where: { id: p1.id },
      include: { images: true },
    });

    assert(dbProduct?.images.length === 3, 'Initial Publish creates exactly 3 DB ProductImage rows', `Actual in DB: ${dbProduct?.images.length}`);
  } catch (err: any) {
    assert(false, 'Initial Publish Test', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 2: Idempotency Check — Save Product 3 Consecutive Times
  // ------------------------------------------------------------------
  console.log('\n--- 2. Testing Idempotency (3 Consecutive Saves) ---');
  try {
    for (let i = 1; i <= 3; i++) {
      await upsertProductRecord({
        id: p1.id,
        name: 'QA Media Persistence Jacket',
        slug: testSlug,
        description: 'Media persistence verification test product.',
        status: 'ACTIVE',
        channel: 'DROP',
        categoryId: testCategory.id,
        mrp: 4999,
        images: sampleImages,
        variants: [
          { sku: `${testSlug}-M`, size: 'M', initialStock: 50, price: 4999, position: 0, isActive: true },
        ],
      } as any);
    }

    const dbProductAfterSaves = await prisma.product.findUnique({
      where: { id: p1.id },
      include: { images: true },
    });

    assert(dbProductAfterSaves?.images.length === 3, '3 Consecutive Saves produce EXACTLY 3 DB rows (Zero Duplication)', `Actual in DB: ${dbProductAfterSaves?.images.length}`);
  } catch (err: any) {
    assert(false, 'Idempotency Test', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 3: Delete Persistence — Admin deletes 1 image in Media Manager
  // ------------------------------------------------------------------
  console.log('\n--- 3. Testing Image Deletion Persistence (Admin deletes 1 image) ---');
  try {
    const reducedImages = sampleImages.slice(0, 2); // 2 images remaining
    await upsertProductRecord({
      id: p1.id,
      name: 'QA Media Persistence Jacket',
      slug: testSlug,
      description: 'Media persistence verification test product.',
      status: 'ACTIVE',
      channel: 'DROP',
      categoryId: testCategory.id,
      mrp: 4999,
      images: reducedImages,
      variants: [
        { sku: `${testSlug}-M`, size: 'M', initialStock: 50, price: 4999, position: 0, isActive: true },
      ],
    } as any);

    const dbProductAfterDelete = await prisma.product.findUnique({
      where: { id: p1.id },
      include: { images: true },
    });

    assert(dbProductAfterDelete?.images.length === 2, 'Deleting 1 image in Editor reliably persists 2 DB rows', `Actual in DB: ${dbProductAfterDelete?.images.length}`);
  } catch (err: any) {
    assert(false, 'Image Deletion Test', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 4: Duplicate Payload Protection — In-Memory URL Deduplication
  // ------------------------------------------------------------------
  console.log('\n--- 4. Testing Duplicate Payload Protection ---');
  try {
    const duplicatePayloadImages = [
      sampleImages[0],
      sampleImages[0], // duplicate
      sampleImages[1],
      sampleImages[1], // duplicate
    ];

    await upsertProductRecord({
      id: p1.id,
      name: 'QA Media Persistence Jacket',
      slug: testSlug,
      description: 'Media persistence verification test product.',
      status: 'ACTIVE',
      channel: 'DROP',
      categoryId: testCategory.id,
      mrp: 4999,
      images: duplicatePayloadImages,
      variants: [
        { sku: `${testSlug}-M`, size: 'M', initialStock: 50, price: 4999, position: 0, isActive: true },
      ],
    } as any);

    const dbProductAfterDuplicatePayload = await prisma.product.findUnique({
      where: { id: p1.id },
      include: { images: true },
    });

    assert(dbProductAfterDuplicatePayload?.images.length === 2, 'Duplicate image URLs in payload are deduplicated to 2 unique DB rows', `Actual in DB: ${dbProductAfterDuplicatePayload?.images.length}`);
  } catch (err: any) {
    assert(false, 'Duplicate Payload Protection Test', err.message);
  }

  // Clean up QA test product
  console.log('\n--- 5. Cleaning up Media QA Test Records ---');
  try {
    await prisma.product.deleteMany({
      where: {
        slug: {
          startsWith: 'qa-media-persistence-',
        },
      },
    });
    console.log('✅ [CLEANUP SUCCESS] Temporary media test products removed safely.');
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

runMediaPersistenceQASuite().catch((err) => {
  console.error('Fatal Error running Media Persistence QA Suite:', err);
  process.exit(1);
});
