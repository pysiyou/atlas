/**
 * Shared dashboard query for command center metric panels.
 */

import React, { createContext, useContext, useState } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import {
  commandCenterAPI,
  type CommandCenterDashboardResponse,
} from '../api/commandCenter.api';
import { TimeRangeSelect } from './components/TimeRangeSelect';
import {
  DEFAULT_TIME_RANGE,
  type CommandCenterTimeRange,
  getTimeRangeMeta,
  timeRangeToHours,
} from './timeRange';

export function useCommandCenterDashboard(params?: {
  hours_back?: number;
}): UseQueryResult<CommandCenterDashboardResponse> {
  const hoursBack = params?.hours_back ?? timeRangeToHours(DEFAULT_TIME_RANGE);

  return useQuery<CommandCenterDashboardResponse>({
    queryKey: queryKeys.commandCenter.dashboard({ hours_back: hoursBack }),
    queryFn: async () => {
      const result = await commandCenterAPI.getDashboard({ hours_back: hoursBack });
      if (!result) throw new Error('No data returned from command center dashboard');
      return result;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

interface CommandCenterDashboardContextValue extends UseQueryResult<CommandCenterDashboardResponse> {
  timeRange: CommandCenterTimeRange;
  setTimeRange: (range: CommandCenterTimeRange) => void;
  hoursBack: number;
}

const CommandCenterDashboardContext = createContext<CommandCenterDashboardContextValue | null>(
  null
);

export function CommandCenterDashboardProvider({ children }: { children: React.ReactNode }) {
  const [timeRange, setTimeRange] = useState<CommandCenterTimeRange>(DEFAULT_TIME_RANGE);
  const hoursBack = timeRangeToHours(timeRange);
  const query = useCommandCenterDashboard({ hours_back: hoursBack });

  const value: CommandCenterDashboardContextValue = {
    ...query,
    timeRange,
    setTimeRange,
    hoursBack,
  };

  return (
    <CommandCenterDashboardContext.Provider value={value}>
      {children}
    </CommandCenterDashboardContext.Provider>
  );
}

export function useCommandCenterDashboardContext(): CommandCenterDashboardContextValue {
  const context = useContext(CommandCenterDashboardContext);
  if (!context) {
    throw new Error('useCommandCenterDashboardContext must be used within CommandCenterDashboardProvider');
  }
  return context;
}

export function usePanelTimeRangeHeader() {
  const { timeRange, setTimeRange } = useCommandCenterDashboardContext();

  return {
    meta: getTimeRangeMeta(timeRange),
    headerActions: (
      <TimeRangeSelect value={timeRange} onChange={setTimeRange} />
    ),
  };
}

export { DEFAULT_TIME_RANGE };
