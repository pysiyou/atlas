import { getQueueAgeInfo } from '@/features/lab/utils/queueAge';
import { LAB_CONFIG } from '@/features/lab/constants';
import type { PriorityLevel } from '@/types';
import type { AgeBuckets, PriorityMix, QueueAgeAccumulator, QueueAgeStats } from './boardTypes';

export function emptyQueueAge(): QueueAgeAccumulator {
  return { oldestHours: null, sumHours: 0, itemCount: 0, warningCount: 0, criticalCount: 0 };
}

export function accumulateAge(stats: QueueAgeAccumulator, since: string | undefined | null): void {
  const info = getQueueAgeInfo(since);
  if (!info) return;

  stats.itemCount += 1;
  stats.sumHours += info.hours;

  if (stats.oldestHours === null || info.hours > stats.oldestHours) {
    stats.oldestHours = info.hours;
  }
  if (info.variant === 'warning') stats.warningCount += 1;
  if (info.variant === 'danger') stats.criticalCount += 1;
}

export function finalizeQueueAge(stats: QueueAgeAccumulator): QueueAgeStats {
  return {
    oldestHours: stats.oldestHours,
    averageHours:
      stats.itemCount > 0 ? Math.round((stats.sumHours / stats.itemCount) * 10) / 10 : null,
    warningCount: stats.warningCount,
    criticalCount: stats.criticalCount,
  };
}

export function emptyAgeBuckets(): AgeBuckets {
  return { fresh: 0, onTrack: 0, warning: 0, critical: 0 };
}

export function emptyPriorityMix(): PriorityMix {
  return { urgent: 0, high: 0, medium: 0, low: 0 };
}

export function bumpAgeBucket(buckets: AgeBuckets, hours: number): void {
  if (hours < 1) buckets.fresh += 1;
  else if (hours < LAB_CONFIG.QUEUE_AGE_WARNING_HOURS) buckets.onTrack += 1;
  else if (hours < LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS) buckets.warning += 1;
  else buckets.critical += 1;
}

export function bumpPriority(mix: PriorityMix, priority: PriorityLevel | string | undefined): void {
  if (priority === 'urgent') mix.urgent += 1;
  else if (priority === 'high') mix.high += 1;
  else if (priority === 'low') mix.low += 1;
  else mix.medium += 1;
}
