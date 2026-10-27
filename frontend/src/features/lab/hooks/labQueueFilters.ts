/**
 * Lab queue filters: URL bar codec, client apply, and page wiring.
 *
 * Worklist tabs use a two-step pattern (avoids a worklist ↔ items cycle):
 * 1. `useLabQueueBarFilters(workflowType)` → `serverFilters` for the worklist API
 * 2. After items load → `useLabQueuePageFilters({ items, workflowType, bar })`
 */

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { PriorityLevel, SampleStatus, TestStatus } from '@/types';
import { isDateInInclusiveRange } from '@/utils';
import { LAB_CONFIG } from '../constants/labConstants';
import { compareQueuePriority } from '../utils/labQueue';
import {
  decodeLabQueueBarFilters,
  migrateLegacyLabEntitySearchParams,
  writeLabQueueBarFilters,
  type LabQueueBarFilters,
} from '../utils/labQueueUrlCodec';
import { resolveCollectionStatusFilters, worklistServerFilters } from '../utils/labSearchAndLinks';
import {
  getLabQueueStageConfig,
  type LabQueueItemByStage,
  type LabQueueWorkflowType,
} from '../utils/labQueueStageFilterConfig';
import type { LabQueueSecondaryFilterProfile } from '../utils/labQueueSecondaryProfiles';

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
}): T[] {
  let out = items;

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

/** Apply the active bar + shared filterState to a secondary validation list (escalations, recollections). */
export function applyLabQueueFiltersWithProfile<T, S extends LabQueueClientStatus>(
  items: T[],
  filterState: LabQueueFilterState<LabQueueClientStatus>,
  bar: LabQueueBarState,
  profile: LabQueueSecondaryFilterProfile<T, S>,
): T[] {
  const { callbacks, sortByPriority, applyStatusFilter = true } = profile;
  return applyLabQueueFilters<T, S>({
    items,
    filters: filterState as LabQueueFilterState<S>,
    getOrderDate: callbacks.getOrderDate,
    getSampleType: callbacks.getSampleType,
    getStatus: callbacks.getStatus,
    searchFilterFn: callbacks.searchFilterFn,
    sortByQueuePriority: sortByPriority,
    getPriority: callbacks.getPriority,
    getQueueSince: callbacks.getQueueSince,
    applyStatusFilter,
    skipSearchFilter: bar.skipSearchFilter,
    skipDateFilter: bar.skipDateFilter,
    skipSampleTypeFilter: bar.skipSampleTypeFilter,
  });
}

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
    const resolvedStatus: LabQueueClientStatus[] = bar.collectionSampleLookup
      ? (resolveCollectionStatusFilters(true, filterState.statusFilters as string[]) as LabQueueClientStatus[])
      : filterState.statusFilters;

    return {
      ...filterState,
      statusFilters: resolvedStatus,
    };
  }, [filterState, bar.collectionSampleLookup]);

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
        applyStatusFilter: true,
        skipSearchFilter: bar.skipSearchFilter,
        skipDateFilter: bar.skipDateFilter,
        skipSampleTypeFilter: bar.skipSampleTypeFilter,
      }),
    [items, filtersForApply, filterConfig, bar],
  );

  return { filteredItems, filterState };
}

function barFiltersFromUrl(
  searchParams: URLSearchParams,
  workflowType: LabQueueWorkflowType,
  defaultStatuses: readonly string[],
): LabQueueBarFilters {
  return decodeLabQueueBarFilters(searchParams, workflowType, defaultStatuses);
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

  const filterConfig = useMemo(() => getLabQueueStageConfig(workflowType), [workflowType]);

  const readBarFiltersFromUrl = (): LabQueueBarFilters => {
    const params = new URLSearchParams(searchParams);
    migrateLegacyLabEntitySearchParams(params);
    return barFiltersFromUrl(params, workflowType, filterConfig.defaultStatuses);
  };

  const [searchQuery, setSearchQuery] = useState(() => readBarFiltersFromUrl().searchQuery);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(
    () => readBarFiltersFromUrl().dateRange,
  );
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>(
    () => readBarFiltersFromUrl().sampleTypeFilters,
  );
  const [statusFilters, setStatusFilters] = useState<
    SampleStatus[] | TestStatus[] | PriorityLevel[]
  >(
    () =>
      [...readBarFiltersFromUrl().statusFilters] as
        SampleStatus[] | TestStatus[] | PriorityLevel[],
  );

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
  const legacyMigrateRef = useRef(false);

  useLayoutEffect(() => {
    if (legacyMigrateRef.current) return;
    legacyMigrateRef.current = true;
    setSearchParams(
      prev => {
        const params = new URLSearchParams(prev);
        if (!migrateLegacyLabEntitySearchParams(params)) {
          return prev;
        }
        skipUrlDecodeRef.current = true;
        return params;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (skipUrlDecodeRef.current) {
      skipUrlDecodeRef.current = false;
      return;
    }
    const next = barFiltersFromUrl(searchParams, workflowType, filterConfig.defaultStatuses);
    const searchInSyncWithUrl = searchQuery === debouncedSearch;
    /* eslint-disable react-hooks/set-state-in-effect -- URL back/forward and external edits */
    if (searchInSyncWithUrl) {
      setSearchQuery(next.searchQuery);
    }
    setDateRange(next.dateRange);
    setSampleTypeFilters(next.sampleTypeFilters);
    setStatusFilters(
      [...next.statusFilters] as SampleStatus[] | TestStatus[] | PriorityLevel[],
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams, workflowType, filterConfig.defaultStatuses, debouncedSearch, searchQuery]);

  useLayoutEffect(() => {
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
