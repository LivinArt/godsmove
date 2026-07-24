/**
 * uploadImage — client-side helper for product image uploads.
 *
 * POSTs the file to /api/upload-image, which runs server-side with the
 * Supabase service role key (bypasses Storage RLS). Returns the public URL.
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed with status ${res.status}`);
  }

  const { url } = await res.json();
  if (!url) throw new Error('Upload succeeded but no URL was returned');
  return url;
}
