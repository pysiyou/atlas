/**
 * Loads audit events from the backend and resolves presentation rows.
 * Supports newest-first cursor pagination via loadMore().
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
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
    scope: query.scope,
    orderId: query.orderId,
    patientId: query.patientId,
    testId: query.testId,
    sampleId: query.sampleId,
    hours: query.createdFrom ? undefined : query.hours,
    createdFrom: query.createdFrom,
    createdTo: query.createdTo,
    includeAccess: query.includeAccess ? true : undefined,
    eventScope: query.eventScope,
    cursorCreatedAt: query.cursorCreatedAt,
    cursorEventId: query.cursorEventId,
    actorId: query.actorId,
    limit: query.limit ?? 500,
  };
  if (query.kinds?.length) {
    params.kinds = query.kinds.join(',');
  }
  if (query.actorRoles?.length) {
    params.actorRoles = query.actorRoles.join(',');
  }
  if (query.actorSearch) {
    params.actorSearch = query.actorSearch;
  }
  return params;
}

function sortNewestFirst(events: EventLogRecord[]): EventLogRecord[] {
  return events
    .slice()
    .sort((a, b) => {
      const byTime = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (byTime !== 0) return byTime;
      return b.eventId.localeCompare(a.eventId);
    });
}

export interface UseEventLogOptions {
  resolve?: ResolveEventLogOptions;
  enabled?: boolean;
}

export function useEventLog(query: EventLogQuery, options?: UseEventLogOptions) {
  const params = useMemo(() => queryToApiParams({ ...query, cursorCreatedAt: undefined, cursorEventId: undefined }), [query]);
  const keyParams = useMemo(
    () => eventLogQueryKeyParams({ ...query, cursorCreatedAt: undefined, cursorEventId: undefined }),
    [query]
  );
  const { getTestName } = useTestNameLookup();
  const { getPatientName: lookupPatientName } = usePatientNameLookup();
  const resolveOptions = useMemo(
    () => ({
      ...options?.resolve,
      getTestName,
      getPatientName: (patientId: number) => lookupPatientName(patientId),
      showEventTypeInMeta:
        options?.resolve?.showEventTypeInMeta ?? query.verbosity === 'debug',
      includeDebugPayload: query.verbosity === 'debug',
    }),
    [options?.resolve, getTestName, lookupPatientName, query.verbosity]
  );
  const enabled = options?.enabled ?? true;
  const pageLimit = query.limit ?? 500;

  const queryResult = useQuery({
    queryKey: queryKeys.auditEvents.list(keyParams),
    queryFn: () => fetchAuditEvents(params),
    enabled,
  });

  const [olderPages, setOlderPages] = useState<EventLogRecord[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const queryIdentity = useMemo(() => JSON.stringify(keyParams), [keyParams]);

  useEffect(() => {
    setOlderPages([]);
  }, [queryIdentity]);

  useEffect(() => {
    if (!queryResult.data) {
      setHasMore(false);
      return;
    }
    setHasMore(queryResult.data.length >= pageLimit);
  }, [queryResult.data, pageLimit, queryIdentity]);

  const events = useMemo(
    () => sortNewestFirst([...(queryResult.data ?? []), ...olderPages]),
    [queryResult.data, olderPages]
  );

  const resolved = useMemo(
    () => resolveEventLogItems(events, resolveOptions),
    [events, resolveOptions]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingMore || events.length === 0) return;
    const oldest = events[events.length - 1];
    setIsFetchingMore(true);
    try {
      const more = await fetchAuditEvents({
        ...params,
        cursorCreatedAt: oldest.createdAt,
        cursorEventId: oldest.eventId,
      });
      setOlderPages(prev => [...prev, ...more]);
      setHasMore(more.length >= pageLimit);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, events, params, pageLimit]);

  return {
    events,
    resolved,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error instanceof Error ? queryResult.error : null,
    isEmpty: !queryResult.isLoading && !queryResult.isError && resolved.length === 0,
    hasMore,
    isFetchingMore,
    loadMore,
    refetch: () => {
      void queryResult.refetch();
    },
  };
}
