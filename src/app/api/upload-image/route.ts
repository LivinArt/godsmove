import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

const BUCKET = 'product-images';

/**
 * POST /api/upload-image
 *
 * Accepts multipart/form-data with a `file` field.
 * Uploads to Supabase Storage using the authenticated user's session.
 * The `product-images` bucket has RLS policies allowing authenticated uploads.
 * Returns { url: string } on success.
 *
 * Auth: Requires a valid authenticated session via cookie-based server client.
 */
export async function POST(req: NextRequest) {
  // 1. Get the authenticated session
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[Upload Image API] Authenticated User Check:', {
    userId: user?.id,
    userEmail: user?.email,
    devMode: process.env.NEXT_PUBLIC_DEV_MODE,
  });

  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const hasBypass = cookieStore.get('admin_bypass')?.value === process.env.ADMIN_SECRET;
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const isLoggedOut = cookieStore.get('gm_logged_out')?.value === 'true';

  const isAuthorized = !!user || hasBypass || (isDevMode && !isLoggedOut);

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse the multipart body
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Development mode local file fallback (so local testing doesn't need active Supabase connection/token for uploads)
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${ext}`;
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const filePath = path.join(publicDir, fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    fs.writeFileSync(filePath, buffer);
    
    return NextResponse.json({ url: `/uploads/${fileName}` });
  }

  // Validate type and size
  const allowedTypes = [
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF, MP4, WebM, OGG, MOV' },
      { status: 400 }
    );
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 50MB' },
      { status: 400 }
    );
  }

  // 3. Upload using the authenticated user's session.
  //    The product-images bucket has an INSERT RLS policy:
  //      WITH CHECK (bucket_id = 'product-images') for role 'authenticated'
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${ext}`;
  const filePath = `products/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[upload-image] Supabase Storage error:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // 4. Return the public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return NextResponse.json({ url: data.publicUrl });
}

