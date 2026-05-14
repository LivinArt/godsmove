import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL!, // Must use direct port for DDL
  });

  try {
    await client.connect();
    console.log('Connected to DB...');

    await client.query(`
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
    `);
    console.log('✅ Added isActive to product_variants');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

applyMigration();
