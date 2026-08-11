import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function repairNegativeReservedStock() {
  console.log('Reconciling negative reservedStock values in Database...');

  const negativeRows = await prisma.inventory.findMany({
    where: { reservedStock: { lt: 0 } },
  });

  for (const row of negativeRows) {
    console.log(`Clearing negative reservedStock for inventory ID ${row.id} (was ${row.reservedStock})`);
    await prisma.inventory.update({
      where: { id: row.id },
      data: { reservedStock: 0 },
    });
  }

  console.log(`Reconciled ${negativeRows.length} negative inventory rows.`);
}

repairNegativeReservedStock()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
