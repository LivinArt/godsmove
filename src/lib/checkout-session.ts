/**
 * Browser Recovery Token Manager
 * Stores ONLY a lightweight token reference (chk_<orderId>) in browser storage.
 * All authoritative cart data, addresses, and order details remain on the server.
 */

const RECOVERY_TOKEN_KEY = 'godsmove_checkout_token';

export function setCheckoutSessionToken(orderId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const token = `chk_${orderId}`;
    sessionStorage.setItem(RECOVERY_TOKEN_KEY, token);
    localStorage.setItem(RECOVERY_TOKEN_KEY, token);
  } catch {
    // Storage access restricted
  }
}

export function getCheckoutSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionToken = sessionStorage.getItem(RECOVERY_TOKEN_KEY);
    const localToken = localStorage.getItem(RECOVERY_TOKEN_KEY);
    const token = sessionToken || localToken;
    if (!token) return null;
    return token.startsWith('chk_') ? token.replace('chk_', '') : token;
  } catch {
    return null;
  }
}

export function clearCheckoutSessionToken(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(RECOVERY_TOKEN_KEY);
    localStorage.removeItem(RECOVERY_TOKEN_KEY);
  } catch {
    // Storage access restricted
  }
}
