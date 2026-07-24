import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { prisma } from '../src/lib/prisma';

async function main() {
  const columns: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'order_items'
  `);
  console.log('=== Columns in order_items table ===');
  columns.forEach(c => {
    console.log(`- ${c.column_name}: ${c.data_type}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
