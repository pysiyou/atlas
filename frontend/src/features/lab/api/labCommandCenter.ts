/**
 * Command Center API — board snapshot.
 */
import { apiClient } from '@/lib/api/client';
import type { PriorityLevel } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/authStore';
import { queryKeys, cacheConfig } from '@/lib/query';
import { LAB_CONFIG } from '../constants';

export interface LabBoardResponse {
  counts: { collection: number; entry: number; validation: number; supervisor: number };
  queueAge: Record<
    'collection' | 'entry' | 'validation',
    {
      oldestHours: number | null;
      averageHours: number | null;
      warningCount: number;
      criticalCount: number;
    }
  >;
  blockers: {
    paymentUnpaid: number;
    retestPending: number;
    recollectionWaiting: number;
    total: number;
  };
  health: 'healthy' | 'attention' | 'critical';
  healthMessage: string;
  suggestedTab?: string | null;
  ageBuckets: {
    fresh: number;
    onTrack: number;
    warning: number;
    critical: number;
  };
  priorityMix: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  attentionItems: Array<{
    id: string;
    stage: 'collection' | 'entry' | 'validation';
    stageLabel: string;
    orderId: number;
    patientName: string;
    priority: PriorityLevel;
    waitingHours: number;
    blockedReason?: string | null;
    blockedLabel?: string | null;
    queueTab: 'collection' | 'entry' | 'validation';
    since: string;
    workItemCount: number;
    orderTestIds: number[];
    attentionType: string;
  }>;
  attentionTotal: number;
  totalActive: number;
  computedAt?: string | null;
  todayPanel: {
    dayStartUtc: string;
    steps: Array<{
      step: 'collection' | 'entry' | 'validation';
      averageHours: number | null;
      sampleCount: number;
    }>;
  };
}

export const labCommandCenterAPI = {
  getCommandCenterBoard() {
    return apiClient.get<LabBoardResponse>('/lab/board');
  },
};

/**
 * Command Center React Query hooks.
 */

export function useLabCommandCenterQuery() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.commandCenter.board(),
    queryFn: () => labCommandCenterAPI.getCommandCenterBoard(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    refetchInterval: LAB_CONFIG.TAB_COUNT_REFRESH_MS,
  });
  return {
    board: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}

export interface LabPipelineCounts {
  collection: number;
  entry: number;
  /** Unvalidated tests in the review queue */
  validation: number;
  /** Escalations and recollection requests — validation tab badge only */
  supervisor: number;
}

export function getValidationTabCount(counts: LabPipelineCounts): number {
  return counts.validation + counts.supervisor;
}

const EMPTY_COUNTS: LabPipelineCounts = {
  collection: 0,
  entry: 0,
  validation: 0,
  supervisor: 0,
};

export function useLabStageQueueCounts() {
  const { board, isError, error, refetch } = useLabCommandCenterQuery();
  return {
    counts: board?.counts ?? EMPTY_COUNTS,
    isError,
    error,
    refetch,
  };
}
