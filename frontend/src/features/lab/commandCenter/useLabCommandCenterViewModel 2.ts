/**
 * Thin React Query wrapper for the lab tech command center board.
 * Board payload is server-authoritative.
 */

import { useMemo } from 'react';
import { useLabCommandCenterQuery } from '../api/labCommandCenter';
import type { LabBoardResponse } from '../api/labCommandCenter';
import type { OrderTestBlockReason } from '../utils/labQueue';
import { ATTENTION_TYPE_CONFIG, type AttentionType } from './commandCenterModel';
import type { LabAttentionQueueItem, LabCommandCenterSnapshot, LabPipelineStage } from './commandCenterModel';
import { labStageLabel } from '../constants/labConstants';

const EMPTY_QUEUE_AGE: LabCommandCenterSnapshot['queueAge'] = {
  collection: { oldestHours: null, averageHours: null, warningCount: 0, criticalCount: 0 },
  entry: { oldestHours: null, averageHours: null, warningCount: 0, criticalCount: 0 },
  validation: { oldestHours: null, averageHours: null, warningCount: 0, criticalCount: 0 },
};

const EMPTY_TODAY_PANEL: LabCommandCenterSnapshot['todayPanel'] = {
  dayStartUtc: '',
  steps: [
    { step: 'collection', averageHours: null, sampleCount: 0 },
    { step: 'entry', averageHours: null, sampleCount: 0 },
    { step: 'validation', averageHours: null, sampleCount: 0 },
  ],
};

const EMPTY_BOARD: LabCommandCenterSnapshot = {
  counts: { collection: 0, entry: 0, validation: 0, supervisor: 0 },
  queueAge: EMPTY_QUEUE_AGE,
  blockers: { paymentUnpaid: 0, retestPending: 0, recollectionWaiting: 0, total: 0 },
  attentionItems: [],
  attentionTotal: 0,
  ageBuckets: { fresh: 0, onTrack: 0, warning: 0, critical: 0 },
  priorityMix: { urgent: 0, high: 0, medium: 0, low: 0 },
  health: 'healthy',
  healthMessage: 'Queues within TAT',
  suggestedTab: null,
  totalActive: 0,
  todayPanel: EMPTY_TODAY_PANEL,
};

function isLabPipelineStage(value: string | null | undefined): value is LabPipelineStage {
  return value === 'collection' || value === 'entry' || value === 'validation';
}

function isAttentionType(value: string): value is AttentionType {
  return value in ATTENTION_TYPE_CONFIG;
}

function mapLabAttentionQueueItem(item: LabBoardResponse['attentionItems'][number]): LabAttentionQueueItem {
  return {
    id: item.id,
    stage: item.stage,
    stageLabel: labStageLabel(item.stage, 'short'),
    orderId: item.orderId,
    patientName: item.patientName,
    priority: item.priority,
    waitingHours: item.waitingHours,
    blockedReason: (item.blockedReason as OrderTestBlockReason | null) ?? null,
    blockedLabel: item.blockedLabel ?? null,
    queueTab: isLabPipelineStage(item.queueTab) ? item.queueTab : 'validation',
    since: item.since,
    workItemCount: item.workItemCount,
    orderTestIds: item.orderTestIds ?? [],
    attentionType: isAttentionType(item.attentionType) ? item.attentionType : 'queue_overdue_warning',
  };
}

function toBoardData(board: LabBoardResponse): LabCommandCenterSnapshot {
  return {
    counts: board.counts,
    queueAge: {
      collection: board.queueAge.collection,
      entry: board.queueAge.entry,
      validation: board.queueAge.validation,
    },
    blockers: board.blockers,
    attentionItems: board.attentionItems.map(mapLabAttentionQueueItem),
    attentionTotal: board.attentionTotal,
    ageBuckets: board.ageBuckets,
    priorityMix: board.priorityMix,
    health: board.health,
    healthMessage: board.healthMessage,
    suggestedTab: isLabPipelineStage(board.suggestedTab) ? board.suggestedTab : null,
    totalActive: board.totalActive,
    computedAt: board.computedAt,
    todayPanel: board.todayPanel ?? EMPTY_TODAY_PANEL,
  };
}

export function useLabCommandCenterViewModel(): LabCommandCenterSnapshot & {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
  dataUpdatedAt: number;
} {
  const { board, isLoading, isError, error, refetch, dataUpdatedAt } = useLabCommandCenterQuery();
  const data = useMemo(() => (board ? toBoardData(board) : EMPTY_BOARD), [board]);

  return {
    ...data,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  };
}
