/**
 * CANONICAL GODSMOVƎ STORE LAUNCH CONFIGURATION
 * Sole launch authority is controlled via Admin Dashboard siteMode setting.
 *
 * There is NO automatic calendar-based launch.
 * Storefront launch happens strictly when Admin clicks "SWITCH STOREFRONT TO LIVE".
 */

/**
 * Calculates 1-year membership expiry date from launch activation date.
 * Guarantees exactly 1 year of VIP membership (365/366 days).
 */
export function calculateMembershipExpiry(activationDate: Date = new Date()): Date {
  const expiry = new Date(activationDate.getTime());
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
}

/**
 * Formats a Date into a human-readable IST string for Admin / Customer views.
 */
export function formatLaunchDateIST(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
