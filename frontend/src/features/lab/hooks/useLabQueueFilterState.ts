/**
 * useLabQueueFilterState - Shared filter state and apply logic for lab workflow views
 * Encapsulates date range, sample type, status, and search filtering.
 */

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { compareQueuePriority } from '../utils/labQueue';
import { getLabQueueSearchFromUrlFilters, resolveCollectionStatusFilters } from '../utils/labSearchAndLinks';
import type { UrlFilters } from '@/utils/filters';
import { isDateInInclusiveRange } from '@/utils';

/** Reads the `search` query param used for lab queue deep-links. */
export function useLabQueueUrlSearch(): string {
  const [searchParams] = useSearchParams();
  return searchParams.get('search') ?? '';
}

export interface UseLabQueueFilterStateOptions<T, S> {
  items: T[];
  getOrderDate: (item: T) => string | undefined;
  getSampleType: (item: T) => string | undefined;
  getStatus: (item: T) => S | undefined;
  searchFilterFn: (item: T, query: string) => boolean;
  initialStatusFilters?: S[];
  /** Pre-fill search from URL query param (e.g. cross-links from order detail). */
  initialSearchQuery?: string;
  /** Sort by priority (urgent first) then oldest queue timestamp. */
  sortByQueuePriority?: boolean;
  getPriority?: (item: T) => string | undefined;
  getQueueSince?: (item: T) => string | undefined;
  /** When set, search text is controlled by the parent (e.g. server-side sample lookup). */
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  /** Skip client-side search filtering when the server already applied the query. */
  skipSearchFilter?: boolean;
  /** When set, overrides `statusFilters` during apply (e.g. collection lookup vs queue). */
  appliedStatusFilters?: S[];
  /** Collection tab: historical sample search — show all statuses unless user filters. */
  collectionSampleLookup?: boolean;
  /** URL entity filters for targeting specific records */
  urlFilters?: UrlFilters;
  /** Get test/item ID for testId filtering */
  getId?: (item: T) => number | undefined;
  /** Get order ID for orderId filtering */
  getOrderId?: (item: T) => number | undefined;
  /** Get sample ID for sampleId filtering */
  getSampleId?: (item: T) => number | undefined;
  /** Collection tab: prefer sample display id in search when sampleId is in the URL */
  preferSampleInSearch?: boolean;
}

export interface LabQueueFilterState<S> {
  searchQuery: string;
  dateRange: [Date, Date] | null;
  sampleTypeFilters: string[];
  statusFilters: S[];
}

function applyDateRange<T>(
  out: T[],
  dateRange: [Date, Date] | null,
  getOrderDate: (item: T) => string | undefined
): T[] {
  if (!dateRange) return out;
  return out.filter(item => isDateInInclusiveRange(getOrderDate(item), dateRange));
}

/** Apply the same lab queue filters used by workflow views (search, date, sample type, priority). */
export function applyLabQueueFilters<T, S>({
  items,
  filters,
  getOrderDate,
  getSampleType,
  getStatus,
  searchFilterFn,
  sortByQueuePriority = false,
  getPriority,
  getQueueSince,
  applyStatusFilter = true,
  skipSearchFilter = false,
  urlFilters,
  getId,
  getOrderId,
  getSampleId,
}: {
  items: T[];
  filters: LabQueueFilterState<S>;
  getOrderDate: (item: T) => string | undefined;
  getSampleType: (item: T) => string | undefined;
  getStatus: (item: T) => S | undefined;
  searchFilterFn: (item: T, query: string) => boolean;
  sortByQueuePriority?: boolean;
  getPriority?: (item: T) => string | undefined;
  getQueueSince?: (item: T) => string | undefined;
  /** When false, priority/status filters are skipped (e.g. recollection requests without priority). */
  applyStatusFilter?: boolean;
  skipSearchFilter?: boolean;
  /** URL entity filters for targeting specific records */
  urlFilters?: UrlFilters;
  /** Get test/item ID for testId filtering */
  getId?: (item: T) => number | undefined;
  /** Get order ID for orderId filtering */
  getOrderId?: (item: T) => number | undefined;
  /** Get sample ID for sampleId filtering */
  getSampleId?: (item: T) => number | undefined;
}): T[] {
  let out = items;

  // Apply entity URL filters first - these are targeting filters that narrow to specific records
  if (urlFilters) {
    if (urlFilters.testId && getId) {
      const targetId = Number(urlFilters.testId);
      out = out.filter(item => getId(item) === targetId);
    }
    if (urlFilters.orderId && getOrderId) {
      const targetOrderId = Number(urlFilters.orderId);
      out = out.filter(item => getOrderId(item) === targetOrderId);
    }
    if (urlFilters.sampleId && getSampleId) {
      const targetSampleId = Number(urlFilters.sampleId);
      out = out.filter(item => getSampleId(item) === targetSampleId);
    }
  }
  out = applyDateRange(out, filters.dateRange, getOrderDate);
  if (filters.sampleTypeFilters.length > 0) {
    out = out.filter(item => {
      const st = getSampleType(item);
      return st && filters.sampleTypeFilters.includes(st);
    });
  }
  if (applyStatusFilter && filters.statusFilters.length > 0) {
    out = out.filter(item => {
      const s = getStatus(item);
      return s != null && filters.statusFilters.includes(s);
    });
  }
  if (!skipSearchFilter && filters.searchQuery.trim()) {
    out = out.filter(item => searchFilterFn(item, filters.searchQuery));
  }
  if (sortByQueuePriority && getPriority && getQueueSince) {
    out = [...out].sort((a, b) =>
      compareQueuePriority(getPriority(a), getPriority(b), getQueueSince(a), getQueueSince(b))
    );
  }
  return out;
}

export function useLabQueueFilterState<T, S>({
  items,
  getOrderDate,
  getSampleType,
  getStatus,
  searchFilterFn,
  initialStatusFilters = [],
  initialSearchQuery = '',
  sortByQueuePriority = false,
  getPriority,
  getQueueSince,
  searchQuery: controlledSearchQuery,
  onSearchChange: controlledOnSearchChange,
  skipSearchFilter = false,
  appliedStatusFilters,
  collectionSampleLookup = false,
  urlFilters,
  getId,
  getOrderId,
  getSampleId,
  preferSampleInSearch = false,
}: UseLabQueueFilterStateOptions<T, S>) {
  const searchFromEntityFilter = useMemo(
    () => getLabQueueSearchFromUrlFilters(urlFilters, initialSearchQuery, preferSampleInSearch),
    [urlFilters, initialSearchQuery, preferSampleInSearch]
  );

  const [internalSearchQuery, setInternalSearchQuery] = useState(searchFromEntityFilter);
  const searchQuery = controlledSearchQuery ?? internalSearchQuery;
  const setSearchQuery = controlledOnSearchChange ?? setInternalSearchQuery;
  
  // Sync internal search when entity filter from URL changes (including when cleared)
  // This ensures clearing URL filter badges also clears the auto-filled search
  useEffect(() => {
    // Only update if NOT controlled by parent (parent controls during sample lookup mode)
    if (controlledSearchQuery === undefined) {
      // Queue microtask to avoid render-phase setState
      queueMicrotask(() => {
        setInternalSearchQuery(searchFromEntityFilter);
      });
    }
  }, [searchFromEntityFilter, controlledSearchQuery]);
  
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<S[]>(initialStatusFilters);

  const filterState = useMemo<LabQueueFilterState<S>>(
    () => ({
      searchQuery,
      dateRange,
      sampleTypeFilters,
      statusFilters,
    }),
    [searchQuery, dateRange, sampleTypeFilters, statusFilters]
  );

  const filtersForApply = useMemo((): LabQueueFilterState<S> => {
    // When entity URL filters are active, treat like sample lookup mode - clear default status filters
    const hasEntityFilters = urlFilters && (urlFilters.testId || urlFilters.orderId || urlFilters.sampleId);
    const isLookupMode = collectionSampleLookup || hasEntityFilters;
    
    const resolvedStatus: S[] = isLookupMode
      ? (resolveCollectionStatusFilters(
          true,
          filterState.statusFilters as string[]
        ) as S[])
      : (appliedStatusFilters ?? filterState.statusFilters);
    return {
      ...filterState,
      statusFilters: resolvedStatus,
    };
  }, [filterState, appliedStatusFilters, collectionSampleLookup, urlFilters]);

  const filteredItems = useMemo(
    () =>
      applyLabQueueFilters({
        items,
        filters: filtersForApply,
        getOrderDate,
        getSampleType,
        getStatus,
        searchFilterFn,
        sortByQueuePriority,
        getPriority,
        getQueueSince,
        urlFilters,
        getId,
        getOrderId,
        getSampleId,
        applyStatusFilter: true,
        skipSearchFilter,
      }),
    [
      items,
      filtersForApply,
      getOrderDate,
      getSampleType,
      getStatus,
      searchFilterFn,
      sortByQueuePriority,
      getPriority,
      getQueueSince,
      skipSearchFilter,
      urlFilters,
      getId,
      getOrderId,
      getSampleId,
    ]
  );

  return {
    filteredItems,
    filterState,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters,
    setStatusFilters,
  };
}
