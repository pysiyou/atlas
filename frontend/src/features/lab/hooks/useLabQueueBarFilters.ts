/**
 * Lab queue URL bar state and worklist query params (no item list required).
 */
import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@/hooks';
import type { PriorityLevel, SampleStatus, TestStatus } from '@/types';
import { LAB_CONFIG } from '../constants/labConstants';
import {
  decodeLabQueueBarFilters,
  writeLabQueueBarFilters,
  type LabQueueBarFilters,
} from '../utils/labQueueUrlCodec';
import { resolveCollectionStatusFilters, worklistServerFilters } from '../utils/labSearchAndLinks';
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
  priorityGroupFilters: string[];
  setPriorityGroupFilters: (value: string[]) => void;
  debouncedSearch: string;
  trimmedSearch: string;
  isSampleLookup: boolean;
  isLookupBelowMin: boolean;
  serverFilters: ReturnType<typeof worklistServerFilters>;
  skipSearchFilter: boolean;
  skipDateFilter: boolean;
  skipSampleTypeFilter: boolean;
  skipStatusFilter: boolean;
  collectionSampleLookup: boolean;
}

/** Filter bar + URL state and worklist query params (no item list required). */
export function useLabQueueBarFilters(workflowType: LabQueueWorkflowType): LabQueueBarState {
  const [searchParams, setSearchParams] = useSearchParams();

  const filterConfig = useMemo(() => getLabQueueStageConfig(workflowType), [workflowType]);

  const readBarFiltersFromUrl = (): LabQueueBarFilters => {
    return barFiltersFromUrl(searchParams, workflowType, filterConfig.defaultStatuses);
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
  const [priorityGroupFilters, setPriorityGroupFilters] = useState<string[]>(
    () => [...readBarFiltersFromUrl().priorityGroupFilters],
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

  const collectionLookupStatuses = useMemo(() => {
    if (workflowType !== 'collection' || !isSampleLookup) return undefined;
    return resolveCollectionStatusFilters(true, statusFilters as string[]);
  }, [workflowType, isSampleLookup, statusFilters]);

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
        status: collectionLookupStatuses,
        priority:
          workflowType === 'validationReview'
            ? (statusFilters as string[])
            : undefined,
        priorityGroup: priorityGroupFilters,
      }),
    [
      workflowType,
      isSampleLookup,
      trimmedSearch,
      dateRange,
      sampleTypeFilters,
      collectionLookupStatuses,
      statusFilters,
      priorityGroupFilters,
    ],
  );

  const skipSearchFilter = true;
  const skipDateFilter = true;
  const skipSampleTypeFilter = true;
  const skipStatusFilter = true;
  const collectionSampleLookup = workflowType === 'collection' && isSampleLookup;

  const skipUrlDecodeRef = useRef(false);
  const persistSkipRef = useRef(true);

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
    setPriorityGroupFilters([...next.priorityGroupFilters]);
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
            priorityGroupFilters,
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
    priorityGroupFilters,
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
    priorityGroupFilters,
    setPriorityGroupFilters,
    debouncedSearch,
    trimmedSearch,
    isSampleLookup,
    isLookupBelowMin,
    serverFilters,
    skipSearchFilter,
    skipDateFilter,
    skipSampleTypeFilter,
    skipStatusFilter,
    collectionSampleLookup,
  };
}
