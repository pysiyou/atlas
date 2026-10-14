/**
 * SampleCollectionQueue - Main view for sample collection workflow
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { decodeFiltersFromUrl } from '@/utils/filters';
import { useLabQueueFilters, useLabQueueUrlSearch } from '../hooks';
import {
  getLabQueueSearchFromUrlFilters,
  hasActiveEntityUrlFilters,
} from '../utils/labSearchAndLinks';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import { LAB_CONFIG } from '../constants';
import { useCollectSample } from '../api/samples';
import { useCollectionWorklist } from '../api/worklists';
import { useSubmitSampleCollection } from './useSubmitSampleCollection';
import { SampleCollectionCard } from '../workflow';
import { LabWorkflowQueueLayout } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import { LabQueueFilterRow } from '../components/LabQueueFilterRow';
import { collectionFilterConfig, LAB_URL_FILTER_KEYS } from '../constants';
import { mapCollectionWorklistToSampleDisplay } from '../utils/labQueue';
import { EMPTY_COPY, emptySubtitle } from '@/components/display';
import { ErrorBoundary } from '@/components/loaders';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import { useAuthStore } from '@/app/authStore';
import { useTestCatalog } from '@/features/catalog';
export const SampleCollectionQueue: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const collectSampleMutation = useCollectSample();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const { tests: catalogTests } = useTestCatalog();
  const [searchParams] = useSearchParams();
  const urlSearch = useLabQueueUrlSearch();
  const [searchQuery, setSearchQuery] = useState(() =>
    getLabQueueSearchFromUrlFilters(
      decodeFiltersFromUrl(searchParams, LAB_URL_FILTER_KEYS),
      urlSearch,
      true
    )
  );

  const debouncedSearch = useDebouncedValue(searchQuery, LAB_CONFIG.SEARCH_DEBOUNCE_MS);
  const trimmedSearch = debouncedSearch.trim();
  const isSampleLookup = trimmedSearch.length >= LAB_CONFIG.SAMPLE_LOOKUP_MIN_CHARS;
  const isLookupBelowMin =
    trimmedSearch.length > 0 && trimmedSearch.length < LAB_CONFIG.SAMPLE_LOOKUP_MIN_CHARS;

  const { items: worklistItems, pagination, isLoading } = useCollectionWorklist(
    isSampleLookup ? { search: trimmedSearch } : undefined
  );
  const collectionDisplays = useMemo(
    () => worklistItems.map(mapCollectionWorklistToSampleDisplay),
    [worklistItems]
  );

  const {
    filteredItems: filteredDisplaysRaw,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters,
    setStatusFilters,
    urlFilters,
    clearUrlFilters,
    setUrlFilter,
  } = useLabQueueFilters({
    items: collectionDisplays,
    workflowType: 'collection',
    searchQuery,
    onSearchChange: setSearchQuery,
    skipSearchFilter: isSampleLookup,
    collectionSampleLookup: isSampleLookup,
  });

  useEffect(() => {
    const entitySearch = getLabQueueSearchFromUrlFilters(urlFilters, urlSearch, true);
    if (hasActiveEntityUrlFilters(urlFilters)) {
      setSearchQuery(entitySearch);
      return;
    }
    setSearchQuery(urlSearch);
  }, [urlFilters, urlSearch]);

  const filteredDisplays = filteredDisplaysRaw as SampleCollectionQueueItem[];

  const { handleCollect } = useSubmitSampleCollection({
    isAuthenticated: !!currentUser,
    collectSampleMutation,
  });

  const hasNoItems = collectionDisplays.length === 0;
  if (isLoading && hasNoItems) {
    return (
      <ErrorBoundary>
        <DetailPageSkeleton variant="workflow-grid" />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LabWorkflowQueueLayout
        items={filteredDisplays}
        renderCard={display => (
          <SampleCollectionCard
            display={display as SampleCollectionQueueItem}
            onCollect={handleCollect}
            isCollecting={collectSampleMutation.isPending}
            isMobile={isMobile}
            tests={catalogTests}
          />
        )}
        getItemKey={(display: SampleCollectionQueueItem, idx: number) =>
          `${display.order.orderId}-${display.sample?.sampleType || 'unknown'}-${display.sample?.sampleId || idx}-${idx}`
        }
        emptyTitle={
          isSampleLookup ? EMPTY_COPY.matchingSamples.title : EMPTY_COPY.pendingCollections.title
        }
        emptyDescription={
          isSampleLookup
            ? EMPTY_COPY.matchingSamples.description
            : isLookupBelowMin
              ? emptySubtitle(
                  'samples',
                  `you enter at least ${LAB_CONFIG.SAMPLE_LOOKUP_MIN_CHARS} characters to search`,
                )
              : EMPTY_COPY.pendingCollections.description
        }
        filterRow={
          <LabQueueFilterRow
            urlFilters={urlFilters}
            onClearUrlFilters={clearUrlFilters}
            onClearUrlFilter={key => setUrlFilter(key, undefined)}
            pagination={pagination}
          >
            <LabQueueFilters
              config={collectionFilterConfig}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              sampleTypeFilters={sampleTypeFilters}
              onSampleTypeFiltersChange={setSampleTypeFilters}
              statusFilters={statusFilters}
              onStatusFiltersChange={setStatusFilters}
            />
          </LabQueueFilterRow>
        }
      />
    </ErrorBoundary>
  );
};
