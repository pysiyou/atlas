/**
 * Pipeline stages, timing helpers, and distribution metrics for Command Center.
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/features/orders';
import { useSamplesList } from '@/features/lab/api/samples.api';
import { isActiveTest } from '@/features/orders/utils';
import { formatDurationMs } from '@/utils/formatDuration.utils';
import type { LabTabId } from '@/features/lab/constants/labTabs';
import type { OrderTest } from '@/types';

export type PipelineStage = 'Collection' | 'Results' | 'Review' | 'Escalation';

export const STATUS_TO_STAGE: Record<string, PipelineStage> = {
  pending: 'Collection',
  'sample-collected': 'Results',
  resulted: 'Review',
  escalated: 'Escalation',
};

export const DISTRIBUTION_TO_PIPELINE_STAGE: Record<string, PipelineStage> = {
  Collection: 'Collection',
  Results: 'Results',
  Validation: 'Review',
  Escalation: 'Escalation',
};

export const DISTRIBUTION_SHORT_LABELS: Record<string, string> = {
  Collection: 'Collection',
  Results: 'Entry',
  Validation: 'Review',
  Escalation: 'Escalation',
};

export const WORKFLOW_QUEUES: Array<{
  stage: PipelineStage;
  tab: LabTabId;
  shortLabel: string;
  distributionKey: string;
}> = [
  { stage: 'Collection', tab: 'collection', shortLabel: 'Collection', distributionKey: 'Collection' },
  { stage: 'Results', tab: 'entry', shortLabel: 'Entry', distributionKey: 'Results' },
  { stage: 'Review', tab: 'validation', shortLabel: 'Review', distributionKey: 'Validation' },
];

export const STAGE_TO_TAB: Record<PipelineStage, LabTabId> = {
  Collection: 'collection',
  Results: 'entry',
  Review: 'validation',
  Escalation: 'validation',
};

export const STALE_MS: Record<PipelineStage, number> = {
  Collection: 8 * 60 * 60 * 1000,
  Results: 24 * 60 * 60 * 1000,
  Review: 8 * 60 * 60 * 1000,
  Escalation: 4 * 60 * 60 * 1000,
};

export const CHART_SUCCESS = 'var(--chart-success)';

export function formatDuration(ms: number): string {
  return formatDurationMs(ms);
}

export function getStageLabel(status: string): PipelineStage {
  return STATUS_TO_STAGE[status] ?? 'Collection';
}

export function getTabForDistributionStage(name: string): LabTabId | undefined {
  const stage = DISTRIBUTION_TO_PIPELINE_STAGE[name];
  return stage ? STAGE_TO_TAB[stage] : undefined;
}

export interface QueueSinceInput {
  status: string;
  createdAt?: string;
  updatedAt?: string;
  collectedAt?: string;
  resultEnteredAt?: string;
}

export function deriveQueueSince(test: QueueSinceInput): string | undefined {
  switch (test.status) {
    case 'pending':
      return test.createdAt ?? test.updatedAt;
    case 'sample-collected':
      return test.collectedAt;
    case 'resulted':
      return test.resultEnteredAt;
    case 'escalated':
      return test.updatedAt;
    default:
      return test.updatedAt ?? test.createdAt;
  }
}

export function deriveWaitMs(queueSince: string | undefined, now = Date.now()): number | undefined {
  if (!queueSince) return undefined;
  const entry = new Date(queueSince).getTime();
  if (Number.isNaN(entry)) return undefined;
  return Math.max(0, now - entry);
}

export function isStaleWait(stage: PipelineStage, waitMs: number | undefined): boolean {
  if (waitMs == null) return false;
  return waitMs > STALE_MS[stage];
}

export interface DistributionByStagePoint {
  name: string;
  value: number;
  color?: string;
  arrivedToday: number;
  avgWaitMs?: number;
  oldestEntryAt?: string;
}

const STAGE_ORDER = ['Collection', 'Results', 'Validation', 'Escalation'] as const;
type StageName = (typeof STAGE_ORDER)[number];

const STAGE_COLORS: Record<StageName, string> = {
  Collection: 'var(--chart-warning)',
  Results: 'var(--chart-brand)',
  Validation: 'var(--chart-accent)',
  Escalation: 'var(--chart-danger)',
};

interface StageAccumulator {
  count: number;
  arrivals: number;
  waitSum: number;
  oldest: string;
}

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

function createStageAccumulators(): Record<StageName, StageAccumulator> {
  return {
    Collection: { count: 0, arrivals: 0, waitSum: 0, oldest: '' },
    Results: { count: 0, arrivals: 0, waitSum: 0, oldest: '' },
    Validation: { count: 0, arrivals: 0, waitSum: 0, oldest: '' },
    Escalation: { count: 0, arrivals: 0, waitSum: 0, oldest: '' },
  };
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
  if (!stage.oldest || enteredAt < stage.oldest) stage.oldest = enteredAt;
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
      updateStageMetrics(
        stages.Collection,
        test.createdAt ?? test.updatedAt,
        isTodayLocal(test.createdAt),
        now
      );
      break;
    case 'sample-collected':
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
    const stages = createStageAccumulators();
    const now = Date.now();

    (orders ?? []).forEach(order => {
      (order.tests ?? []).forEach(test => {
        accumulateTestStage(test, stages, sampleCollectedAt, now);
      });
    });

    return toDistributionPoints(stages);
  }, [orders, samples]);

  return { data, isLoading };
}
