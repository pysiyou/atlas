/**
 * Loads audit events from the backend and resolves presentation rows.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTestNameLookup } from '@/features/catalog/api/tests';
import { queryKeys } from '@/lib/query';
import { fetchAuditEvents, type AuditEventQueryParams } from './api';
import { resolveEventLogItems, type ResolveEventLogOptions } from './resolveItem';
import type { EventLogFilter, EventLogRecord } from './types';

function filterToQueryParams(filter: EventLogFilter): AuditEventQueryParams {
  switch (filter.mode) {
    case 'order':
      return { orderId: filter.orderId, limit: filter.limit ?? 500 };
    case 'scope':
      return {
        targetType: filter.scope.targetType,
        targetId: filter.scope.targetId,
        limit: filter.limit ?? 200,
      };
    case 'recent':
      return { hours: filter.hours ?? 24, limit: filter.limit ?? 500 };
  }
}

function sortNewestFirst(events: EventLogRecord[]): EventLogRecord[] {
  return events
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export interface UseEventLogOptions {
  resolve?: ResolveEventLogOptions;
  enabled?: boolean;
}

export function useEventLog(filter: EventLogFilter, options?: UseEventLogOptions) {
  const params = useMemo(() => filterToQueryParams(filter), [filter]);
  const { getTestName } = useTestNameLookup();
  const resolveOptions = useMemo(
    () => ({
      ...options?.resolve,
      getTestName,
    }),
    [options?.resolve, getTestName],
  );
  const enabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: queryKeys.auditEvents.list(params as Record<string, string | number | undefined>),
    queryFn: () => fetchAuditEvents(params),
    enabled,
  });

  const events = useMemo(
    () => (query.data ? sortNewestFirst(query.data) : []),
    [query.data],
  );

  const resolved = useMemo(
    () => resolveEventLogItems(events, resolveOptions),
    [events, resolveOptions],
  );

  return {
    events,
    resolved,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof Error ? query.error : null,
    isEmpty: !query.isLoading && !query.isError && resolved.length === 0,
    refetch: () => {
      void query.refetch();
    },
  };
}
