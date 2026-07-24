/**
 * Compute the effective DropStatus from stored status + timestamps.
 * Can be used in both server and client contexts.
 *
 * Rules:
 *   Manual ARCHIVED always wins.
 *   Past endAt → ENDED
 *   Between launchAt and endAt → LIVE
 *   Future launchAt → SCHEDULED
 *   No date → DRAFT
 */
export function computeEffectiveStatus(
  currentStatus: string,
  launchAt: Date | null,
  endAt: Date | null
): 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'ARCHIVED' {
  if (currentStatus === 'ARCHIVED') return 'ARCHIVED';

  const now = new Date();

  if (endAt && now >= endAt) return 'ENDED';
  if (launchAt && endAt && now >= launchAt && now < endAt) return 'LIVE';
  if (launchAt && !endAt && now >= launchAt) return 'LIVE';
  if (launchAt && now < launchAt) return 'SCHEDULED';

  return 'DRAFT';
}
