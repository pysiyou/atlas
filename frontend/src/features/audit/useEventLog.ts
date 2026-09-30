/**
 * Loads audit events from the backend and resolves presentation rows.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTestNameLookup } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { queryKeys } from '@/lib/query';
import { eventLogQueryKeyParams } from './buildEventLogQuery';
import { fetchAuditEvents, type AuditEventQueryParams } from './api';
import { resolveEventLogItems, type ResolveEventLogOptions } from './resolveItem';
import type { EventLogQuery, EventLogRecord } from './types';

function queryToApiParams(query: EventLogQuery): AuditEventQueryParams {
  const params: AuditEventQueryParams = {
    orderId: query.orderId,
    patientId: query.patientId,
    targetType: query.targetType,
    targetId: query.targetId,
    testId: query.testId,
    hours: query.createdFrom ? undefined : query.hours,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
    limit: query.limit ?? 500,
  };
  if (query.categories?.length) {
    params.categories = query.categories.join(',');
  }
  return params;
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

export function useEventLog(query: EventLogQuery, options?: UseEventLogOptions) {
  const params = useMemo(() => queryToApiParams(query), [query]);
  const keyParams = useMemo(() => eventLogQueryKeyParams(query), [query]);
  const { getTestName } = useTestNameLookup();
  const { getPatientName: lookupPatientName } = usePatientNameLookup();
  const resolveOptions = useMemo(
    () => ({
      ...options?.resolve,
      getTestName,
      getPatientName: (patientId: number) => lookupPatientName(patientId),
    }),
    [options?.resolve, getTestName, lookupPatientName]
  );
  const enabled = options?.enabled ?? true;

  const queryResult = useQuery({
    queryKey: queryKeys.auditEvents.list(keyParams),
    queryFn: () => fetchAuditEvents(params),
    enabled,
  });

  const events = useMemo(
    () => (queryResult.data ? sortNewestFirst(queryResult.data) : []),
    [queryResult.data]
  );

  const resolved = useMemo(
    () => resolveEventLogItems(events, resolveOptions),
    [events, resolveOptions]
  );

  return {
    events,
    resolved,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error instanceof Error ? queryResult.error : null,
    isEmpty: !queryResult.isLoading && !queryResult.isError && resolved.length === 0,
    refetch: () => {
      void queryResult.refetch();
    },
  };
}
