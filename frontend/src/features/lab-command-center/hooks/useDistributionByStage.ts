/**
 * useDistributionByStage - Active (incomplete) tests by state: COLLECTION, RESULTS, VALIDATION, ESCALATION.
 *
 * Active = not superseded, not removed, not validated.
 * For each stage: value (count), arrivedToday (trend), avgWaitMs (average wait), oldestEntryAt (oldest item).
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/features/orders/data/orders';
import { useSamplesList } from '@/features/lab-collection/data/samples';
import { isActiveTest } from '@/features/orders/utils';
import type { Order, OrderTest } from '@/types';

export interface DistributionByStagePoint {
  name: string;
  value: number;
  color?: string;
  /** Tests that entered this state today (trend). */
  arrivedToday: number;
  /** Average wait time in this stage (milliseconds). */
  avgWaitMs?: number;
  /** ISO datetime of the oldest item currently in this stage. */
  oldestEntryAt?: string;
}

const STAGE_ORDER = ['Collection', 'Results', 'Validation', 'Escalation'] as const;

const STAGE_COLORS: Record<(typeof STAGE_ORDER)[number], string> = {
  Collection: 'var(--chart-warning)',
  Results: 'var(--chart-brand)',
  Validation: 'var(--chart-accent)',
  Escalation: 'var(--chart-danger)',
};

type StageName = (typeof STAGE_ORDER)[number];

interface StageAccumulator {
  count: number;
  arrivals: number;
  waitSum: number;
  oldest: string;
}

function createStageAccumulators(): Record<StageName, StageAccumulator> {
  return {
    Collection: { count: 0, arrivals: 0, waitSum: 0, oldest: '' },
    Results: { count: 0, arrivals: 0, waitSum: 0, oldest: '' },
    Validation: { count: 0, arrivals: 0, waitSum: 0, oldest: '' },
    Escalation: { count: 0, arrivals: 0, waitSum: 0, oldest: '' },
  };
}

/** True if the ISO datetime falls on today in the user's local timezone. */
function isTodayLocal(isoString: string | undefined): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function buildSampleCollectedAtMap(
  samples: Array<{ sampleId: number; status: string; collectedAt?: string }>
): Map<number, string> {
  const sampleCollectedAt = new Map<number, string>();
  samples.forEach(s => {
    if (s.status !== 'pending' && s.collectedAt) {
      sampleCollectedAt.set(s.sampleId, s.collectedAt);
    }
  });
  return sampleCollectedAt;
}

function updateStageMetrics(
  stage: StageAccumulator,
  enteredAt: string | undefined,
  arrivedToday: boolean,
  now: number
): void {
  stage.count++;
  if (arrivedToday) stage.arrivals++;
  if (!enteredAt) return;
  stage.waitSum += now - new Date(enteredAt).getTime();
  if (!stage.oldest || enteredAt < stage.oldest) {
    stage.oldest = enteredAt;
  }
}

function accumulateTestStage(
  test: OrderTest,
  stages: Record<StageName, StageAccumulator>,
  sampleCollectedAt: Map<number, string>,
  now: number
): void {
  if (!isActiveTest(test) || test.status === 'validated') return;

  const sampleCA = test.sampleId != null ? sampleCollectedAt.get(test.sampleId) : undefined;
  const wasCollectedToday = sampleCA ? isTodayLocal(sampleCA) : false;
  const wasResultedToday = isTodayLocal(test.resultEnteredAt);

  switch (test.status) {
    case 'pending':
    case 'rejected':
      updateStageMetrics(
        stages.Collection,
        test.createdAt ?? test.updatedAt,
        isTodayLocal(test.createdAt),
        now
      );
      break;
    case 'sample-collected':
    case 'in-progress':
      updateStageMetrics(stages.Results, sampleCA, wasCollectedToday, now);
      break;
    case 'resulted':
      updateStageMetrics(stages.Validation, test.resultEnteredAt, wasResultedToday, now);
      break;
    case 'escalated':
      updateStageMetrics(stages.Escalation, test.updatedAt, isTodayLocal(test.updatedAt), now);
      break;
    default:
      break;
  }
}

function accumulateDistributionMetrics(
  orders: Order[] | undefined,
  sampleCollectedAt: Map<number, string>
): Record<StageName, StageAccumulator> {
  const stages = createStageAccumulators();
  const now = Date.now();

  (orders ?? []).forEach(order => {
    (order.tests ?? []).forEach(test => {
      accumulateTestStage(test, stages, sampleCollectedAt, now);
    });
  });

  return stages;
}

function toDistributionPoints(
  stages: Record<StageName, StageAccumulator>
): DistributionByStagePoint[] {
  return STAGE_ORDER.map(name => {
    const stage = stages[name];
    return {
      name,
      color: STAGE_COLORS[name],
      value: stage.count,
      arrivedToday: stage.arrivals,
      avgWaitMs: stage.count > 0 ? stage.waitSum / stage.count : undefined,
      oldestEntryAt: stage.oldest || undefined,
    };
  });
}

export function useDistributionByStage(): {
  data: DistributionByStagePoint[];
  isLoading: boolean;
} {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const isLoading = ordersLoading || samplesLoading;

  const data = useMemo((): DistributionByStagePoint[] => {
    const sampleCollectedAt = buildSampleCollectedAtMap(samples ?? []);
    const stages = accumulateDistributionMetrics(orders, sampleCollectedAt);
    return toDistributionPoints(stages);
  }, [orders, samples]);

  return { data, isLoading };
}
