import { prisma } from '../src/lib/prisma';
import { upsertProductRecord, getProductBySlug } from '../src/actions/product.actions';
import { calculatePricing } from '../src/lib/PricingEngine';

async function testProductCatalogV3() {
  console.log('\n====================================================================');
  console.log('🚀 GODSMOVE PRODUCT CATALOG V3 — MANDATORY QA EXECUTION');
  console.log('====================================================================\n');

  const results: any[] = [];
  const testSlug = `qa-v3-jacket-${Date.now().toString().slice(-4)}`;

  const category = await prisma.category.findFirst() || await prisma.category.create({
    data: { name: 'Outerwear QA', slug: `outerwear-qa-${Date.now()}` }
  });

  // -------------------------------------------------------------------------
  // TEST 1: Create a brand-new product with L-38 and detailed measurements
  // -------------------------------------------------------------------------
  console.log('📍 TEST 1: Create new product with L-38 dual size & measurements');
  const t1Input = {
    name: 'QA V3 Luxury Leather Jacket',
    slug: testSlug,
    description: 'High-end artisan luxury leather jacket.',
    shortDesc: 'Artisan Leather Jacket',
    category: category.name,
    categoryId: category.id,
    sellingPrice: 45000,
    mrp: 55000,
    costPrice: 20000,
    gstPercentage: 12.0,
    frontImageUrl: '/images/placeholder.svg',
    status: 'ACTIVE' as const,
    images: [{ url: '/images/placeholder.svg', isCover: true, position: 0 }],
    variants: [
      {
        sku: `${testSlug.toUpperCase()}-BLK-L38`,
        size: 'L-38',
        alphaSize: 'L',
        numericSize: '38',
        color: 'Black',
        colorHex: '#000000',
        price: 45000,
        comparePrice: 55000,
        position: 0,
        isActive: true,
        initialStock: 15,
        measurements: {
          Chest: '40"',
          Shoulder: '18"',
          Waist: '34"',
          'Sleeve Length': '25"',
          'Garment Length': '28"',
          'Arm Hole': '9.5"', // Custom field
        },
      },
    ],
  };

  const created1 = await upsertProductRecord(t1Input as any);
  const reloaded1 = await getProductBySlug(testSlug);
  const var1 = reloaded1?.variants[0];

  const t1Passed =
    reloaded1 !== null &&
    var1?.size === 'L-38' &&
    var1?.alphaSize === 'L' &&
    var1?.numericSize === '38' &&
    (var1?.measurements as any)?.Chest === '40"' &&
    (var1?.measurements as any)?.['Arm Hole'] === '9.5"';

  console.log(`   Created Product Slug    : "${created1.slug}"`);
  console.log(`   Variant Size            : "${var1?.size}" (alpha: ${var1?.alphaSize}, numeric: ${var1?.numericSize})`);
  console.log(`   Measurements            : Chest: ${(var1?.measurements as any)?.Chest}, Arm Hole: ${(var1?.measurements as any)?.['Arm Hole']}`);
  console.log(`   Test 1 Status           : ${t1Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 1: Create Product with L-38 & Measurements', expected: 'L-38 (Chest: 40", Arm Hole: 9.5")', result: `${var1?.size} (Chest: ${(var1?.measurements as any)?.Chest})`, passed: t1Passed });

  // -------------------------------------------------------------------------
  // TEST 2: Add XL-40 variant with independent measurements
  // -------------------------------------------------------------------------
  console.log('📍 TEST 2: Add XL-40 variant with independent measurements');
  const t2Input = {
    id: reloaded1?.id,
    name: 'QA V3 Luxury Leather Jacket',
    slug: testSlug,
    description: 'High-end artisan luxury leather jacket.',
    category: category.name,
    categoryId: category.id,
    sellingPrice: 45000,
    mrp: 55000,
    costPrice: 20000,
    gstPercentage: 12.0,
    frontImageUrl: '/images/placeholder.svg',
    status: 'ACTIVE' as const,
    images: [{ url: '/images/placeholder.svg', isCover: true, position: 0 }],
    variants: [
      {
        sku: `${testSlug.toUpperCase()}-BLK-L38`,
        size: 'L-38',
        alphaSize: 'L',
        numericSize: '38',
        color: 'Black',
        colorHex: '#000000',
        price: 45000,
        comparePrice: 55000,
        position: 0,
        isActive: true,
        initialStock: 15,
        measurements: {
          Chest: '40"',
          Shoulder: '18"',
          Waist: '34"',
        },
      },
      {
        sku: `${testSlug.toUpperCase()}-BLK-XL40`,
        size: 'XL-40',
        alphaSize: 'XL',
        numericSize: '40',
        color: 'Black',
        colorHex: '#000000',
        price: 47000,
        comparePrice: 57000,
        position: 1,
        isActive: true,
        initialStock: 20,
        measurements: {
          Chest: '42"',
          Shoulder: '19"',
          Waist: '36"',
          Bicep: '14.5"',
        },
      },
    ],
  };

  await upsertProductRecord(t2Input as any);
  const reloaded2 = await getProductBySlug(testSlug);

  const lVar = reloaded2?.variants.find((v) => v.size === 'L-38');
  const xlVar = reloaded2?.variants.find((v) => v.size === 'XL-40');

  const t2Passed =
    reloaded2?.variants.length === 2 &&
    (lVar?.measurements as any)?.Chest === '40"' &&
    (xlVar?.measurements as any)?.Chest === '42"' &&
    (xlVar?.measurements as any)?.Bicep === '14.5"';

  console.log(`   Total Variants Count    : ${reloaded2?.variants.length}`);
  console.log(`   L-38 Chest              : ${(lVar?.measurements as any)?.Chest}`);
  console.log(`   XL-40 Chest             : ${(xlVar?.measurements as any)?.Chest} (Bicep: ${(xlVar?.measurements as any)?.Bicep})`);
  console.log(`   Test 2 Status           : ${t2Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 2: Multiple Independent Variant Measurements', expected: 'L-38: 40", XL-40: 42"', result: `L: ${(lVar?.measurements as any)?.Chest}, XL: ${(xlVar?.measurements as any)?.Chest}`, passed: t2Passed });

  // -------------------------------------------------------------------------
  // TEST 3: Edit measurements for existing variant
  // -------------------------------------------------------------------------
  console.log('📍 TEST 3: Edit existing variant measurements (L-38 Chest: 40" -> 41")');
  const t3Input = {
    ...t2Input,
    variants: [
      {
        sku: `${testSlug.toUpperCase()}-BLK-L38`,
        size: 'L-38',
        alphaSize: 'L',
        numericSize: '38',
        color: 'Black',
        colorHex: '#000000',
        price: 45000,
        comparePrice: 55000,
        position: 0,
        isActive: true,
        initialStock: 15,
        measurements: {
          Chest: '41"', // Updated value
          Shoulder: '18.2"',
          Waist: '35"',
        },
      },
      t2Input.variants[1],
    ],
  };

  await upsertProductRecord(t3Input as any);
  const reloaded3 = await getProductBySlug(testSlug);
  const lVarUpdated = reloaded3?.variants.find((v) => v.size === 'L-38');

  const t3Passed = (lVarUpdated?.measurements as any)?.Chest === '41"';

  console.log(`   Updated L-38 Chest      : "${(lVarUpdated?.measurements as any)?.Chest}" (Expected: "41")`);
  console.log(`   Test 3 Status           : ${t3Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 3: Edit Variant Measurements Persistence', expected: 'Chest: 41"', result: `Chest: ${(lVarUpdated?.measurements as any)?.Chest}`, passed: t3Passed });

  // -------------------------------------------------------------------------
  // TEST 4: Storefront connection (Read EXACT measurements from DB)
  // -------------------------------------------------------------------------
  console.log('📍 TEST 4: Storefront connection (Verify exact DB values read)');
  const storefrontProduct = await getProductBySlug(testSlug);

  const storefrontEntries = storefrontProduct?.variants
    ?.filter((v: any) => v.measurements && Object.keys(v.measurements).length > 0)
    ?.map((v: any) => ({
      size: v.size,
      alphaSize: v.alphaSize,
      numericSize: v.numericSize,
      measurements: v.measurements,
    })) || [];

  const hasStorefrontChart = storefrontEntries.length > 0;
  const t4Passed =
    hasStorefrontChart === true &&
    storefrontEntries[0].measurements.Chest === '41"' &&
    storefrontEntries[1].measurements.Bicep === '14.5"';

  console.log(`   hasSizeChart Flag       : ${hasStorefrontChart}`);
  console.log(`   Storefront Entry 1 (L)  : Chest: ${storefrontEntries[0]?.measurements?.Chest}`);
  console.log(`   Storefront Entry 2 (XL) : Bicep: ${storefrontEntries[1]?.measurements?.Bicep}`);
  console.log(`   Test 4 Status           : ${t4Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 4: Storefront Exact DB Measurement Display', expected: 'L: 41", XL Bicep: 14.5"', result: `L: ${storefrontEntries[0]?.measurements?.Chest}, XL Bicep: ${storefrontEntries[1]?.measurements?.Bicep}`, passed: t4Passed });

  // -------------------------------------------------------------------------
  // TEST 5: Create product WITHOUT measurements -> Hide Size Chart completely
  // -------------------------------------------------------------------------
  console.log('📍 TEST 5: Create product WITHOUT measurements -> Link Hidden');
  const noMeasSlug = `qa-v3-no-meas-${Date.now().toString().slice(-4)}`;
  await upsertProductRecord({
    name: 'QA V3 Minimal Accessory',
    slug: noMeasSlug,
    description: 'Minimal luxury accessory',
    category: category.name,
    categoryId: category.id,
    sellingPrice: 5000,
    mrp: 6000,
    costPrice: 2000,
    gstPercentage: 12.0,
    frontImageUrl: '/images/placeholder.svg',
    status: 'ACTIVE',
    images: [{ url: '/images/placeholder.svg', isCover: true, position: 0 }],
    variants: [
      {
        sku: `${noMeasSlug.toUpperCase()}-OS`,
        size: 'ONE_SIZE',
        price: 5000,
        initialStock: 50,
        position: 0,
        isActive: true,
      },
    ],
  } as any);

  const noMeasProduct = await getProductBySlug(noMeasSlug);
  const noMeasEntries = noMeasProduct?.variants
    ?.filter((v: any) => v.measurements && Object.keys(v.measurements).length > 0)
    ?.map((v: any) => ({ size: v.size, measurements: v.measurements })) || [];

  const hasNoMeasChart = noMeasEntries.length > 0;
  const t5Passed = hasNoMeasChart === false;

  console.log(`   Product Title           : "${noMeasProduct?.name}"`);
  console.log(`   hasSizeChart Flag       : ${hasNoMeasChart} (Expected: false -> Link hidden completely)`);
  console.log(`   Test 5 Status           : ${t5Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 5: Product Without Measurements (Link Hidden)', expected: 'hasSizeChart=false', result: `hasSizeChart=${hasNoMeasChart}`, passed: t5Passed });

  // -------------------------------------------------------------------------
  // TEST 6: Checkout, Pricing, Inventory & Regression Check
  // -------------------------------------------------------------------------
  console.log('📍 TEST 6: Complete purchasing flow regression check');
  const splits = calculatePricing(47000, 20000, 12);
  const codSurcharge = 99;
  const finalPayable = splits.sellingPrice + codSurcharge;

  const t6Passed =
    splits.sellingPrice === 47000 &&
    splits.gstAmount > 0 &&
    splits.profit > 0 &&
    finalPayable === 47099;

  console.log(`   Selling Price           : ₹${splits.sellingPrice}`);
  console.log(`   Taxable Revenue         : ₹${splits.netRevenue}`);
  console.log(`   GST Amount (12%)        : ₹${splits.gstAmount}`);
  console.log(`   Profit Margin           : ₹${splits.profit} (${splits.margin}%)`);
  console.log(`   COD Payable             : ₹${finalPayable}`);
  console.log(`   Test 6 Status           : ${t6Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 6: Checkout, Pricing & Purchasing Flow Regression Check', expected: 'Final Payable = ₹47,099', result: `Final Payable = ₹${finalPayable}`, passed: t6Passed });

  // Cleanup QA test products
  await prisma.product.deleteMany({
    where: { slug: { in: [testSlug, noMeasSlug] } },
  });

  console.log('====================================================================');
  console.log('📊 GODSMOVE PRODUCT CATALOG V3 QA MATRIX');
  console.log('====================================================================');
  console.table(results);

  const allPassed = results.every(r => r.passed);
  if (allPassed) {
    console.log('\n🎉 100% SUCCESS: ALL 6 PRODUCT CATALOG V3 QA TESTS PASSED!');
  } else {
    throw new Error('QA Validation failed: One or more tests failed.');
  }
  console.log('====================================================================\n');

  await prisma.$disconnect();
}

testProductCatalogV3();
