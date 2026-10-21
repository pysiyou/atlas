/**
 * Lab queue filters: URL bar codec, client apply, and page wiring.
 *
 * Worklist tabs use a two-step pattern (avoids a worklist ↔ items cycle):
 * 1. `useLabQueueBarFilters(workflowType)` → `serverFilters` for the worklist API
 * 2. After items load → `useLabQueuePageFilters({ items, workflowType, bar })`
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePageFilters } from '@/hooks';
import type { PriorityLevel, SampleStatus, TestStatus } from '@/types';
import { isDateInInclusiveRange } from '@/utils';
import type { UrlFilters } from '@/utils/filters';
import { LAB_CONFIG } from '../constants/labConstants';
import { LAB_URL_FILTER_KEYS } from '../constants/labFilterConfigs';
import { compareQueuePriority } from '../utils/labQueue';
import {
  decodeLabQueueBarFilters,
  writeLabQueueBarFilters,
  type LabQueueBarFilters,
} from '../utils/labQueueUrlCodec';
import {
  getLabQueueSearchFromUrlFilters,
  hasActiveRecordUrlFilters,
  resolveCollectionStatusFilters,
  worklistServerFilters,
} from '../utils/labSearchAndLinks';
import {
  getLabQueueStageConfig,
  type LabQueueItemByStage,
  type LabQueueWorkflowType,
} from '../utils/labQueueStageFilterConfig';

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
  skipDateFilter = false,
  skipSampleTypeFilter = false,
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
  skipDateFilter?: boolean;
  skipSampleTypeFilter?: boolean;
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
  if (!skipDateFilter) {
    out = applyDateRange(out, filters.dateRange, getOrderDate);
  }
  if (!skipSampleTypeFilter && filters.sampleTypeFilters.length > 0) {
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

type LabQueueClientStatus = SampleStatus | TestStatus | PriorityLevel;

function useLabQueueFilteredItems<T extends LabQueueWorkflowType>(
  items: LabQueueItemByStage<T>[],
  bar: LabQueueBarState,
  workflowType: T,
): { filteredItems: LabQueueItemByStage<T>[]; filterState: LabQueueFilterState<LabQueueClientStatus> } {
  const filterConfig = useMemo(() => getLabQueueStageConfig(workflowType), [workflowType]);

  const filterState = useMemo<LabQueueFilterState<LabQueueClientStatus>>(
    () => ({
      searchQuery: bar.searchQuery,
      dateRange: bar.dateRange,
      sampleTypeFilters: bar.sampleTypeFilters,
      statusFilters: bar.statusFilters as LabQueueClientStatus[],
    }),
    [bar],
  );

  const filtersForApply = useMemo((): LabQueueFilterState<LabQueueClientStatus> => {
    const hasEntityFilters =
      bar.urlFilters &&
      (bar.urlFilters.testId || bar.urlFilters.orderId || bar.urlFilters.sampleId);
    const isLookupMode = bar.collectionSampleLookup || Boolean(hasEntityFilters);

    const resolvedStatus: LabQueueClientStatus[] = isLookupMode
      ? (resolveCollectionStatusFilters(true, filterState.statusFilters as string[]) as LabQueueClientStatus[])
      : filterState.statusFilters;

    return {
      ...filterState,
      statusFilters: resolvedStatus,
    };
  }, [filterState, bar.collectionSampleLookup, bar.urlFilters]);

  const filteredItems = useMemo(
    () =>
      applyLabQueueFilters<LabQueueItemByStage<T>, LabQueueClientStatus>({
        items,
        filters: filtersForApply,
        getOrderDate: filterConfig.callbacks.getOrderDate as (item: LabQueueItemByStage<T>) => string | undefined,
        getSampleType: filterConfig.callbacks.getSampleType as (item: LabQueueItemByStage<T>) => string | undefined,
        getStatus: filterConfig.callbacks.getStatus as (item: LabQueueItemByStage<T>) => LabQueueClientStatus | undefined,
        searchFilterFn: filterConfig.callbacks.searchFilterFn as (
          item: LabQueueItemByStage<T>,
          query: string,
        ) => boolean,
        sortByQueuePriority: filterConfig.sortByPriority,
        getPriority: filterConfig.callbacks.getPriority as (item: LabQueueItemByStage<T>) => string | undefined,
        getQueueSince: filterConfig.callbacks.getQueueSince as (item: LabQueueItemByStage<T>) => string | undefined,
        urlFilters: bar.urlFilters,
        getId: filterConfig.callbacks.getId as ((item: LabQueueItemByStage<T>) => number | undefined) | undefined,
        getOrderId: filterConfig.callbacks.getOrderId as (item: LabQueueItemByStage<T>) => number | undefined,
        getSampleId: filterConfig.callbacks.getSampleId as
          | ((item: LabQueueItemByStage<T>) => number | undefined)
          | undefined,
        applyStatusFilter: true,
        skipSearchFilter: bar.skipSearchFilter,
        skipDateFilter: bar.skipDateFilter,
        skipSampleTypeFilter: bar.skipSampleTypeFilter,
      }),
    [items, filtersForApply, filterConfig, bar],
  );

  return { filteredItems, filterState };
}

function initialBarFiltersFromUrl(
  searchParams: URLSearchParams,
  workflowType: LabQueueWorkflowType,
  urlFilters: UrlFilters,
  defaultStatuses: readonly string[],
): LabQueueBarFilters {
  const decoded = decodeLabQueueBarFilters(searchParams, workflowType, defaultStatuses);
  const searchQuery = hasActiveRecordUrlFilters(urlFilters)
    ? getLabQueueSearchFromUrlFilters(
        urlFilters,
        decoded.searchQuery,
        workflowType === 'collection',
      )
    : decoded.searchQuery;
  return { ...decoded, searchQuery };
}

export interface LabQueueBarState {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  dateRange: [Date, Date] | null;
  setDateRange: (value: [Date, Date] | null) => void;
  sampleTypeFilters: string[];
  setSampleTypeFilters: (value: string[]) => void;
  statusFilters: SampleStatus[] | TestStatus[] | PriorityLevel[];
  setStatusFilters: (value: SampleStatus[] | TestStatus[] | PriorityLevel[]) => void;
  urlFilters: UrlFilters;
  clearUrlFilters: () => void;
  setUrlFilter: (key: (typeof LAB_URL_FILTER_KEYS)[number], value: string | number | undefined) => void;
  debouncedSearch: string;
  trimmedSearch: string;
  isSampleLookup: boolean;
  isLookupBelowMin: boolean;
  serverFilters: ReturnType<typeof worklistServerFilters>;
  skipSearchFilter: boolean;
  skipDateFilter: boolean;
  skipSampleTypeFilter: boolean;
  collectionSampleLookup: boolean;
}

/** Filter bar + URL state and worklist query params (no item list required). */
export function useLabQueueBarFilters(workflowType: LabQueueWorkflowType): LabQueueBarState {
  const [searchParams, setSearchParams] = useSearchParams();
  const { urlFilters, clearUrlFilters, setUrlFilter } = usePageFilters({
    urlFilterKeys: LAB_URL_FILTER_KEYS,
  });

  const filterConfig = useMemo(() => getLabQueueStageConfig(workflowType), [workflowType]);
  const initialBarRef = useRef<LabQueueBarFilters | null>(null);
  if (initialBarRef.current === null) {
    initialBarRef.current = initialBarFiltersFromUrl(
      searchParams,
      workflowType,
      urlFilters,
      filterConfig.defaultStatuses,
    );
  }

  const [searchQuery, setSearchQuery] = useState(() => initialBarRef.current!.searchQuery);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(
    () => initialBarRef.current!.dateRange,
  );
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>(
    () => initialBarRef.current!.sampleTypeFilters,
  );
  const [statusFilters, setStatusFilters] = useState<
    SampleStatus[] | TestStatus[] | PriorityLevel[]
  >(() => [...initialBarRef.current!.statusFilters] as SampleStatus[] | TestStatus[] | PriorityLevel[]);

  const debouncedSearch = useDebouncedValue(searchQuery, LAB_CONFIG.SEARCH_DEBOUNCE_MS);
  const trimmedSearch = debouncedSearch.trim();
  const isSampleLookup =
    workflowType === 'collection' &&
    trimmedSearch.length >= LAB_CONFIG.SAMPLE_LOOKUP_MIN_CHARS;
  const isLookupBelowMin =
    workflowType === 'collection' &&
    trimmedSearch.length > 0 &&
    trimmedSearch.length < LAB_CONFIG.SAMPLE_LOOKUP_MIN_CHARS;

  const serverFilters = useMemo(
    () =>
      worklistServerFilters({
        search:
          workflowType === 'collection'
            ? isSampleLookup
              ? trimmedSearch
              : undefined
            : trimmedSearch || undefined,
        dateRange,
        sampleTypeFilters,
      }),
    [workflowType, isSampleLookup, trimmedSearch, dateRange, sampleTypeFilters],
  );

  const skipSearchFilter =
    workflowType === 'collection' ? isSampleLookup : true;
  const skipDateFilter = true;
  const skipSampleTypeFilter = true;
  const collectionSampleLookup = workflowType === 'collection' && isSampleLookup;

  const skipUrlDecodeRef = useRef(false);
  const persistSkipRef = useRef(true);

  useEffect(() => {
    if (skipUrlDecodeRef.current) {
      skipUrlDecodeRef.current = false;
      return;
    }
    const next = initialBarFiltersFromUrl(
      searchParams,
      workflowType,
      urlFilters,
      filterConfig.defaultStatuses,
    );
    /* eslint-disable react-hooks/set-state-in-effect -- URL back/forward and external edits */
    setSearchQuery(next.searchQuery);
    setDateRange(next.dateRange);
    setSampleTypeFilters(next.sampleTypeFilters);
    setStatusFilters(
      [...next.statusFilters] as SampleStatus[] | TestStatus[] | PriorityLevel[],
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams, urlFilters, workflowType, filterConfig.defaultStatuses]);

  useEffect(() => {
    const urlSearch = searchParams.get('search') ?? '';
    const preferSample = workflowType === 'collection';
    if (hasActiveRecordUrlFilters(urlFilters)) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- entity deep-link → search field */
      setSearchQuery(getLabQueueSearchFromUrlFilters(urlFilters, urlSearch, preferSample));
      return;
    }
    if (searchQuery !== debouncedSearch) {
      return;
    }
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- URL search param without entity filters */
    setSearchQuery(urlSearch);
  }, [urlFilters, searchParams, workflowType, debouncedSearch, searchQuery]);

  useEffect(() => {
    if (persistSkipRef.current) {
      persistSkipRef.current = false;
      return;
    }
    skipUrlDecodeRef.current = true;
    setSearchParams(
      prev => {
        const params = new URLSearchParams(prev);
        writeLabQueueBarFilters(
          params,
          {
            searchQuery: debouncedSearch,
            dateRange,
            sampleTypeFilters,
            statusFilters: statusFilters as string[],
          },
          workflowType,
        );
        return params;
      },
      { replace: true },
    );
  }, [
    debouncedSearch,
    dateRange,
    sampleTypeFilters,
    statusFilters,
    workflowType,
    setSearchParams,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters,
    setStatusFilters,
    urlFilters,
    clearUrlFilters,
    setUrlFilter,
    debouncedSearch,
    trimmedSearch,
    isSampleLookup,
    isLookupBelowMin,
    serverFilters,
    skipSearchFilter,
    skipDateFilter,
    skipSampleTypeFilter,
    collectionSampleLookup,
  };
}

export interface LabQueueFilterBarPropsOptions {
  statusFilterKey?: 'status' | 'priority';
}

/** Props for {@link LabQueueFilters} from {@link useLabQueueBarFilters} state. */
export function useLabQueueFilterBarProps(
  bar: LabQueueBarState,
  options?: LabQueueFilterBarPropsOptions,
) {
  const statusFilterKey = options?.statusFilterKey ?? 'status';
  return useMemo(
    () => ({
      searchQuery: bar.searchQuery,
      onSearchChange: bar.setSearchQuery,
      dateRange: bar.dateRange,
      onDateRangeChange: bar.setDateRange,
      sampleTypeFilters: bar.sampleTypeFilters,
      onSampleTypeFiltersChange: bar.setSampleTypeFilters,
      statusFilters: bar.statusFilters,
      onStatusFiltersChange: bar.setStatusFilters,
      statusFilterKey,
    }),
    [bar, statusFilterKey],
  );
}

export interface UseLabQueuePageFiltersOptions<T extends LabQueueWorkflowType> {
  items: LabQueueItemByStage<T>[];
  workflowType: T;
  bar: LabQueueBarState;
}

export function useLabQueuePageFilters<T extends LabQueueWorkflowType>({
  items,
  workflowType,
  bar,
}: UseLabQueuePageFiltersOptions<T>) {
  const { filteredItems, filterState } = useLabQueueFilteredItems(items, bar, workflowType);

  return {
    ...bar,
    filteredItems,
    filterState,
  };
}
