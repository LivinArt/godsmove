const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({
    include: { images: true }
  });
  console.log(JSON.stringify(products.map(x => ({
    id: x.id,
    name: x.name,
    channel: x.channel,
    status: x.status,
    images: x.images.map(i => i.url)
  })), null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
