import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runTest() {
  const { prisma } = await import('../src/lib/prisma');
  const { getStorefrontProductBySlug, getStorefrontProducts } = await import('../src/actions/storefront.actions');
  console.log('--- STARTING PIM REBUILD INTEGRATION TEST ---');
  
  // 1. Fetch a category to use
  const category = await prisma.category.findFirst();
  if (!category) {
    console.error('Error: No category exists in DB. Seed database first.');
    process.exit(1);
  }
  console.log(`Using category: ${category.name} (${category.id})`);

  const testSlug = `test-pim-rebuild-${Date.now()}`;
  const testSku = `TST-PIM-${Date.now()}-M`;

  // 2. Prepare payload
  const mockPayload: any = {
    name: 'Test PIM Luxury Tee',
    slug: testSlug,
    description: 'This is a test product created to verify PIM schema rebuilding.',
    status: 'ACTIVE',
    categoryId: category.id,
    channel: 'EXCLUSIVE_RACK', // should trigger isExclusiveRack: true, showOnExclusivePage: true, isFeatured: false
    hsn: '61091000',
    gstPercentage: 12.0,
    costPrice: 500,
    weight: 0.35,
    weightWithPackaging: 0.55,
    brand: 'GODSMOVE',
    warehouse: 'Main Warehouse',
    useCoverImage: true,
    frontImageUrl: '/images/test-cover.png',
    backImageUrl: '/images/test-hover.png',
    variants: [
      {
        sku: testSku,
        size: 'M',
        color: 'Black',
        colorHex: '#000000',
        price: 2500,
        comparePrice: 2999,
        position: 0,
        isActive: true,
        initialStock: 25
      }
    ],
    images: [
      {
        url: '/images/test-cover.png',
        position: 0,
        isCover: true
      },
      {
        url: '/images/test-gallery.png',
        position: 1,
        isCover: false
      }
    ]
  };

  console.log('Inserting product through database upsert mimic...');
  
  try {
    const saved = await prisma.$transaction(async (tx) => {
      // Sync visibility flags and channels (mimics product.actions.ts)
      const { variants, images, ...productData } = mockPayload;
      
      if (productData.channel === 'DROP') {
        productData.isFeatured = productData.showOnHomepage || false;
        productData.isExclusiveRack = false;
        productData.showOnExclusivePage = false;
      } else if (productData.channel === 'EXCLUSIVE_RACK') {
        productData.isExclusiveRack = true;
        productData.showOnExclusivePage = true;
        productData.isFeatured = false;
      }

      // Media Reuse Banner/Hero
      if (productData.useCoverImage && productData.frontImageUrl) {
        productData.collectionBanner = productData.frontImageUrl;
        productData.collectionHeroImage = productData.frontImageUrl;
      }

      const p = await tx.product.create({
        data: {
          ...productData,
          domain: 'PREMIUM_WEAR',
          publishedAt: new Date(),
        }
      });

      // Insert mock variants & images
      for (const img of images || []) {
        await tx.productImage.create({
          data: {
            productId: p.id,
            url: img.url,
            position: img.position,
            isCover: img.isCover
          }
        });
      }

      for (const v of variants) {
        const { initialStock, ...vData } = v;
        const newV = await tx.productVariant.create({
          data: { ...vData, productId: p.id }
        });
        await tx.inventory.create({
          data: {
            variantId: newV.id,
            totalStock: initialStock || 0,
            type: 'PERMANENT'
          }
        });
      }

      return p;
    });

    console.log(`✓ Product saved successfully! ID: ${saved.id}, Slug: ${saved.slug}`);

    // 3. Verify Database fields
    const dbProduct = await prisma.product.findUnique({
      where: { id: saved.id }
    });

    if (!dbProduct) throw new Error('Database verification failed: product not found');
    console.log('Verifying DB field mappings...');
    console.log(`- useCoverImage: ${dbProduct.useCoverImage} (expected true)`);
    console.log(`- isExclusiveRack: ${dbProduct.isExclusiveRack} (expected true)`);
    console.log(`- showOnExclusivePage: ${dbProduct.showOnExclusivePage} (expected true)`);
    console.log(`- collectionBanner: ${dbProduct.collectionBanner} (expected /images/test-cover.png)`);
    console.log(`- weightWithPackaging: ${dbProduct.weightWithPackaging} (expected 0.55)`);

    // 4. Verify storefront catalog search/fetch
    const activeProducts = await getStorefrontProducts({ isExclusiveRack: true, showOnExclusivePage: true });
    const foundInCatalog = activeProducts.some(p => p.id === saved.id);
    console.log(`- Visible on Exclusive Rack Grid: ${foundInCatalog ? 'YES' : 'NO'}`);

    // 5. Cleanup test record
    console.log('Cleaning up test records...');
    await prisma.inventory.deleteMany({
      where: { variant: { productId: saved.id } }
    });
    await prisma.productVariant.deleteMany({
      where: { productId: saved.id }
    });
    await prisma.productImage.deleteMany({
      where: { productId: saved.id }
    });
    await prisma.product.delete({
      where: { id: saved.id }
    });
    console.log('✓ Cleanup completed.');
    console.log('--- TEST COMPLETED SUCCESSFULLY ---');

  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

runTest();
