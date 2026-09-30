/**
 * Lab monitor API — board snapshot and summary for tab badges.
 */
import { apiClient } from '@/lib/api/client';
import type { components } from '@/lib/api/types/generated/api';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/authStore';
import { queryKeys, cacheConfig } from '@/lib/query';
import { LAB_CONFIG } from '../constants';
import { useEffect, useState } from 'react';

export type LabBoardResponse = components['schemas']['LabBoardResponse'];

export interface LabBoardSummaryResponse {
  counts: components['schemas']['LabBoardCounts'];
  health: LabBoardResponse['health'];
  healthMessage: string;
  suggestedTab?: string | null;
  totalActive: number;
  computedAt?: string | null;
  todayPanel: LabBoardResponse['todayPanel'];
}

export const labMonitorAPI = {
  getBoardSummary() {
    return apiClient.get<LabBoardSummaryResponse>('/lab/board/summary');
  },
  getBoardFull() {
    return apiClient.get<LabBoardResponse>('/lab/board', { detail: 'full' });
  },
};

function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );
  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  return visible;
}

function summaryPollInterval(visible: boolean): number | false {
  if (!visible) return false;
  return LAB_CONFIG.TAB_COUNT_REFRESH_MS * 2;
}

function fullBoardPollInterval(visible: boolean, monitorTabActive: boolean): number | false {
  if (!visible || !monitorTabActive) return false;
  return LAB_CONFIG.TAB_COUNT_REFRESH_MS;
}

export function useLabMonitorSummaryQuery() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const visible = useDocumentVisible();
  const query = useQuery({
    queryKey: queryKeys.labMonitor.boardSummary(),
    queryFn: () => labMonitorAPI.getBoardSummary(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    refetchInterval: summaryPollInterval(visible),
  });
  return {
    summary: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useLabMonitorBoardQuery(options?: { enabled?: boolean }) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const visible = useDocumentVisible();
  const monitorActive = options?.enabled ?? true;
  const query = useQuery({
    queryKey: queryKeys.labMonitor.boardFull(),
    queryFn: () => labMonitorAPI.getBoardFull(),
    enabled: isAuthenticated && !isRestoring && monitorActive,
    ...cacheConfig.dynamic,
    refetchInterval: fullBoardPollInterval(visible, monitorActive),
  });
  return {
    board: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** @deprecated Use useLabMonitorBoardQuery */
export const useLabCommandCenterQuery = useLabMonitorBoardQuery;

export interface LabPipelineCounts {
  collection: number;
  entry: number;
  validation: number;
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
  const { summary, isError, error, refetch } = useLabMonitorSummaryQuery();
  return {
    counts: summary?.counts ?? EMPTY_COUNTS,
    isError,
    error,
    refetch,
  };
}
