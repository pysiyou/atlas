/**
 * Priority and queue-age sorting for lab workflow queues.
 */

import { PRIORITY_LEVEL_VALUES } from '@/types';

const PRIORITY_RANK: Record<string, number> = Object.fromEntries(
  PRIORITY_LEVEL_VALUES.map((level, index) => [level, index])
);

export function compareQueuePriority(
  aPriority: string | undefined,
  bPriority: string | undefined,
  aSince: string | undefined,
  bSince: string | undefined
): number {
  const aRank = PRIORITY_RANK[aPriority ?? 'medium'] ?? 1;
  const bRank = PRIORITY_RANK[bPriority ?? 'medium'] ?? 1;
  if (aRank !== bRank) {
    return bRank - aRank;
  }

  const aTime = aSince ? new Date(aSince).getTime() : Number.MAX_SAFE_INTEGER;
  const bTime = bSince ? new Date(bSince).getTime() : Number.MAX_SAFE_INTEGER;
  return aTime - bTime;
}
