import { prisma } from '../src/lib/prisma';
import { upsertProductRecord, getProductBySlug } from '../src/actions/product.actions';

async function testSizeChartSystem() {
  console.log('\n====================================================================');
  console.log('🚀 GODSMOVE PRODUCT CATALOG V2 — SIZE CHART & SIZE MANAGEMENT QA');
  console.log('====================================================================\n');

  const timestamp = Date.now();
  const results: any[] = [];

  // Ensure test category exists
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Tops',
        slug: `tops-${timestamp}`,
      },
    });
  }

  // -------------------------------------------------------------------------
  // TEST 1: Create Product with Alphabetic (L) & Numeric (38) Size Variant
  // -------------------------------------------------------------------------
  console.log('📍 TEST 1: Create Product with Alphabetic (L) & Numeric (38) Size Variant');
  const p1Slug = `archival-tee-${timestamp}`;
  const p1Res = await upsertProductRecord({
    name: 'Archival Oversized Tee',
    slug: p1Slug,
    description: 'Luxury heavyweight tee with custom measurements.',
    categoryId: category.id,
    mrp: 3499,
    status: 'ACTIVE',
    channel: 'DROP',
    variants: [
      {
        sku: `ARCH-L38-${timestamp}`,
        size: 'L-38',
        alphaSize: 'L',
        numericSize: '38',
        price: 3499,
        initialStock: 50,
        position: 0,
        isActive: true,
        measurements: {
          Chest: '40"',
          Shoulder: '18"',
          Waist: '34"',
          'Garment Length': '29"',
        },
      },
    ],
  } as any);

  if (!p1Res || !p1Res.id) throw new Error('Test 1 product creation failed');
  const p1Product = await getProductBySlug(p1Slug);
  const v1 = p1Product?.variants[0];
  const v1Meas = v1?.measurements as any;

  const t1Passed = v1?.size === 'L-38' && v1?.alphaSize === 'L' && v1?.numericSize === '38' && v1Meas?.Chest === '40"';
  console.log(`   Combined Size Label : "${v1?.size}" (Expected: "L-38")`);
  console.log(`   Stored alphaSize   : "${v1?.alphaSize}" | numericSize: "${v1?.numericSize}"`);
  console.log(`   Chest Measurement  : "${v1Meas?.Chest}"`);
  console.log(`   Test 1 Status      : ${t1Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 1: Combined Size L-38 Creation', expected: 'size=L-38, alpha=L, num=38', result: `size=${v1?.size}, alpha=${v1?.alphaSize}, num=${v1?.numericSize}`, passed: t1Passed });

  // -------------------------------------------------------------------------
  // TEST 2: Add XL-40 Variant with Independent Measurement Profile
  // -------------------------------------------------------------------------
  console.log('📍 TEST 2: Add XL-40 Variant with Independent Measurement Profile');
  const p2Res = await upsertProductRecord({
    id: p1Product!.id,
    name: 'Archival Oversized Tee',
    slug: p1Slug,
    description: 'Luxury heavyweight tee with custom measurements.',
    categoryId: category.id,
    mrp: 3499,
    status: 'ACTIVE',
    channel: 'DROP',
    variants: [
      {
        sku: `ARCH-L38-${timestamp}`,
        size: 'L-38',
        alphaSize: 'L',
        numericSize: '38',
        price: 3499,
        initialStock: 50,
        position: 0,
        isActive: true,
        measurements: {
          Chest: '40"',
          Shoulder: '18"',
          Waist: '34"',
          'Garment Length': '29"',
        },
      },
      {
        sku: `ARCH-XL40-${timestamp}`,
        size: 'XL-40',
        alphaSize: 'XL',
        numericSize: '40',
        price: 3499,
        initialStock: 40,
        position: 1,
        isActive: true,
        measurements: {
          Chest: '42"',
          Shoulder: '19"',
          Waist: '36"',
          'Garment Length': '30"',
        },
      },
    ],
  } as any);

  if (!p2Res || !p2Res.id) throw new Error('Test 2 product update failed');
  const p2Product = await getProductBySlug(p1Slug);
  const v1Check = p2Product?.variants.find((v: any) => v.size === 'L-38');
  const v2Check = p2Product?.variants.find((v: any) => v.size === 'XL-40');
  const v1CheckMeas = v1Check?.measurements as any;
  const v2CheckMeas = v2Check?.measurements as any;

  const t2Passed = p2Product?.variants.length === 2 && v1CheckMeas?.Chest === '40"' && v2CheckMeas?.Chest === '42"';
  console.log(`   Variant 1 (L-38) Chest : "${v1CheckMeas?.Chest}"`);
  console.log(`   Variant 2 (XL-40) Chest: "${v2CheckMeas?.Chest}"`);
  console.log(`   Test 2 Status          : ${t2Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 2: Independent XL-40 Measurement Profile', expected: 'L-38 Chest=40", XL-40 Chest=42"', result: `L-38=${v1CheckMeas?.Chest}, XL-40=${v2CheckMeas?.Chest}`, passed: t2Passed });

  // -------------------------------------------------------------------------
  // TEST 3: Add Custom Measurements (Arm Hole, Bicep)
  // -------------------------------------------------------------------------
  console.log('📍 TEST 3: Add Custom Measurements (Arm Hole, Bicep)');
  await upsertProductRecord({
    id: p1Product!.id,
    name: 'Archival Oversized Tee',
    slug: p1Slug,
    description: 'Luxury heavyweight tee with custom measurements.',
    categoryId: category.id,
    mrp: 3499,
    status: 'ACTIVE',
    channel: 'DROP',
    variants: [
      {
        sku: `ARCH-L38-${timestamp}`,
        size: 'L-38',
        alphaSize: 'L',
        numericSize: '38',
        price: 3499,
        initialStock: 50,
        position: 0,
        isActive: true,
        measurements: {
          Chest: '40"',
          Shoulder: '18"',
          Waist: '34"',
          'Arm Hole': '9.5"',
          Bicep: '15"',
        },
      },
    ],
  } as any);

  const p3Product = await getProductBySlug(p1Slug);
  const v3Check = p3Product?.variants.find((v: any) => v.size === 'L-38');
  const v3CheckMeas = v3Check?.measurements as any;

  const t3Passed = v3CheckMeas?.['Arm Hole'] === '9.5"' && v3CheckMeas?.['Bicep'] === '15"';
  console.log(`   Custom Field 'Arm Hole': "${v3CheckMeas?.['Arm Hole']}"`);
  console.log(`   Custom Field 'Bicep'   : "${v3CheckMeas?.['Bicep']}"`);
  console.log(`   Test 3 Status          : ${t3Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 3: Custom Measurement Fields', expected: 'Arm Hole=9.5", Bicep=15"', result: `ArmHole=${v3CheckMeas?.['Arm Hole']}, Bicep=${v3CheckMeas?.['Bicep']}`, passed: t3Passed });

  // -------------------------------------------------------------------------
  // TEST 4: Size Chart Metadata Generation
  // -------------------------------------------------------------------------
  console.log('📍 TEST 4: Per-Product Size Chart JSON Structure');
  const t4Entries = (p3Product?.sizeChart as any)?.entries || [];
  const t4Passed = t4Entries.length > 0 && t4Entries[0]?.size === 'L-38';
  console.log(`   sizeChart Entries Count: ${t4Entries.length}`);
  console.log(`   Entry 1 Size           : "${t4Entries[0]?.size}"`);
  console.log(`   Test 4 Status          : ${t4Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 4: Product Size Chart JSON Structure', expected: 'entries.length > 0', result: `Count=${t4Entries.length}`, passed: t4Passed });

  // -------------------------------------------------------------------------
  // TEST 5: Backward Compatibility (Product without Size Chart)
  // -------------------------------------------------------------------------
  console.log('📍 TEST 5: Backward Compatibility (Legacy Product without Size Chart)');
  const legacySlug = `legacy-tee-${timestamp}`;
  await upsertProductRecord({
    name: 'Legacy Basic Tee',
    slug: legacySlug,
    description: 'Basic legacy tee without size chart.',
    categoryId: category.id,
    mrp: 1999,
    status: 'ACTIVE',
    channel: 'DROP',
    variants: [
      {
        sku: `LEG-${timestamp}`,
        size: 'L',
        price: 1999,
        initialStock: 20,
        position: 0,
        isActive: true,
      },
    ],
  } as any);

  const legacyProduct = await getProductBySlug(legacySlug);
  const legacyEntries = (legacyProduct?.sizeChart as any)?.entries || legacyProduct?.variants
    ?.filter((v: any) => v.measurements && Object.keys(v.measurements).length > 0) || [];
  const hasChart = legacyEntries.length > 0;

  const t5Passed = hasChart === false && legacyProduct?.variants[0]?.size === 'L';
  console.log(`   Legacy Variant Size : "${legacyProduct?.variants[0]?.size}"`);
  console.log(`   hasSizeChart Flag   : ${hasChart} (Expected: false -> Size Chart link hidden)`);
  console.log(`   Test 5 Status       : ${t5Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 5: Backward Compatibility (Legacy Product)', expected: 'hasSizeChart=false, Link Hidden', result: `hasSizeChart=${hasChart}`, passed: t5Passed });

  console.log('====================================================================');
  console.log('📊 GODSMOVE SIZE CHART & ADVANCED SIZE MANAGEMENT QA MATRIX');
  console.log('====================================================================');
  console.table(results);

  const allPassed = results.every(r => r.passed);
  if (allPassed) {
    console.log('\n🎉 100% SIZE CHART SYSTEM SUCCESS: ALL 5 QA TESTS PASSED!');
  } else {
    throw new Error('QA Validation failed: One or more size chart tests failed.');
  }
  console.log('====================================================================\n');

  await prisma.$disconnect();
}

testSizeChartSystem();
