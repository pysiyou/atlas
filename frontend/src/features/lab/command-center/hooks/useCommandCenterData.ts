/**
 * useCommandCenterData - Single facade for all Command Center data.
 * One loading state, one return type. Composes existing hooks; later replace with GET /lab/command-center if backend adds it.
 */

import { useLabOperationLogs } from './useLabOperationLogs';
import {
  useTestsReceivedAndValidatedByDay,
  useActivityByDay,
} from './useTestsReceivedByDay';
import type {
  TestsReceivedAndValidatedPoint,
  ActivityByDayPoint,
} from './useTestsReceivedByDay';
import { useDistributionByStage } from './useDistributionByStage';
import type { DistributionByStagePoint } from './useDistributionByStage';
import type { LabOperationRecord } from '@/types/lab-operations';

export interface CommandCenterData {
  isLoading: boolean;
  logs: LabOperationRecord[];
  receivedValidatedByDay: TestsReceivedAndValidatedPoint[];
  activityByDay: ActivityByDayPoint[];
  distributionByStage: DistributionByStagePoint[];
}

export interface UseCommandCenterDataOptions {
  lastDays?: number;
  logsLimit?: number;
  logsHoursBack?: number;
}

export function useCommandCenterData(
  options: UseCommandCenterDataOptions = {}
): CommandCenterData {
  const { lastDays = 10, logsLimit = 50, logsHoursBack = 24 } = options;

  const { logs, isLoading: logsLoading } = useLabOperationLogs({
    limit: logsLimit,
    hoursBack: logsHoursBack,
  });
  const { data: receivedValidatedByDay, isLoading: trendLoading } =
    useTestsReceivedAndValidatedByDay(lastDays);
  const { data: activityByDay, isLoading: activityLoading } =
    useActivityByDay(lastDays);
  const { data: distributionByStage, isLoading: distributionLoading } =
    useDistributionByStage();

  const isLoading =
    logsLoading || trendLoading || activityLoading || distributionLoading;

  return {
    isLoading,
    logs,
    receivedValidatedByDay,
    activityByDay,
    distributionByStage,
  };
}
