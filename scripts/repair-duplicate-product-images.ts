import { prisma } from '../src/lib/prisma';

async function repairDuplicateProductImages() {
  console.log('====================================================================');
  console.log('🧹 RUNNING GODSMOVE PRODUCT MEDIA DUPLICATION REPAIR & AUDIT');
  console.log('====================================================================\n');

  const allProducts = await prisma.product.findMany({
    include: {
      images: {
        orderBy: [{ isCover: 'desc' }, { position: 'asc' }, { id: 'asc' }],
      },
    },
  });

  console.log(`Auditing ${allProducts.length} product(s) in PostgreSQL database...`);

  let corruptedProductCount = 0;
  let totalDuplicateRowsRemoved = 0;

  for (const p of allProducts) {
    const urls = p.images.map((img) => img.url);
    const uniqueUrls = new Set(urls);

    if (urls.length !== uniqueUrls.size) {
      corruptedProductCount++;
      const numDuplicates = urls.length - uniqueUrls.size;
      console.log(`\n⚠️  CORRUPTED PRODUCT DETECTED: "${p.name}" (ID: ${p.id})`);
      console.log(`   - Total DB Image Records: ${urls.length}`);
      console.log(`   - Unique Image URLs: ${uniqueUrls.size}`);
      console.log(`   - Duplicate DB Rows to Remove: ${numDuplicates}`);

      // Repair this product inside transaction
      const repairedImages = await prisma.$transaction(async (tx) => {
        // Build clean deduplicated list
        const seenUrls = new Set<string>();
        const cleanList: { url: string; alt: string | null; isCover: boolean }[] = [];

        for (const img of p.images) {
          if (!img.url) continue;
          const normUrl = img.url.trim();
          if (!seenUrls.has(normUrl)) {
            seenUrls.add(normUrl);
            cleanList.push({
              url: normUrl,
              alt: img.alt,
              isCover: img.isCover,
            });
          }
        }

        const hasCover = cleanList.some((i) => i.isCover);

        // Wipe corrupt rows for this product
        await tx.productImage.deleteMany({
          where: { productId: p.id },
        });

        // Re-insert clean deduplicated set
        if (cleanList.length > 0) {
          await tx.productImage.createMany({
            data: cleanList.map((img, idx) => ({
              productId: p.id,
              url: img.url,
              alt: img.alt || null,
              position: idx,
              isCover: hasCover ? img.isCover : idx === 0,
            })),
          });
        }

        return tx.productImage.findMany({
          where: { productId: p.id },
          orderBy: { position: 'asc' },
        });
      });

      totalDuplicateRowsRemoved += numDuplicates;
      console.log(`   ✅ REPAIRED SUCCESSFULLY! New DB Image Record Count: ${repairedImages.length}`);
    }
  }

  console.log('\n====================================================================');
  console.log('📊 REPAIR AUDIT SUMMARY');
  console.log(`   - Total Products Checked: ${allProducts.length}`);
  console.log(`   - Corrupted Products Found: ${corruptedProductCount}`);
  console.log(`   - Total Duplicate DB Rows Cleaned: ${totalDuplicateRowsRemoved}`);
  console.log('====================================================================\n');

  // Verify "last test 1" status specifically
  const lastTestProduct = await prisma.product.findFirst({
    where: { name: { contains: 'last test 1', mode: 'insensitive' } },
    include: { images: { orderBy: { position: 'asc' } } },
  });

  if (lastTestProduct) {
    console.log(`📌 SPECIFIC CHECK: "last test 1" (ID: ${lastTestProduct.id})`);
    console.log(`   - Persisted Images Count: ${lastTestProduct.images.length}`);
    lastTestProduct.images.forEach((img, i) => {
      console.log(`   [${i + 1}] Position: ${img.position} | Cover: ${img.isCover} | URL: "${img.url}"`);
    });
  } else {
    console.log('📌 SPECIFIC CHECK: Product "last test 1" not found in DB.');
  }

  console.log('\n✅ Database media repair audit complete.');
}

repairDuplicateProductImages().catch((err) => {
  console.error('Fatal error during repair audit:', err);
  process.exit(1);
});
