/**
 * Hook to fetch lab operation logs for the activity timeline
 */
import { useQuery } from '@tanstack/react-query';
import { auditAPI, type GetLogsParams } from '@/services/api/audit';
import type { LabOperationRecord } from '@/types/lab-operations';

export interface UseLabOperationLogsOptions extends GetLogsParams {
  enabled?: boolean;
}

export interface UseLabOperationLogsResult {
  logs: LabOperationRecord[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLabOperationLogs(
  options: UseLabOperationLogsOptions = {}
): UseLabOperationLogsResult {
  const { enabled = true, ...params } = options;

  const query = useQuery({
    queryKey: ['labOperationLogs', params],
    queryFn: () => auditAPI.getLogs(params),
    enabled,
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
    refetchInterval: 60_000, // Refetch every minute for near-realtime updates
  });

  return {
    logs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
