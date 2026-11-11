/**
 * Lab queue URL bar state (codec already in `labQueueUrlCodec`).
 */

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { PriorityLevel, SampleStatus, TestStatus } from '@/types';
import { LAB_CONFIG } from '../constants/labConstants';
import {
  decodeLabQueueBarFilters,
  migrateLegacyLabEntitySearchParams,
  writeLabQueueBarFilters,
  type LabQueueBarFilters,
} from '../utils/labQueueUrlCodec';
import { worklistServerFilters } from '../utils/labSearchAndLinks';
import {
  getLabQueueStageConfig,
  type LabQueueWorkflowType,
} from '../utils/labQueueStageFilterConfig';

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
