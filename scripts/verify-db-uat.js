const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  });
  return env;
}

async function run() {
  const env = loadEnv();
  const connectionString = env.DIRECT_DATABASE_URL || env.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('--- DATABASE INTEGRITY CHECK (UAT) ---');
    
    const profilesRes = await client.query('SELECT COUNT(*) as count FROM public.profiles;');
    console.log(`Total Profiles: ${profilesRes.rows[0].count}`);

    const walletsRes = await client.query('SELECT COUNT(*) as count FROM public.wallets;');
    console.log(`Total Wallets: ${walletsRes.rows[0].count}`);

    const dupGmIdsRes = await client.query('SELECT "godsmoveId", COUNT(*) FROM public.profiles WHERE "godsmoveId" IS NOT NULL GROUP BY "godsmoveId" HAVING COUNT(*) > 1;');
    console.log(`Duplicate GM IDs Found: ${dupGmIdsRes.rows.length}`);

    const dupWalletsRes = await client.query('SELECT "profileId", COUNT(*) FROM public.wallets GROUP BY "profileId" HAVING COUNT(*) > 1;');
    console.log(`Duplicate Wallets per Profile: ${dupWalletsRes.rows.length}`);

    const profiles = await client.query('SELECT id, email, "godsmoveId", role, "createdAt" FROM public.profiles LIMIT 5;');
    console.log('Profiles Snapshot:', profiles.rows);

  } catch (error) {
    console.error('Error verifying database:', error);
  } finally {
    await client.end();
  }
}

run();
