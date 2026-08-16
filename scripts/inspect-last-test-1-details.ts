import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const { prisma } = await import('../src/lib/prisma');

  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log('--- RECENT ORDERS IN DB ---');
  for (const o of orders) {
    console.log(`Order ${o.id} (${o.orderNumber}): status=${o.status}, paymentStatus=${o.paymentStatus}, paymentMethod=${o.paymentMethod}, orderType=${(o as any).orderType}, items=${o.items.length}`);
    for (const item of o.items) {
      console.log(`   Product: ${item.variant?.product?.name || item.productName}, Variant: ${item.variant?.sku || item.variantId}, Qty: ${item.quantity}`);
    }
  }
}

main().catch(console.error);
