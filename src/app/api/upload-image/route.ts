import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse the multipart body
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // 3. Upload to Supabase Storage
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }

  // 4. Return public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrlData.publicUrl });
}
