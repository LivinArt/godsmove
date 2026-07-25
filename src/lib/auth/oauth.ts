/**
 * Shared Google OAuth helper for GODSMOVE.
 *
 * WHY THIS EXISTS:
 * Supabase validates the `redirectTo` URL against its Redirect Allowlist.
 * Any URL that includes custom query params (e.g. ?next=/profile) may NOT
 * match an allowlist entry, causing Supabase to fall back to the configured
 * Site URL (which was previously http://localhost:3000).
 *
 * SOLUTION — Cookie-based destination handoff:
 * 1. Store the post-auth destination in a short-lived cookie BEFORE OAuth.
 * 2. Pass a clean `redirectTo` URL (no query params) matching the Allowlist.
 * 3. The /auth/callback route reads the cookie, clears it, then redirects.
 *
 * Works reliably in dev (localhost:3000) and production (Vercel/custom domain).
 */

import { SupabaseClient } from '@supabase/supabase-js';

/** Cookie name used to store the post-OAuth destination path. */
export const OAUTH_NEXT_COOKIE = 'godsmove_oauth_next';

/** Cookie TTL in seconds — 5 minutes is ample for any OAuth flow. */
const COOKIE_MAX_AGE = 300;

/**
 * Returns the base callback URL derived from window.location.origin.
 * Never hardcoded — works for localhost, Vercel, and custom domains.
 *
 * Dev:        http://localhost:3000/auth/callback
 * Production: https://godsmove-ashen.vercel.app/auth/callback
 */
export function getCallbackUrl(): string {
  if (typeof window === 'undefined') {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${base}/auth/callback`;
  }
  return `${window.location.origin}/auth/callback`;
}

/**
 * Stores the intended post-auth destination in a short-lived cookie.
 * The /auth/callback route reads this to know where to redirect.
 */
export function setOAuthDestinationCookie(destination: string): void {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(destination);
  document.cookie = `${OAUTH_NEXT_COOKIE}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Initiates a Google OAuth flow with the correct callback URL.
 *
 * @param supabase    - A Supabase browser client instance
 * @param destination - Where to redirect after successful authentication
 */
export async function initiateGoogleOAuth(
  supabase: SupabaseClient,
  destination: string,
): Promise<{ error: Error | null }> {
  setOAuthDestinationCookie(destination);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getCallbackUrl(),
    },
  });

  return { error: error as Error | null };
}
