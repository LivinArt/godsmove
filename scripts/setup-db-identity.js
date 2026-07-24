const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse .env.local file to retrieve database connection strings
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
  if (!connectionString) {
    console.error('Database connection URL not found in .env.local');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected.');

  try {
    console.log('1. Setting up GODSMOVE ID Sequence...');
    await client.query(`CREATE SEQUENCE IF NOT EXISTS public.godsmove_id_seq START WITH 1;`);

    console.log('2. Creating trigger function to handle user creation...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      DECLARE
        next_val INT;
        gm_id VARCHAR(20);
      BEGIN
        -- Generate next ID from sequence and format as GM-XXXXXX
        SELECT nextval('public.godsmove_id_seq') INTO next_val;
        gm_id := 'GM-' || lpad(next_val::text, 6, '0');

        INSERT INTO public.profiles (id, email, "godsmoveId", role, tier, "marketingEmails", "orderUpdateEmails", "createdAt", "updatedAt")
        VALUES (
          NEW.id,
          NEW.email,
          gm_id,
          'CUSTOMER',
          'STANDARD',
          TRUE,
          TRUE,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;

        -- Auto-create corresponding Wallet (GODSMOVE Credits Account)
        INSERT INTO public.wallets (id, "profileId", balance, currency, "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          NEW.id,
          0.00,
          'INR',
          NOW()
        )
        ON CONFLICT ("profileId") DO NOTHING;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
    `);

    console.log('3. Attaching trigger to auth.users table...');
    await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    `);

    console.log('4. Enabling Row Level Security (RLS) on tables...');
    const tables = [
      'profiles',
      'addresses',
      'orders',
      'order_items',
      'wallets',
      'wallet_transactions',
      'return_requests',
      'wishlist_items',
      'products',
      'product_variants',
      'product_images',
      'product_tags',
      'categories',
      'drops',
      'archive_posts',
      'inventory',
      'homepage_content',
      'campaign_assets'
    ];

    for (const table of tables) {
      await client.query(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }

    console.log('5. Provisioning Row Level Security policies...');
    // Drop existing policies first to prevent conflicts
    const policiesToDrop = [
      ['profiles_self_read', 'profiles'],
      ['profiles_self_update', 'profiles'],
      ['addresses_self_all', 'addresses'],
      ['orders_self_read', 'orders'],
      ['order_items_self_read', 'order_items'],
      ['wallets_self_read', 'wallets'],
      ['wallet_txns_self_read', 'wallet_transactions'],
      ['returns_self_read', 'return_requests'],
      ['returns_self_create', 'return_requests'],
      ['wishlist_self_all', 'wishlist_items'],
      ['products_public_read', 'products'],
      ['variants_public_read', 'product_variants'],
      ['images_public_read', 'product_images'],
      ['tags_public_read', 'product_tags'],
      ['categories_public_read', 'categories'],
      ['drops_public_read', 'drops'],
      ['archive_public_read', 'archive_posts'],
      ['inventory_public_read', 'inventory'],
      ['homepage_content_public_read', 'homepage_content'],
      ['campaign_assets_public_read', 'campaign_assets']
    ];

    for (const [policy, table] of policiesToDrop) {
      await client.query(`DROP POLICY IF EXISTS ${policy} ON public.${table};`);
    }

    // Create policies
    await client.query(`CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT USING (auth.uid()::text = id);`);
    await client.query(`CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid()::text = id);`);
    await client.query(`CREATE POLICY "addresses_self_all" ON public.addresses FOR ALL USING (auth.uid()::text = "profileId");`);
    await client.query(`CREATE POLICY "orders_self_read" ON public.orders FOR SELECT USING (auth.uid()::text = "profileId");`);
    await client.query(`
      CREATE POLICY "order_items_self_read" ON public.order_items FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.orders WHERE orders.id = order_items."orderId"
          AND orders."profileId" = auth.uid()::text
      ));
    `);
    await client.query(`CREATE POLICY "wallets_self_read" ON public.wallets FOR SELECT USING (auth.uid()::text = "profileId");`);
    await client.query(`
      CREATE POLICY "wallet_txns_self_read" ON public.wallet_transactions FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.wallets WHERE wallets.id = wallet_transactions."walletId"
          AND wallets."profileId" = auth.uid()::text
      ));
    `);
    await client.query(`CREATE POLICY "returns_self_read" ON public.return_requests FOR SELECT USING (auth.uid()::text = "profileId");`);
    await client.query(`CREATE POLICY "returns_self_create" ON public.return_requests FOR INSERT WITH CHECK (auth.uid()::text = "profileId");`);
    await client.query(`CREATE POLICY "wishlist_self_all" ON public.wishlist_items FOR ALL USING (auth.uid()::text = "profileId");`);
    await client.query(`CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (status = 'ACTIVE');`);
    await client.query(`CREATE POLICY "variants_public_read" ON public.product_variants FOR SELECT USING (TRUE);`);
    await client.query(`CREATE POLICY "images_public_read" ON public.product_images FOR SELECT USING (TRUE);`);
    await client.query(`CREATE POLICY "tags_public_read" ON public.product_tags FOR SELECT USING (TRUE);`);
    await client.query(`CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (TRUE);`);
    await client.query(`CREATE POLICY "drops_public_read" ON public.drops FOR SELECT USING (status IN ('LIVE', 'ENDED'));`);
    await client.query(`CREATE POLICY "archive_public_read" ON public.archive_posts FOR SELECT USING (status = 'PUBLISHED');`);
    await client.query(`CREATE POLICY "inventory_public_read" ON public.inventory FOR SELECT USING (TRUE);`);
    await client.query(`CREATE POLICY "homepage_content_public_read" ON public.homepage_content FOR SELECT USING (TRUE);`);
    await client.query(`CREATE POLICY "campaign_assets_public_read" ON public.campaign_assets FOR SELECT USING ("isActive" = TRUE);`);

    console.log('✅ PostgreSQL sequence, triggers, functions, and RLS policies successfully provisioned.');
  } catch (error) {
    console.error('❌ Error provisioning SQL triggers / security policies:', error);
  } finally {
    await client.end();
  }
}

run();
