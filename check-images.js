require('dotenv').config({ path: '.env.local' });
const { prisma } = require('./src/lib/prisma');

async function main() {
  const products = await prisma.product.findMany({
    include: { images: { orderBy: { position: 'asc' } } }
  });
  for (const p of products) {
    console.log(`\nProduct: ${p.name} (id: ${p.id}, channel: ${p.channel}, status: ${p.status})`);
    console.log(`  frontImageUrl: ${p.frontImageUrl || 'null'}`);
    console.log(`  images count: ${p.images.length}`);
    p.images.forEach((img, i) => {
      console.log(`  [${i}] url: ${img.url} | position: ${img.position}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
