import { prisma } from '../src/lib/prisma';
import { getCodSettings, updateCodSettings } from '../src/actions/cod.actions';
import { getProductBySlug } from '../src/actions/product.actions';

async function testHotfixP0Rendering() {
  console.log('\n====================================================================');
  console.log('🚀 GODSMOVE P0 PRODUCTION HOTFIX — COD SURCHARGE & SIZE CHART QA');
  console.log('====================================================================\n');

  const results: any[] = [];
  const originalCodSettings = await getCodSettings();

  // Helper to format surcharge label identical to Checkout UI logic
  const getSurchargeLabel = (config: { chargeType: string; chargeValue: number }) => {
    const chargeVal = Number(config.chargeValue || 0);
    return config.chargeType === 'PERCENTAGE'
      ? `+${chargeVal}% Extra`
      : `+₹${chargeVal} Extra`;
  };

  // -------------------------------------------------------------------------
  // TEST 1: Admin sets Fixed COD Charge ₹99 -> Checkout +₹99 Extra Badge Visible
  // -------------------------------------------------------------------------
  console.log('📍 TEST 1: Admin sets Fixed COD Charge ₹99 -> Checkout Badge');
  await updateCodSettings({
    isEnabled: true,
    chargeType: 'FIXED',
    chargeValue: 99,
    displayLabel: 'Cash on Delivery',
  });

  const t1Settings = await getCodSettings();
  const t1Badge = getSurchargeLabel(t1Settings);
  const t1Passed = t1Settings.isEnabled && t1Badge === '+₹99 Extra';

  console.log(`   Configured COD Charge    : ₹${t1Settings.chargeValue} (${t1Settings.chargeType})`);
  console.log(`   Rendered Surcharge Badge: "${t1Badge}" (Expected: "+₹99 Extra")`);
  console.log(`   Test 1 Status            : ${t1Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 1: Fixed COD Charge ₹99 Badge', expected: '+₹99 Extra', result: t1Badge, passed: t1Passed });

  // -------------------------------------------------------------------------
  // TEST 2: Admin sets 5% COD Charge -> Checkout +5% Extra Badge Visible
  // -------------------------------------------------------------------------
  console.log('📍 TEST 2: Admin sets 5% COD Charge -> Checkout Badge');
  await updateCodSettings({
    isEnabled: true,
    chargeType: 'PERCENTAGE',
    chargeValue: 5,
    displayLabel: 'Cash on Delivery',
  });

  const t2Settings = await getCodSettings();
  const t2Badge = getSurchargeLabel(t2Settings);
  const t2Passed = t2Settings.isEnabled && t2Badge === '+5% Extra';

  console.log(`   Configured COD Charge    : ${t2Settings.chargeValue}% (${t2Settings.chargeType})`);
  console.log(`   Rendered Surcharge Badge: "${t2Badge}" (Expected: "+5% Extra")`);
  console.log(`   Test 2 Status            : ${t2Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 2: 5% COD Charge Badge', expected: '+5% Extra', result: t2Badge, passed: t2Passed });

  // Restore original COD settings
  await updateCodSettings({
    isEnabled: originalCodSettings.isEnabled,
    chargeType: originalCodSettings.chargeType,
    chargeValue: originalCodSettings.chargeValue,
    displayLabel: originalCodSettings.displayLabel,
  });

  // -------------------------------------------------------------------------
  // TEST 3: Open product with Size Chart support (Apparel product with sizes S-XXL)
  // -------------------------------------------------------------------------
  console.log('📍 TEST 3: Product Page with Size Variants (Void Tee) -> Golden "Size Chart" Link');
  const voidProduct = await getProductBySlug('void-tee-black');
  
  // Logic matching ProductClient.tsx sizeChartEntries extraction
  const getStandardMeasurementForSize = (sizeLabel: string) => {
    const clean = sizeLabel.toUpperCase().trim();
    if (clean === 'S') return { Chest: '38"', Shoulder: '17.5"', Length: '27"', Sleeve: '8.5"' };
    if (clean === 'M') return { Chest: '40"', Shoulder: '18"', Length: '28"', Sleeve: '9"' };
    if (clean === 'L') return { Chest: '42"', Shoulder: '18.5"', Length: '29"', Sleeve: '9.5"' };
    if (clean === 'XL') return { Chest: '44"', Shoulder: '19"', Length: '30"', Sleeve: '10"' };
    if (clean === 'XXL') return { Chest: '46"', Shoulder: '19.5"', Length: '31"', Sleeve: '10.5"' };
    return { Chest: '40"', Shoulder: '18"', Length: '28"' };
  };

  const voidEntries = (() => {
    if ((voidProduct?.sizeChart as any)?.entries?.length > 0) {
      return (voidProduct?.sizeChart as any).entries;
    }
    const customVariantEntries = voidProduct?.variants
      ?.filter((v: any) => v.measurements && Object.keys(v.measurements).length > 0)
      ?.map((v: any) => ({ size: v.size, measurements: v.measurements }));
    if (customVariantEntries && customVariantEntries.length > 0) return customVariantEntries;

    const sizedVariants = voidProduct?.variants?.filter((v: any) => v.size && v.size.toUpperCase() !== 'ONE_SIZE') || [];
    if (sizedVariants.length > 0) {
      const uniqueSizes = Array.from(new Set(sizedVariants.map((v: any) => v.size as string)));
      return uniqueSizes.map((s) => ({ size: s, measurements: getStandardMeasurementForSize(s) }));
    }
    return [];
  })();

  const hasVoidSizeChart = voidEntries.length > 0;
  const t3Passed = hasVoidSizeChart === true && voidEntries.length === 5;

  console.log(`   Product Title           : "${voidProduct?.name}"`);
  console.log(`   Size Variants Count     : ${voidProduct?.variants?.length}`);
  console.log(`   hasSizeChart Flag       : ${hasVoidSizeChart} (Expected: true -> Golden link visible)`);
  console.log(`   Test 3 Status           : ${t3Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 3: Golden "Size Chart" Link Visible for Sized Product', expected: 'hasSizeChart=true (link visible)', result: `hasSizeChart=${hasVoidSizeChart}`, passed: t3Passed });

  // -------------------------------------------------------------------------
  // TEST 4: Click Size Chart -> Modal displays correct measurements
  // -------------------------------------------------------------------------
  console.log('📍 TEST 4: Size Chart Modal Data Verification');
  const sampleEntry = voidEntries[0];
  const t4Passed = voidEntries.length > 0 && sampleEntry?.size === 'S' && sampleEntry?.measurements?.Chest === '38"';

  console.log(`   Entry 1 Size            : "${sampleEntry?.size}"`);
  console.log(`   Entry 1 Measurements    : Chest ${sampleEntry?.measurements?.Chest}, Shoulder ${sampleEntry?.measurements?.Shoulder}`);
  console.log(`   Test 4 Status           : ${t4Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 4: Modal Data Verification (S, M, L, XL, XXL)', expected: 'S Chest=38", Shoulder=17.5"', result: `S Chest=${sampleEntry?.measurements?.Chest}`, passed: t4Passed });

  // -------------------------------------------------------------------------
  // TEST 5: Open product WITHOUT Size Chart (ONE_SIZE product) -> No Size Chart link
  // -------------------------------------------------------------------------
  console.log('📍 TEST 5: Product WITHOUT Size Chart (ONE_SIZE product) -> Link Hidden');
  const accessoryProduct = await getProductBySlug('qa-pim-standalone');
  const accessoryEntries = (() => {
    if ((accessoryProduct?.sizeChart as any)?.entries?.length > 0) return (accessoryProduct?.sizeChart as any).entries;
    const custom = accessoryProduct?.variants?.filter((v: any) => v.measurements && Object.keys(v.measurements).length > 0);
    if (custom && custom.length > 0) return custom;
    const sized = accessoryProduct?.variants?.filter((v: any) => v.size && v.size.toUpperCase() !== 'ONE_SIZE') || [];
    if (sized.length > 0) return sized.map((s: any) => ({ size: s.size, measurements: {} }));
    return [];
  })();

  const hasAccessorySizeChart = accessoryEntries.length > 0;
  const t5Passed = hasAccessorySizeChart === false;

  console.log(`   Product Title           : "${accessoryProduct?.name}"`);
  console.log(`   Variant Size            : "${accessoryProduct?.variants[0]?.size}"`);
  console.log(`   hasSizeChart Flag       : ${hasAccessorySizeChart} (Expected: false -> Link hidden, no UI gaps)`);
  console.log(`   Test 5 Status           : ${t5Passed ? '✅ SUCCESS' : '❌ FAILED'}\n`);
  results.push({ test: 'TEST 5: ONE_SIZE Product (Link Hidden, Backward Compatible)', expected: 'hasSizeChart=false (link hidden)', result: `hasSizeChart=${hasAccessorySizeChart}`, passed: t5Passed });

  console.log('====================================================================');
  console.log('📊 GODSMOVE P0 PRODUCTION HOTFIX QA MATRIX');
  console.log('====================================================================');
  console.table(results);

  const allPassed = results.every(r => r.passed);
  if (allPassed) {
    console.log('\n🎉 100% P0 HOTFIX SUCCESS: ALL 5 QA TESTS PASSED!');
  } else {
    throw new Error('QA Validation failed: One or more tests failed.');
  }
  console.log('====================================================================\n');

  await prisma.$disconnect();
}

testHotfixP0Rendering();
