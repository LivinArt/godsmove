const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.product.findMany({
  where: { status: 'ACTIVE' },
  select: {
    name: true,
    frontImageUrl: true,
    images: { take: 1, orderBy: { position: 'asc' } }
  },
  take: 5
}).then(r => {
  r.forEach(prod => {
    console.log(`\n=== ${prod.name} ===`);
    console.log(`  frontImageUrl: ${prod.frontImageUrl}`);
    console.log(`  images[0].url: ${prod.images[0]?.url ?? '(none)'}`);
  });
}).finally(() => p.$disconnect());
