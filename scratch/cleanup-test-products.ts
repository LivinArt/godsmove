import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function cleanup() {
  const { prisma } = await import('./src/lib/prisma');
  
  const testProducts = await prisma.product.findMany({ 
    where: { slug: { startsWith: 'test-e2e-' } },
    select: { id: true, slug: true }
  });
  
  for (const p of testProducts) {
    const variantIds = (await prisma.productVariant.findMany({ 
      where: { productId: p.id }, select: { id: true } 
    })).map(v => v.id);
    
    if (variantIds.length > 0) {
      await prisma.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
    }
    await prisma.productVariant.deleteMany({ where: { productId: p.id } });
    await prisma.productImage.deleteMany({ where: { productId: p.id } });
    await prisma.product.delete({ where: { id: p.id } });
    console.log(`Cleaned: ${p.slug}`);
  }
  console.log(`Done. Cleaned ${testProducts.length} test products.`);
}

cleanup().catch(console.error);
