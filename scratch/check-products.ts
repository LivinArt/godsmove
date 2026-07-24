import { resolve } from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function run() {
  const { prisma } = await import('../src/lib/prisma');
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

run().catch(console.error).finally(() => {
  // Can't easily disconnect without prisma reference, but process will exit anyway
});
