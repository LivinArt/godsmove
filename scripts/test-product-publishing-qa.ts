import { prisma } from '../src/lib/prisma';
import { upsertProductRecord } from '../src/actions/product.actions';

async function runProductPublishingQASuite() {
  console.log('====================================================================');
  console.log('🧪 RUNNING GODSMOVE PRODUCT PUBLISHING PIPELINE & TRANSACTION QA SUITE');
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

  // Ensure a test Category & Drop exist in DB for testing
  let testCategory = await prisma.category.findFirst({ where: { slug: 'hoodies' } });
  if (!testCategory) {
    testCategory = await prisma.category.create({
      data: { name: 'Hoodies', slug: 'hoodies' },
    });
  }

  let testDrop = await prisma.drop.findFirst({ where: { slug: 'obsidian-capsule' } });
  if (!testDrop) {
    testDrop = await prisma.drop.create({
      data: { name: 'Obsidian Capsule', slug: 'obsidian-capsule', status: 'LIVE' },
    });
  }

  // Sample 6 Media Attachments (Matching user screenshot)
  const sampleMedia = [
    { url: '/images/products/tee-black.png', position: 0, isCover: true, alt: 'Front Cover' },
    { url: '/images/products/tee-charcoal.png', position: 1, isCover: false, alt: 'Back View' },
    { url: '/images/products/tee-ivory.png', position: 2, isCover: false, alt: 'Detail Stitching' },
    { url: '/images/campaign/editorial-01.png', position: 3, isCover: false, alt: 'Editorial Lifestyle' },
    { url: '/images/campaign/editorial-02.png', position: 4, isCover: false, alt: 'Fit Model View' },
    { url: '/images/campaign/editorial-03.png', position: 5, isCover: false, alt: 'Packaging View' },
  ];

  // ------------------------------------------------------------------
  // TEST 1: Standard Product Publishing with 6 Media Attachments & 2 Variants
  // ------------------------------------------------------------------
  console.log('--- 1. Testing Standard Product Publishing (6 Images, 2 Variants) ---');
  const stdSlug = `qa-test-standard-${Date.now()}`;
  const startStd = Date.now();
  
  let stdProductRes: any;
  try {
    stdProductRes = await upsertProductRecord({
      name: 'QA Test Standard Hoodie',
      slug: stdSlug,
      description: 'Standard product publishing verification test piece.',
      status: 'ACTIVE',
      channel: 'DROP',
      categoryId: testCategory.id,
      mrp: 3999,
      costPrice: 350,
      gstPercentage: 18,
      hsn: 'HSN5566',
      images: sampleMedia,
      variants: [
        { sku: `${stdSlug}-M`, size: 'M', initialStock: 100, price: 3999, comparePrice: 4999, position: 0, isActive: true },
        { sku: `${stdSlug}-L`, size: 'L', initialStock: 100, price: 3999, comparePrice: 4999, position: 1, isActive: true },
      ],
    } as any);

    const durationStd = Date.now() - startStd;
    assert(!!stdProductRes?.id, 'Standard Product Published Successfully', `ID: ${stdProductRes?.id} | Action Duration: ${durationStd}ms`);
    assert(durationStd < 15000, 'Product Action Completed Without Transaction Expiration', `Actual: ${durationStd}ms`);
    assert(stdProductRes.images.length === 6, '6 Media Attachments Persisted Successfully', `Found: ${stdProductRes.images.length}`);
    assert(stdProductRes.variants.length === 2, '2 Variants Persisted Successfully', `Found: ${stdProductRes.variants.length}`);
  } catch (err: any) {
    assert(false, 'Standard Product Publishing', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 2: Drops Product Publishing (/drops)
  // ------------------------------------------------------------------
  console.log('\n--- 2. Testing Drops Product Publishing (/drops) ---');
  const dropSlug = `qa-test-drop-${Date.now()}`;
  try {
    const dropProductRes: any = await upsertProductRecord({
      name: 'QA Test Drops Hoodie',
      slug: dropSlug,
      description: 'Drops product publishing test piece.',
      status: 'ACTIVE',
      channel: 'DROP',
      dropId: testDrop.id,
      categoryId: testCategory.id,
      mrp: 4999,
      showOnHomepage: true,
      images: sampleMedia.slice(0, 2),
      variants: [
        { sku: `${dropSlug}-S`, size: 'S', initialStock: 50, price: 4999, position: 0, isActive: true },
        { sku: `${dropSlug}-M`, size: 'M', initialStock: 50, price: 4999, position: 1, isActive: true },
      ],
    } as any);

    assert(dropProductRes.dropId === testDrop.id, 'Linked to Drop Collection', `Drop ID: ${dropProductRes.dropId}`);
    assert(dropProductRes.channel === 'DROP', 'Channel set to DROP');
  } catch (err: any) {
    assert(false, 'Drops Product Publishing', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 3: Exclusive Rack Product Publishing (/exclusive-rack)
  // ------------------------------------------------------------------
  console.log('\n--- 3. Testing Exclusive Rack Product Publishing (/exclusive-rack) ---');
  const exclSlug = `qa-test-exclusive-${Date.now()}`;
  try {
    const exclProductRes: any = await upsertProductRecord({
      name: 'QA Test Exclusive Rack Oversized Tee',
      slug: exclSlug,
      description: 'Exclusive rack product test piece.',
      status: 'ACTIVE',
      channel: 'EXCLUSIVE_RACK',
      categoryId: testCategory.id,
      mrp: 5999,
      featuredBadge: "Editor's Pick",
      showOnHomepage: true,
      images: sampleMedia.slice(0, 3),
      variants: [
        { sku: `${exclSlug}-L`, size: 'L', initialStock: 30, price: 5999, position: 0, isActive: true },
      ],
    } as any);

    assert(exclProductRes.isExclusiveRack === true, 'isExclusiveRack flag set to true');
    assert(exclProductRes.featuredBadge === "Editor's Pick", 'Featured Badge set to "Editor\'s Pick"');
  } catch (err: any) {
    assert(false, 'Exclusive Rack Product Publishing', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 4: Pre-Booking Product Publishing (with Launch Timer & Max Allocation)
  // ------------------------------------------------------------------
  console.log('\n--- 4. Testing Pre-Booking Product Publishing ---');
  const preSlug = `qa-test-prebooking-${Date.now()}`;
  const futureLaunch = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  try {
    const preProductRes: any = await upsertProductRecord({
      name: 'QA Test Pre-Booking Architectural Jacket',
      slug: preSlug,
      description: 'Pre-booking scheduled release product.',
      status: 'ACTIVE',
      channel: 'DROP',
      categoryId: testCategory.id,
      isPreBooking: true,
      launchDateTime: futureLaunch,
      expectedDispatch: 'Within 14 Business Days',
      maxPreBooking: 150,
      hasPreBookingOffer: true,
      preBookingOfferType: 'PERCENT',
      preBookingOfferValue: 15,
      mrp: 8999,
      images: sampleMedia,
      variants: [
        { sku: `${preSlug}-M`, size: 'M', initialStock: 100, price: 8999, position: 0, isActive: true },
        { sku: `${preSlug}-L`, size: 'L', initialStock: 100, price: 8999, position: 1, isActive: true },
      ],
    } as any);

    assert(preProductRes.isPreBooking === true, 'isPreBooking flag set to true');
    assert(preProductRes.maxPreBooking === 150, 'Max Pre-Booking allocation stored (150)');
    assert(!!preProductRes.launchDateTime, 'Scheduled launchDateTime stored');
  } catch (err: any) {
    assert(false, 'Pre-Booking Product Publishing', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 5: Pre-Booking + Exclusive Rack Combination
  // ------------------------------------------------------------------
  console.log('\n--- 5. Testing Pre-Booking + Exclusive Rack Combination ---');
  const comboSlug = `qa-test-combo-${Date.now()}`;
  try {
    const comboProductRes: any = await upsertProductRecord({
      name: 'QA Test Pre-Booking Exclusive Vest',
      slug: comboSlug,
      description: 'Pre-booking exclusive rack product combination.',
      status: 'ACTIVE',
      channel: 'EXCLUSIVE_RACK',
      categoryId: testCategory.id,
      isPreBooking: true,
      launchDateTime: futureLaunch,
      maxPreBooking: 50,
      mrp: 6999,
      images: sampleMedia.slice(0, 2),
      variants: [
        { sku: `${comboSlug}-XL`, size: 'XL', initialStock: 50, price: 6999, position: 0, isActive: true },
      ],
    } as any);

    assert(comboProductRes.isPreBooking === true, 'Pre-booking flag preserved in Exclusive Rack');
    assert(comboProductRes.isExclusiveRack === true, 'Exclusive Rack flag preserved in Pre-booking');
  } catch (err: any) {
    assert(false, 'Pre-Booking + Exclusive Rack Combination', err.message);
  }

  // ------------------------------------------------------------------
  // TEST 6: Multi-Variant High Capacity Scaling (5 Sizes)
  // ------------------------------------------------------------------
  console.log('\n--- 6. Testing Multi-Variant Capacity (5 Sizes) ---');
  const multiSlug = `qa-test-multi-variant-${Date.now()}`;
  const startMulti = Date.now();
  try {
    const multiProductRes: any = await upsertProductRecord({
      name: 'QA Test Multi-Size Heavy Fleece Hoodie',
      slug: multiSlug,
      description: 'Multi-variant high capacity test product.',
      status: 'ACTIVE',
      channel: 'DROP',
      categoryId: testCategory.id,
      mrp: 4499,
      images: sampleMedia,
      variants: [
        { sku: `${multiSlug}-XS`, size: 'XS', initialStock: 25, price: 4499, position: 0, isActive: true },
        { sku: `${multiSlug}-S`, size: 'S', initialStock: 50, price: 4499, position: 1, isActive: true },
        { sku: `${multiSlug}-M`, size: 'M', initialStock: 75, price: 4499, position: 2, isActive: true },
        { sku: `${multiSlug}-L`, size: 'L', initialStock: 75, price: 4499, position: 3, isActive: true },
        { sku: `${multiSlug}-XL`, size: 'XL', initialStock: 50, price: 4499, position: 4, isActive: true },
      ],
    } as any);

    const durationMulti = Date.now() - startMulti;
    assert(multiProductRes.variants.length === 5, '5 Variants & Inventories Created Concurrently', `Found: ${multiProductRes.variants.length}`);
    assert(durationMulti < 15000, 'Batch Scaling Completed Without Transaction Expiration', `Actual: ${durationMulti}ms`);
  } catch (err: any) {
    assert(false, 'Multi-Variant Capacity Scaling', err.message);
  }

  // Clean up QA test records to keep dev DB clean
  console.log('\n--- 7. Cleaning up QA Test Records ---');
  try {
    await prisma.product.deleteMany({
      where: {
        slug: {
          startsWith: 'qa-test-',
        },
      },
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

runProductPublishingQASuite().catch((err) => {
  console.error('Fatal Error running Product Publishing QA Suite:', err);
  process.exit(1);
});
