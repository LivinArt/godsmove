const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim().replace(/\r/g, '');
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const { pg } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      channel: true,
      isExclusiveRack: true,
      collectionName: true,
      collectionBanner: true,
      collectionHeroImage: true,
      collectionHeroVideo: true,
      featuredBadge: true,
    }
  });
  console.log(JSON.stringify(products, null, 2));
}

run().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
