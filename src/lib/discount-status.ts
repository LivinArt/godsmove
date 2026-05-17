/**
 * Compute the effective DiscountStatus from stored status, isActive, and timestamps.
 * Can be used in both server and client contexts.
 *
 * Rules:
 *   Manual ARCHIVED always wins.
 *   If !isActive, returns DRAFT (or whatever the stored status is, usually DRAFT).
 *   Start date in future -> SCHEDULED
 *   End date in past -> EXPIRED
 *   Active and within window -> ACTIVE
 *   Otherwise -> DRAFT
 */
export function computeEffectiveDiscountStatus(
  currentStatus: string,
  isActive: boolean,
  startsAt: Date | null,
  endsAt: Date | null
): 'DRAFT' | 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'ARCHIVED' {
  if (currentStatus === 'ARCHIVED') return 'ARCHIVED';
  
  if (!isActive) return 'DRAFT';

  const now = new Date();

  if (startsAt && now < startsAt) return 'SCHEDULED';
  if (endsAt && now >= endsAt) return 'EXPIRED';

  // If we have a start date and it's in the past, or no start date, and no end date or end date in future
  return 'ACTIVE';
}
