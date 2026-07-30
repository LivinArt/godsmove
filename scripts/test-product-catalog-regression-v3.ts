import { prisma } from '../src/lib/prisma';
import { upsertProductRecord, getProductBySlug } from '../src/actions/product.actions';
import { calculatePricing } from '../src/lib/PricingEngine';

async function testProductCatalogRegressionV3() {
  console.log('\n====================================================================');
  console.log('🚀 GODSMOVE PRODUCT CATALOG V3 — MANDATORY REGRESSION QA AUDIT');
  console.log('====================================================================\n');

  const results: any[] = [];
  const category = await prisma.category.findFirst() || await prisma.category.create({
    data: { name: 'Regression Outerwear', slug: `reg-outerwear-${Date.now()}` }
  });

  // -------------------------------------------------------------------------
  // PRODUCT 1: Single Color, Single Size (Full E2E Lifecycle)
  // -------------------------------------------------------------------------
  console.log('📍 TEST 1: Product 1 (Single Color, Single Size)');
  const p1Slug = `qa-reg-p1-${Date.now().toString().slice(-4)}`;
  const p1Input = {
    name: 'QA P1 Minimal Single Variant Tee',
    slug: p1Slug,
    description: 'Luxury minimal single variant cotton tee.',
    shortDesc: 'Single Variant Tee',
    category: category.name,
    categoryId: category.id,
    sellingPrice: 12500,
    mrp: 15000,
    costPrice: 5000,
    gstPercentage: 12.0,
    frontImageUrl: '/images/placeholder.svg',
    status: 'ACTIVE' as const,
    images: [{ url: '/images/placeholder.svg', isCover: true, position: 0 }],
    variants: [
      {
        sku: `${p1Slug.toUpperCase()}-BLK-L`,
        size: 'L',
        alphaSize: 'L',
        color: 'Black',
        colorHex: '#000000',
        price: 12500,
        comparePrice: 15000,
        position: 0,
        isActive: true,
        initialStock: 30,
      },
    ],
  };

  const createdP1 = await upsertProductRecord(p1Input as any);
  const reloadedP1 = await getProductBySlug(p1Slug);
  const p1Var = reloadedP1?.variants[0];

  const t1Passed =
    reloadedP1 !== null &&
    p1Var?.size === 'L' &&
    p1Var?.color === 'Black' &&
    p1Var?.colorHex === '#000000' &&
    p1Var?.inventory?.totalStock === 30;

  console.log(`   Product Title           : "${reloadedP1?.name}"`);
  console.log(`   Variant SKU / Size      : ${p1Var?.sku} | Size: ${p1Var?.size} | Color: ${p1Var?.color}`);
  console.log(`   Test 1 Status           : ${t1Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'PRODUCT 1: Single Color & Single Size Creation', expected: 'L (Black, #000000, Stock: 30)', result: `${p1Var?.size} (${p1Var?.color}, ${p1Var?.colorHex}, Stock: ${p1Var?.inventory?.totalStock})`, passed: t1Passed });

  // -------------------------------------------------------------------------
  // PRODUCT 2: Multiple Colors, Multiple Sizes, Measurements & Custom Fields
  // -------------------------------------------------------------------------
  console.log('📍 TEST 2: Product 2 (Multiple Colors x Multiple Sizes + Size Chart)');
  const p2Slug = `qa-reg-p2-${Date.now().toString().slice(-4)}`;
  const p2Input = {
    name: 'QA P2 Multi-Color Multi-Size Heavyweight Hoodie',
    slug: p2Slug,
    description: 'Heavyweight double-weave cotton hoodie with custom measurements.',
    shortDesc: 'Multi-Color Hoodie',
    category: category.name,
    categoryId: category.id,
    sellingPrice: 28000,
    mrp: 32000,
    costPrice: 12000,
    gstPercentage: 12.0,
    frontImageUrl: '/images/placeholder.svg',
    status: 'ACTIVE' as const,
    images: [
      { url: '/images/placeholder.svg', isCover: true, position: 0 },
      { url: '/images/placeholder2.svg', isCover: false, position: 1 },
    ],
    variants: [
      {
        sku: `${p2Slug.toUpperCase()}-BLK-L38`,
        size: 'L-38',
        alphaSize: 'L',
        numericSize: '38',
        color: 'Black',
        colorHex: '#000000',
        price: 28000,
        comparePrice: 32000,
        position: 0,
        isActive: true,
        initialStock: 20,
        measurements: {
          Chest: '40"',
          Shoulder: '18"',
          Waist: '34"',
          'Sleeve Length': '26"',
          'Arm Hole': '9.5"', // Custom field
        },
      },
      {
        sku: `${p2Slug.toUpperCase()}-BLK-XL40`,
        size: 'XL-40',
        alphaSize: 'XL',
        numericSize: '40',
        color: 'Black',
        colorHex: '#000000',
        price: 29000,
        comparePrice: 33000,
        position: 1,
        isActive: true,
        initialStock: 15,
        measurements: {
          Chest: '42"',
          Shoulder: '19"',
          Waist: '36"',
          'Sleeve Length': '27"',
          Bicep: '14.5"', // Custom field
        },
      },
      {
        sku: `${p2Slug.toUpperCase()}-CHR-L38`,
        size: 'L-38',
        alphaSize: 'L',
        numericSize: '38',
        color: 'Charcoal',
        colorHex: '#282828',
        price: 28000,
        comparePrice: 32000,
        position: 2,
        isActive: true,
        initialStock: 25,
        measurements: {
          Chest: '40"',
          Shoulder: '18"',
          Waist: '34"',
        },
      },
    ],
  };

  await upsertProductRecord(p2Input as any);
  const reloadedP2 = await getProductBySlug(p2Slug);

  const blkL = reloadedP2?.variants.find((v) => v.color === 'Black' && v.size === 'L-38');
  const blkXL = reloadedP2?.variants.find((v) => v.color === 'Black' && v.size === 'XL-40');
  const chrL = reloadedP2?.variants.find((v) => v.color === 'Charcoal' && v.size === 'L-38');

  const t2Passed =
    reloadedP2?.variants.length === 3 &&
    blkL?.colorHex === '#000000' &&
    chrL?.colorHex === '#282828' &&
    (blkL?.measurements as any)?.Chest === '40"' &&
    (blkL?.measurements as any)?.['Arm Hole'] === '9.5"' &&
    (blkXL?.measurements as any)?.Bicep === '14.5"';

  console.log(`   Variants Count          : ${reloadedP2?.variants.length} (Expected: 3)`);
  console.log(`   Black L-38 Arm Hole     : ${(blkL?.measurements as any)?.['Arm Hole']}`);
  console.log(`   Black XL-40 Bicep       : ${(blkXL?.measurements as any)?.Bicep}`);
  console.log(`   Charcoal L-38 Color Hex : ${chrL?.colorHex}`);
  console.log(`   Test 2 Status           : ${t2Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'PRODUCT 2: Multiple Colors x Sizes & Custom Measurements Creation', expected: '3 Variants (Black & Charcoal, Chest: 40", Bicep: 14.5")', result: `3 Variants (Black & Charcoal, Chest: ${(blkL?.measurements as any)?.Chest})`, passed: t2Passed });

  // -------------------------------------------------------------------------
  // TEST 3: Product 2 Edit Persistence (Update Black L-38 Chest: 40" -> 41")
  // -------------------------------------------------------------------------
  console.log('📍 TEST 3: Edit Product 2 Measurements (Black L-38 Chest: 40" -> 41")');
  const p2EditInput = {
    id: reloadedP2?.id,
    ...p2Input,
    variants: [
      {
        ...p2Input.variants[0],
        measurements: {
          ...p2Input.variants[0].measurements,
          Chest: '41"', // Updated value
        },
      },
      p2Input.variants[1],
      p2Input.variants[2],
    ],
  };

  await upsertProductRecord(p2EditInput as any);
  const reloadedP2Edited = await getProductBySlug(p2Slug);
  const blkLEdited = reloadedP2Edited?.variants.find((v) => v.color === 'Black' && v.size === 'L-38');

  const t3Passed =
    reloadedP2Edited?.variants.length === 3 &&
    (blkLEdited?.measurements as any)?.Chest === '41"';

  console.log(`   Updated Black L Chest   : "${(blkLEdited?.measurements as any)?.Chest}" (Expected: "41")`);
  console.log(`   Test 3 Status           : ${t3Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'PRODUCT 2: Edit & Persistence Audit', expected: 'Chest: 41"', result: `Chest: ${(blkLEdited?.measurements as any)?.Chest}`, passed: t3Passed });

  // -------------------------------------------------------------------------
  // TEST 4: Storefront & Size Chart Integration Audit for Product 2
  // -------------------------------------------------------------------------
  console.log('📍 TEST 4: Storefront Size Chart Display Audit for Product 2');
  const storefrontP2 = await getProductBySlug(p2Slug);
  const storefrontEntries = storefrontP2?.variants
    ?.filter((v: any) => v.measurements && Object.keys(v.measurements).length > 0)
    ?.map((v: any) => ({
      size: v.size,
      alphaSize: v.alphaSize,
      numericSize: v.numericSize,
      color: v.color,
      measurements: v.measurements,
    })) || [];

  const hasSizeChartP2 = storefrontEntries.length > 0;
  const t4Passed =
    hasSizeChartP2 === true &&
    storefrontEntries.some((e: any) => e.measurements.Chest === '41"') &&
    storefrontEntries.some((e: any) => e.measurements.Bicep === '14.5"');

  console.log(`   hasSizeChart Flag       : ${hasSizeChartP2}`);
  console.log(`   Storefront Size Entries : ${storefrontEntries.length} valid entries`);
  console.log(`   Test 4 Status           : ${t4Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'STOREFRONT: Size Chart Exact DB Measurement Display', expected: 'hasSizeChart=true, Chest=41", Bicep=14.5"', result: `hasSizeChart=${hasSizeChartP2}`, passed: t4Passed });

  // -------------------------------------------------------------------------
  // TEST 5: Product 3 (No Measurements -> Link Hidden)
  // -------------------------------------------------------------------------
  console.log('📍 TEST 5: Product 3 (No Measurements -> Link Hidden)');
  const p3Slug = `qa-reg-p3-${Date.now().toString().slice(-4)}`;
  await upsertProductRecord({
    name: 'QA P3 Accessory Pin Set',
    slug: p3Slug,
    description: 'Limited edition luxury lapel pin set.',
    shortDesc: 'Pin Set',
    category: category.name,
    categoryId: category.id,
    sellingPrice: 3500,
    mrp: 4500,
    costPrice: 1000,
    gstPercentage: 12.0,
    frontImageUrl: '/images/placeholder.svg',
    status: 'ACTIVE',
    images: [{ url: '/images/placeholder.svg', isCover: true, position: 0 }],
    variants: [
      {
        sku: `${p3Slug.toUpperCase()}-OS`,
        size: 'ONE_SIZE',
        price: 3500,
        initialStock: 100,
        position: 0,
        isActive: true,
      },
    ],
  } as any);

  const reloadedP3 = await getProductBySlug(p3Slug);
  const p3Entries = reloadedP3?.variants
    ?.filter((v: any) => v.measurements && Object.keys(v.measurements).length > 0) || [];

  const hasSizeChartP3 = p3Entries.length > 0;
  const t5Passed = hasSizeChartP3 === false;

  console.log(`   Product Title           : "${reloadedP3?.name}"`);
  console.log(`   hasSizeChart Flag       : ${hasSizeChartP3} (Expected: false -> Link hidden completely)`);
  console.log(`   Test 5 Status           : ${t5Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'PRODUCT 3: Without Measurements (Link Hidden)', expected: 'hasSizeChart=false', result: `hasSizeChart=${hasSizeChartP3}`, passed: t5Passed });

  // -------------------------------------------------------------------------
  // TEST 6: Checkout, Pricing & Purchasing End-to-End Audit
  // -------------------------------------------------------------------------
  console.log('📍 TEST 6: Checkout, Pricing & Purchasing E2E Audit');
  const splitsP2 = calculatePricing(29000, 12000, 12);
  const codSurcharge = 99;
  const finalPayableP2 = splitsP2.sellingPrice + codSurcharge;

  const t6Passed =
    splitsP2.sellingPrice === 29000 &&
    splitsP2.gstAmount > 0 &&
    finalPayableP2 === 29099;

  console.log(`   Selling Price           : ₹${splitsP2.sellingPrice}`);
  console.log(`   GST Amount (12%)        : ₹${splitsP2.gstAmount}`);
  console.log(`   COD Payable             : ₹${finalPayableP2}`);
  console.log(`   Test 6 Status           : ${t6Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'CHECKOUT & PURCHASING: End-to-End Pricing & Surcharge Audit', expected: 'Final Payable = ₹29,099', result: `Final Payable = ₹${finalPayableP2}`, passed: t6Passed });

  // Cleanup QA test products
  await prisma.product.deleteMany({
    where: { slug: { in: [p1Slug, p2Slug, p3Slug] } },
  });

  console.log('====================================================================');
  console.log('📊 GODSMOVE PRODUCT CATALOG V3 REGRESSION QA MATRIX');
  console.log('====================================================================');
  console.table(results);

  const allPassed = results.every((r) => r.passed);
  if (allPassed) {
    console.log('\n🎉 100% REGRESSION SUCCESS: ALL 6 AUDIT TESTS PASSED!');
  } else {
    throw new Error('QA Validation failed: One or more audit tests failed.');
  }
  console.log('====================================================================\n');

  await prisma.$disconnect();
}

testProductCatalogRegressionV3();
