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
}

export interface UseCommandCenterDataOptions {
  logsLimit?: number;
  logsHoursBack?: number;
}

export function useCommandCenterData(
  options: UseCommandCenterDataOptions = {}
): CommandCenterData {
  const { logsLimit = 50, logsHoursBack = 24 } = options;

  const { logs, isLoading: logsLoading } = useLabOperationLogs({
    limit: logsLimit,
    hoursBack: logsHoursBack,
  });
  const { data: distributionByStage, isLoading: distributionLoading } =
    useDistributionByStage();

  const isLoading = logsLoading || distributionLoading;

  return {
    isLoading,
    logs,
    distributionByStage,
  };
}
