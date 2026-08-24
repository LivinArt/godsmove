/**
 * CANONICAL GODSMOVƎ STORE LAUNCH CONFIGURATION
 * Single source of truth for the official website launch date.
 *
 * BUSINESS LAUNCH INSTANT:
 * 15 September 2026, 00:00:00 IST (Indian Standard Time, UTC+5:30)
 * Equivalent UTC Instant: 2026-09-14T18:30:00.000Z
 */

export const GODSMOVE_LAUNCH_DATE_IST_TEXT = '15 September 2026, 00:00 IST';
export const GODSMOVE_LAUNCH_DATE_ISO = process.env.GODSMOVE_LAUNCH_DATE || '2026-09-14T18:30:00.000Z';

/**
 * Returns the canonical Date object for the official GODSMOVƎ store launch.
 */
export function getOfficialLaunchDate(): Date {
  const d = new Date(GODSMOVE_LAUNCH_DATE_ISO);
  return isNaN(d.getTime()) ? new Date('2026-09-14T18:30:00.000Z') : d;
}

/**
 * Calculates 1-year membership expiry date from launch activation date.
 * Guarantees zero timezone or leap day drift (15 Sept 2026 -> 15 Sept 2027 IST).
 */
export function calculateMembershipExpiry(launchDate: Date = getOfficialLaunchDate()): Date {
  const expiry = new Date(launchDate.getTime());
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry;
}

/**
 * Checks whether the official GODSMOVƎ launch date has arrived.
 */
export function isStoreLaunched(now: Date = new Date()): boolean {
  return now.getTime() >= getOfficialLaunchDate().getTime();
}

/**
 * Formats a Date into a human-readable IST string.
 */
export function formatLaunchDateIST(date: Date = getOfficialLaunchDate()): string {
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
    return GODSMOVE_LAUNCH_DATE_IST_TEXT;
  }
}
