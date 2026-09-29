/**
 * Lab dashboard board — maps `/lab/board` into UI state for today, attention, and loading.
 */

import { useMemo } from 'react';
import { useLabCommandCenterQuery } from '../api/labCommandCenter';
import type { LabBoardResponse } from '../api/labCommandCenter';
import type { OrderTestBlockReason } from '../utils/labQueue';
import { labStageLabel } from '../constants/labConstants';
import { ATTENTION_TYPE_CONFIG, type AttentionType } from './commandCenterModel';
import type { LabAttentionQueueItem, LabBoardViewState, LabPipelineStage } from './commandCenterModel';

const EMPTY_TODAY_PANEL: LabBoardViewState['todayPanel'] = {
  dayStartUtc: '',
  testsUpdatedToday: 0,
  testsWithCollection: 0,
  testsWithResultEntry: 0,
  testsWithValidation: 0,
  testsOffNormalPath: 0,
};

const EMPTY_BOARD: LabBoardViewState = {
  attentionItems: [],
  attentionTotal: 0,
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

function toBoardViewState(board: LabBoardResponse): LabBoardViewState {
  const today = board.todayPanel;
  return {
    attentionItems: board.attentionItems.map(mapLabAttentionQueueItem),
    attentionTotal: board.attentionTotal,
    todayPanel: today
      ? {
          dayStartUtc: today.dayStartUtc,
          testsUpdatedToday: today.testsUpdatedToday,
          testsWithCollection: today.testsWithCollection,
          testsWithResultEntry: today.testsWithResultEntry,
          testsWithValidation: today.testsWithValidation,
          testsOffNormalPath: today.testsOffNormalPath,
        }
      : EMPTY_TODAY_PANEL,
  };
}

export function useLabCommandCenterViewModel(): LabBoardViewState & {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
} {
  const { board, isLoading, isError, error, refetch } = useLabCommandCenterQuery();
  const data = useMemo(() => (board ? toBoardViewState(board) : EMPTY_BOARD), [board]);

  return {
    ...data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
