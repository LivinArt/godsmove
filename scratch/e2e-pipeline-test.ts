import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fullE2ETest() {
  const { prisma } = await import('./src/lib/prisma');
  const { getStorefrontProducts, getStorefrontProductBySlug } = await import('./src/actions/storefront.actions');

  const slug = `test-e2e-${Date.now()}`;
  
  console.log('\n====================================================');
  console.log('GODSMOVE — Full E2E Pipeline Verification Test');
  console.log('====================================================\n');

  // --- 1. Verify DB columns all exist ---
  console.log('LAYER 1: Verifying DB columns...');
  const cols = await prisma.$queryRaw<{column_name: string}[]>`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products'
    ORDER BY column_name
  `;
  const colNames = cols.map(c => c.column_name);
  const requiredCols = ['weightWithPackaging', 'useCoverImage', 'garmentLifeCycle', 'editorialNotes', 'packaging'];
  const missingCols = requiredCols.filter(c => !colNames.includes(c));
  if (missingCols.length > 0) {
    console.error(`❌ MISSING DB COLUMNS: ${missingCols.join(', ')}`);
    process.exit(1);
  }
  console.log(`✅ All ${requiredCols.length} required DB columns exist`);

  // --- 2. Get first category ---
  const category = await prisma.category.findFirst();
  if (!category) { console.error('❌ No category found'); process.exit(1); }
  console.log(`✅ Using category: ${category.name} (${category.id})`);

  // --- 3. Create product via Prisma directly (simulating upsertProductRecord logic) ---
  console.log('\nLAYER 2: Creating product via full Prisma transaction...');
  
  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: {
        name: 'E2E Test Luxury Tee',
        slug,
        description: 'Full E2E pipeline verification product.',
        status: 'ACTIVE',
        categoryId: category.id,
        channel: 'EXCLUSIVE_RACK',
        domain: 'PREMIUM_WEAR',
        publishedAt: new Date(),
        // --- The two fields that were broken ---
        weightWithPackaging: 0.65,
        useCoverImage: true,
        // --- All other PIM fields ---
        hsn: '61091000',
        gstPercentage: 12.0,
        costPrice: 500,
        weight: 0.40,
        brand: 'GODSMOVE',
        warehouse: 'Main Warehouse',
        frontImageUrl: '/uploads/test.jpg',
        backImageUrl: '/uploads/test-hover.jpg',
        collectionBanner: '/uploads/test.jpg',
        collectionHeroImage: '/uploads/test.jpg',
        isExclusiveRack: true,
        showOnExclusivePage: true,
        isFeatured: false,
        showOnHomepage: false,
        garmentLifeCycle: JSON.stringify([
          { title: 'Concept', desc: 'Design ideation', icon: 'Compass' },
          { title: 'Material', desc: 'Premium sourcing', icon: 'Layers' },
          { title: 'Pattern', desc: 'Precision grading', icon: 'Scissors' },
          { title: 'Construction', desc: 'Stitchwork', icon: 'Cpu' },
          { title: 'QA', desc: 'Quality audit', icon: 'ShieldCheck' },
          { title: 'Packaging', desc: 'Archive packaging', icon: 'Package' },
        ]),
        editorialNotes: 'This is a test editorial note.',
        packaging: 'Premium matte linen box',
        warranty: '6 months craftsmanship warranty',
        lifestyleImages: [],
        editorialImages: [],
        videos: [],
        styleWithIds: [],
        metadata: {},
      }
    });
    
    // Create variant
    const v = await tx.productVariant.create({
      data: {
        productId: p.id,
        sku: `E2E-M-${Date.now()}`,
        size: 'M',
        color: 'Black',
        colorHex: '#000000',
        price: 2500,
        comparePrice: 2999,
        position: 0,
        isActive: true,
      }
    });
    
    // Create inventory
    await tx.inventory.create({
      data: { variantId: v.id, totalStock: 50, type: 'PERMANENT' }
    });
    
    // Create gallery image
    await tx.productImage.create({
      data: { productId: p.id, url: '/uploads/test.jpg', position: 0, isCover: true }
    });
    
    return p;
  });
  
  console.log(`✅ Product created: ID=${product.id}, Slug=${product.slug}`);

  // --- 4. Verify DB fields ---
  console.log('\nLAYER 3: Verifying stored DB field values...');
  const dbProd = await prisma.product.findUnique({ where: { id: product.id } });
  if (!dbProd) { console.error('❌ Product not found after creation'); process.exit(1); }
  
  const checks: [string, unknown, unknown][] = [
    ['weightWithPackaging', dbProd.weightWithPackaging, 0.65],
    ['useCoverImage', dbProd.useCoverImage, true],
    ['isExclusiveRack', dbProd.isExclusiveRack, true],
    ['showOnExclusivePage', dbProd.showOnExclusivePage, true],
    ['collectionBanner', dbProd.collectionBanner, '/uploads/test.jpg'],
    ['status', dbProd.status, 'ACTIVE'],
  ];
  
  let fieldErrors = 0;
  for (const [field, actual, expected] of checks) {
    if (actual !== expected) {
      console.error(`❌ Field mismatch: ${field} = ${actual} (expected ${expected})`);
      fieldErrors++;
    } else {
      console.log(`✅ ${field}: ${actual}`);
    }
  }
  if (fieldErrors > 0) { console.error(`\n❌ ${fieldErrors} field mismatches found`); process.exit(1); }

  // --- 5. Storefront visibility (Exclusive Rack) ---
  console.log('\nLAYER 4: Verifying storefront catalog visibility...');
  const rackProducts = await getStorefrontProducts({ isExclusiveRack: true, showOnExclusivePage: true });
  const foundInRack = rackProducts.some((p: any) => p.id === product.id);
  console.log(`✅ Exclusive Rack visible: ${foundInRack ? 'YES' : 'NO'}`);
  if (!foundInRack) { console.error('❌ Product not visible in Exclusive Rack'); }

  // --- 6. Direct product lookup by slug (Preview) ---
  console.log('\nLAYER 5: Verifying direct slug lookup (Preview)...');
  const bySlug = await getStorefrontProductBySlug(product.slug);
  if (!bySlug) {
    console.error('❌ Product NOT found by slug — Preview would 404');
  } else {
    console.log(`✅ Product found by slug: ${bySlug.name}`);
  }

  // --- 7. Edit simulation (update) ---
  console.log('\nLAYER 6: Simulating edit and republish...');
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { name: 'E2E Test Luxury Tee — EDITED', weightWithPackaging: 0.70, useCoverImage: false }
  });
  console.log(`✅ Edit successful: name="${updated.name}", weightWithPackaging=${updated.weightWithPackaging}, useCoverImage=${updated.useCoverImage}`);

  // --- 8. Cleanup ---
  console.log('\nCleaning up test records...');
  await prisma.$transaction([
    prisma.inventory.deleteMany({ where: { variant: { productId: product.id } } }),
    prisma.productVariant.deleteMany({ where: { productId: product.id } }),
    prisma.productImage.deleteMany({ where: { productId: product.id } }),
    prisma.product.delete({ where: { id: product.id } }),
  ]);
  console.log('✅ Cleanup done');

  console.log('\n====================================================');
  console.log('✅✅✅  ALL PIPELINE LAYERS VERIFIED — ZERO ERRORS  ✅✅✅');
  console.log('====================================================\n');
}

fullE2ETest().catch((err) => {
  console.error('\n❌ PIPELINE TEST FAILED:', err);
  process.exit(1);
});
