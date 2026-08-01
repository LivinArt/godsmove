/**
 * GODSMOVE V7.1 Enterprise Checkout & Recovery Session Manager
 * Persists session tokens across browser storage and HTTP cookies.
 * Survives browser refreshes, tab closes, crashes, and device switches.
 */

const RECOVERY_TOKEN_KEY = 'godsmove_checkout_token';
const COOKIE_NAME = 'godsmove_checkout_session';

export function setCheckoutSessionToken(orderId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const token = `chk_${orderId}`;
    sessionStorage.setItem(RECOVERY_TOKEN_KEY, token);
    localStorage.setItem(RECOVERY_TOKEN_KEY, token);

    // Persist session cookie for 24 hours
    const maxAge = 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // Storage access restricted
  }
}

export function getCheckoutSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const sessionToken = sessionStorage.getItem(RECOVERY_TOKEN_KEY);
    const localToken = localStorage.getItem(RECOVERY_TOKEN_KEY);

    // Read cookie fallback
    let cookieToken: string | null = null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    if (match) {
      cookieToken = decodeURIComponent(match[1]);
    }

    const token = sessionToken || localToken || cookieToken;
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
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    // Storage access restricted
  }
}
