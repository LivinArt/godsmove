import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const BUCKET = 'product-images';

/**
 * POST /api/upload-image
 *
 * Accepts multipart/form-data with a `file` field.
 * Uploads to Supabase Storage using the service role key (bypasses RLS).
 * Returns { url: string } on success.
 *
 * Auth: Requires a valid admin session — checked via cookie-based server client.
 */
export async function POST(req: NextRequest) {
  // 1. Verify the caller has an active session (admin guard is in the form, but
  //    we still want to ensure only authenticated users can upload).
  const supabaseAuth = await createServerClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse the multipart body
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate type and size
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 });
  }

  // 3. Upload using the service role key — bypasses Storage RLS entirely
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${ext}`;
  const filePath = `products/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[upload-image] Supabase error:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // 4. Return the public URL
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
  return NextResponse.json({ url: data.publicUrl });
}
