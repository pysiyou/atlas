/**
 * Hook to fetch lab operation logs for the activity timeline.
 * Supports Load more (offset pagination) and total count; caps at MAX_ACCUMULATED_LOGS.
 */
import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditAPI, type GetLogsParams } from '@/services/api/audit';
import type { LabOperationRecord } from '@/types/lab-operations';

const MAX_ACCUMULATED_LOGS = 200;

export interface UseLabOperationLogsOptions extends GetLogsParams {
  enabled?: boolean;
}

export interface UseLabOperationLogsResult {
  logs: LabOperationRecord[];
  total: number | undefined;
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export function useLabOperationLogs(
  options: UseLabOperationLogsOptions = {}
): UseLabOperationLogsResult {
  const { enabled = true, limit = 50, ...restParams } = options;
  const params = { ...restParams, limit };

  const [offset, setOffset] = useState(0);
  const [accumulatedLogs, setAccumulatedLogs] = useState<LabOperationRecord[]>([]);

  const countParams = {
    hoursBack: params.hoursBack,
    operationType: params.operationType,
    entityType: params.entityType,
  };

  const countQuery = useQuery({
    queryKey: ['labOperationLogsCount', countParams],
    queryFn: () => auditAPI.getCount(countParams),
    enabled,
    staleTime: 60_000,
  });

  const logsQuery = useQuery({
    queryKey: ['labOperationLogs', { ...params, offset }],
    queryFn: () => auditAPI.getLogs({ ...params, offset }),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchInterval: offset === 0 ? 60_000 : false,
  });

  const total = countQuery.data;

  useEffect(() => {
    if (!logsQuery.isSuccess || logsQuery.data == null) return;
    const page = logsQuery.data;
    const apply = () => {
      if (offset === 0) {
        setAccumulatedLogs(page);
      } else {
        setAccumulatedLogs(prev => [...prev, ...page]);
      }
    };
    queueMicrotask(apply);
  }, [offset, logsQuery.isSuccess, logsQuery.dataUpdatedAt, logsQuery.data]);

  const refetch = useCallback(() => {
    setOffset(0);
    setAccumulatedLogs([]);
    countQuery.refetch();
    logsQuery.refetch();
  }, [countQuery, logsQuery]);

  const loadMore = useCallback(() => {
    setOffset(prev => prev + limit);
  }, [limit]);

  const hasMore =
    total !== undefined &&
    accumulatedLogs.length < total &&
    accumulatedLogs.length < MAX_ACCUMULATED_LOGS;

  return {
    logs: accumulatedLogs,
    total,
    isLoading: logsQuery.isLoading && offset === 0,
    isLoadingMore: offset > 0 && logsQuery.isFetching,
    isError: logsQuery.isError,
    error: logsQuery.error ?? null,
    refetch,
    loadMore,
    hasMore,
  };
}
