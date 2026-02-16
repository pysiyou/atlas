/**
 * useDistributionByStage - Test counts by workflow stage: Sample, Result, Validation, Scalation.
 * Uses order test status; excludes rejected/superseded/removed.
 * change = week-over-week % (last 7 days vs previous 7 days by updatedAt).
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/hooks/queries';
import { isActiveTest } from '@/utils/orderUtils';
import type { OrderTest } from '@/types';

export interface DistributionByStagePoint {
  name: string;
  value: number;
  /** Week-over-week % change (e.g. 0.37 = +0.37%). Undefined if no previous period. */
  change?: number;
  /** ISO datetime of last operation for this stage (e.g. last result entry, last validation). */
  lastSeenAt?: string;
}

const STAGE_ORDER = ['Sample', 'Result', 'Validation', 'Scalation'] as const;

function stageFromStatus(status: OrderTest['status']): (typeof STAGE_ORDER)[number] | null {
  switch (status) {
    case 'pending':
    case 'sample-collected':
    case 'in-progress':
      return 'Sample';
    case 'resulted':
      return 'Result';
    case 'validated':
      return 'Validation';
    case 'escalated':
      return 'Scalation';
    case 'rejected':
    case 'superseded':
    case 'removed':
      return null;
    default:
      return null;
  }
}

/** YYYY-MM-DD for date at start of day (local). */
function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** True if iso date string (YYYY-MM-DD or ISO) is within [startKey, endKey] (inclusive). */
function isInRange(iso: string | undefined, startKey: string, endKey: string): boolean {
  if (!iso || typeof iso !== 'string') return false;
  const key = iso.split('T')[0];
  return key >= startKey && key <= endKey;
}

export function useDistributionByStage(): {
  data: DistributionByStagePoint[];
  isLoading: boolean;
} {
  const { orders, isLoading } = useOrdersList();

  const data = useMemo((): DistributionByStagePoint[] => {
    const now = new Date();
    const endCurrent = new Date(now);
    endCurrent.setDate(endCurrent.getDate() - 1);
    const startCurrent = new Date(now);
    startCurrent.setDate(startCurrent.getDate() - 7);
    const endPrevious = new Date(startCurrent);
    endPrevious.setDate(endPrevious.getDate() - 1);
    const startPrevious = new Date(endPrevious);
    startPrevious.setDate(startPrevious.getDate() - 6);

    const startCurrentKey = getDateKey(startCurrent);
    const endCurrentKey = getDateKey(endCurrent);
    const startPreviousKey = getDateKey(startPrevious);
    const endPreviousKey = getDateKey(endPrevious);

    const countByStage = new Map<string, number>();
    const currentPeriodByStage = new Map<string, number>();
    const previousPeriodByStage = new Map<string, number>();
    const lastSeenByStage = new Map<string, string>();
    STAGE_ORDER.forEach((s) => {
      countByStage.set(s, 0);
      currentPeriodByStage.set(s, 0);
      previousPeriodByStage.set(s, 0);
    });

    (orders ?? []).forEach((order) => {
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;
        const stage = stageFromStatus(test.status);
        if (!stage) return;
        countByStage.set(stage, (countByStage.get(stage) ?? 0) + 1);
        const updatedAt = test.updatedAt ?? test.createdAt;
        if (isInRange(updatedAt, startCurrentKey, endCurrentKey)) {
          currentPeriodByStage.set(stage, (currentPeriodByStage.get(stage) ?? 0) + 1);
        }
        if (isInRange(updatedAt, startPreviousKey, endPreviousKey)) {
          previousPeriodByStage.set(stage, (previousPeriodByStage.get(stage) ?? 0) + 1);
        }
        const candidate =
          stage === 'Sample'
            ? updatedAt
            : stage === 'Result'
              ? test.resultEnteredAt
              : stage === 'Validation'
                ? test.resultValidatedAt
                : stage === 'Scalation'
                  ? updatedAt
                  : undefined;
        if (candidate) {
          const prev = lastSeenByStage.get(stage);
          if (!prev || candidate > prev) lastSeenByStage.set(stage, candidate);
        }
      });
    });

    return STAGE_ORDER.map((name) => {
      const value = countByStage.get(name) ?? 0;
      const curr = currentPeriodByStage.get(name) ?? 0;
      const prev = previousPeriodByStage.get(name) ?? 0;
      let change: number | undefined;
      if (prev > 0) {
        change = Number((((curr - prev) / prev) * 100).toFixed(2));
      } else if (curr > 0) {
        change = 100;
      }
      const lastSeenAt = lastSeenByStage.get(name);
      return { name, value, change, lastSeenAt };
    });
  }, [orders]);

  return { data, isLoading };
}
