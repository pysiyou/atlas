/**
 * Debounced audit search preview (intent suggestions + event count).
 */
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { fetchAuditSearchPreview } from './api';

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useEventLogSearchPreview(draftQuery: string) {
  const trimmed = draftQuery.trim();
  const debouncedQ = useDebouncedValue(trimmed, 300);
  const query = useQuery({
    queryKey: queryKeys.auditEvents.searchPreview(debouncedQ),
    queryFn: () => fetchAuditSearchPreview(debouncedQ),
    enabled: debouncedQ.length > 0,
    staleTime: 30_000,
  });

  /** Only show server preview when it matches what the user sees (debounce caught up). */
  const previewInSync = debouncedQ === trimmed && debouncedQ.length > 0;

  const preview = useMemo(() => {
    if (!previewInSync) return undefined;
    return query.data;
  }, [previewInSync, query.data]);

  const isRefreshingPreview = previewInSync && query.isFetching;

  return {
    preview,
    isFetching: isRefreshingPreview,
    isError: query.isError,
    debouncedQ,
    previewInSync,
  };
}
