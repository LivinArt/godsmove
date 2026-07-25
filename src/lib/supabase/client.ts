'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client — for Client Components only.
 * Uses the public anon key (safe for browser).
 * Zero mock sessions or dev overrides.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
