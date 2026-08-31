/**
 * Fetches audit logs related to a specific order or sample entity.
 * Client-filters broader audit fetches since the API has no entity_id param.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '@/features/lab/command-center/audit.api';
import type { LabOperationRecord } from '@/types/lab-operations';

export interface UseEntityAuditLogsOptions {
  entityType: 'order' | 'sample';
  entityId: number;
  relatedTestIds?: number[];
  relatedSampleIds?: number[];
  hoursBack?: number;
  enabled?: boolean;
}

function matchesEntity(
  log: LabOperationRecord,
  options: UseEntityAuditLogsOptions
): boolean {
  const { entityType, entityId, relatedTestIds = [], relatedSampleIds = [] } = options;

  if (log.entityType === entityType && log.entityId === entityId) {
    return true;
  }

  if (log.entityType === 'sample' && relatedSampleIds.includes(log.entityId)) {
    return true;
  }

  if (
    (log.entityType === 'test' || log.entityType === 'order_test') &&
    relatedTestIds.includes(log.entityId)
  ) {
    return true;
  }

  const opOrderId = log.operationData?.orderId ?? log.operationData?.order_id;
  if (entityType === 'order' && Number(opOrderId) === entityId) {
    return true;
  }

  return false;
}

export function useEntityAuditLogs(options: UseEntityAuditLogsOptions) {
  const { hoursBack = 168, enabled = true } = options;

  const query = useQuery({
    queryKey: [
      'entityAuditLogs',
      options.entityType,
      options.entityId,
      options.relatedTestIds,
      options.relatedSampleIds,
      hoursBack,
    ],
    queryFn: () => auditAPI.getLogs({ hoursBack, limit: 500 }),
    enabled,
    staleTime: 60_000,
  });

  const logs = useMemo(() => {
    if (!query.data) return [];
    return query.data
      .filter(log => matchesEntity(log, options))
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  }, [query.data, options]);

  return {
    logs,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
