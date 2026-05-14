import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupBucket() {
  console.log('Setting up product-images bucket...');

  // 1. Create bucket if not exists
  const { data: buckets, error: getError } = await supabase.storage.listBuckets();
  if (getError) {
    console.error('Error fetching buckets:', getError);
    return;
  }

  const exists = buckets.find((b) => b.name === 'product-images');
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket('product-images', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (createError) {
      console.error('Failed to create bucket:', createError);
      return;
    }
    console.log('✅ Bucket "product-images" created.');
  } else {
    console.log('ℹ️ Bucket "product-images" already exists. Ensuring it is public...');
    await supabase.storage.updateBucket('product-images', { public: true });
  }

  // To set RLS policies on the storage bucket, we typically use SQL. 
  // However, Supabase Storage API handles basic public read access if the bucket is marked public.
  // We will upload via the Service Role key in the server action, which bypasses RLS!
  // So no need to configure complex RLS policies for uploads if we do it server-side.

  console.log('✅ Storage setup complete.');
}

setupBucket();
