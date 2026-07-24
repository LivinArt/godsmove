require('dotenv').config({ path: '.env.local' });
const { prisma } = require('../src/lib/prisma');

async function main() {
  console.log('Querying database columns for "products" table...');
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'products';
  `;
  console.log('Columns in "products" table:');
  columns.forEach(c => {
    console.log(`- ${c.column_name}: ${c.data_type} (Nullable: ${c.is_nullable}, Default: ${c.column_default})`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
