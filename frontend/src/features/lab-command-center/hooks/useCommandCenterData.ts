/**
 * useCommandCenterData - Single facade for Command Center data.
 * Composes distribution-by-stage + audit logs into one loading state.
 */

import { useLabOperationLogs } from './useLabOperationLogs';
import { useDistributionByStage } from './useDistributionByStage';
import type { DistributionByStagePoint } from './useDistributionByStage';
import type { LabOperationRecord } from '@/types/lab-operations';

export interface CommandCenterData {
  isLoading: boolean;
  logs: LabOperationRecord[];
  distributionByStage: DistributionByStagePoint[];
  logsError: boolean;
  logsErrorDetail: Error | null;
  refetchLogs: () => void;
  logsTotal: number | undefined;
  logsHasMore: boolean;
  logsLoadMore: () => void;
  logsLoadingMore: boolean;
}

export interface UseCommandCenterDataOptions {
  logsLimit?: number;
  logsHoursBack?: number;
}

export function useCommandCenterData(options: UseCommandCenterDataOptions = {}): CommandCenterData {
  const { logsLimit = 50, logsHoursBack = 24 } = options;

  const {
    logs,
    total: logsTotal,
    isLoading: logsLoading,
    isLoadingMore: logsLoadingMore,
    isError: logsError,
    error: logsErrorDetail,
    refetch: refetchLogs,
    loadMore: logsLoadMore,
    hasMore: logsHasMore,
  } = useLabOperationLogs({
    limit: logsLimit,
    hoursBack: logsHoursBack,
  });
  const { data: distributionByStage, isLoading: distributionLoading } = useDistributionByStage();

  const isLoading = logsLoading || distributionLoading;

  return {
    isLoading,
    logs,
    distributionByStage,
    logsError,
    logsErrorDetail: logsErrorDetail ?? null,
    refetchLogs,
    logsTotal,
    logsHasMore,
    logsLoadMore,
    logsLoadingMore,
  };
}
