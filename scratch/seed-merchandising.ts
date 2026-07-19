import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('Starting backfill of product merchandising and details columns...');

  const { prisma } = await import('../src/lib/prisma');

  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to check.`);

  let updatedCount = 0;

  for (const product of products) {
    const isRack = product.channel === 'EXCLUSIVE_RACK' || product.slug.includes('echo') || product.slug.includes('static');
    
    // Simple mock values for demonstration
    const whyWeMadeThis = `We crafted the ${product.name} to serve as a premium foundational staple. Balancing high yarn weight and a clean silhouette, it is designed for daily wear.`;
    const fabricName = '280 GSM Premium Yarn';
    const fabricWhy = 'Selected for its heavyweight structure, exceptional breathability, and premium handfeel that maintains shape over time.';
    const constructionName = 'Reinforced Double-Stitch Seams';
    const constructionWhy = 'Double-needle flatlock stitches placed along primary stress lines to prevent seam warping or tearing under movement.';
    const printName = 'High-Density Distressed Finish';
    const printWhy = 'Our custom label print is designed to fade slowly with time, developing a soft, vintage texture and a personal patina.';
    
    await prisma.product.update({
      where: { id: product.id },
      data: {
        isExclusiveRack: isRack,
        showOnHomepage: true,
        showOnExclusivePage: true,
        featuredPriority: 1,
        featuredBadge: isRack ? "Editor's Pick" : null,
        featuredHeadline: isRack ? "THE SIGNATURE SERIES" : null,
        featuredDescription: isRack ? "An editorial highlight from our permanent vault." : null,
        collectionName: isRack ? "Signature Collection" : "Drops Collection",
        whyWeMadeThis: product.whyWeMadeThis || whyWeMadeThis,
        fabricName: product.fabricName || fabricName,
        fabricWhy: product.fabricWhy || fabricWhy,
        constructionName: product.constructionName || constructionName,
        constructionWhy: product.constructionWhy || constructionWhy,
        printName: product.printName || printName,
        printWhy: product.printWhy || printWhy,
        material: product.material || '100% Organic Cotton',
        fit: product.fit || 'Oversized Boxy Fit',
        origin: product.origin || 'Mumbai Studio',
        washCare: product.washCare || 'Machine wash cold, hang dry only',
        country: product.country || 'India',
        manufacturer: product.manufacturer || 'GODSMOVE Atelier',
        mrp: product.mrp || 2499.00,
        hsn: product.hsn || '6109.10.00',
        netQuantity: product.netQuantity || 1,
      },
    });
    updatedCount++;
  }

  console.log(`Backfilled ${updatedCount} products successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
