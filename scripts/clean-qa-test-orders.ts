import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function cleanQATestOrders() {
  const { prisma } = await import('../src/lib/prisma');

  const delOrderItems = await prisma.orderItem.deleteMany({});
  const delOrders = await prisma.order.deleteMany({});

  // Reset inventory for any products touched
  await prisma.inventory.updateMany({
    data: {
      soldStock: 0,
      reservedStock: 0,
    },
  });

  console.log(`Cleaned up ${delOrderItems.count} OrderItems and ${delOrders.count} Orders created during QA test run.`);
  console.log('Reset inventory soldStock = 0, reservedStock = 0.');

  await prisma.$disconnect();
}

cleanQATestOrders().catch(console.error);
