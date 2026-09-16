/**
 * SampleCollectionQueue - Main view for sample collection workflow
 */

import React, { useMemo, useState } from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLabQueueFilters, useLabQueueUrlSearch } from '@/features/lab/hooks';
import type { SampleCollectionQueueItem } from '@/features/lab/types';
import { LAB_CONFIG } from '@/features/lab/constants';
import { useCollectSample } from '../api/samples.api';
import { useCollectionWorklist } from '../api/worklists.api';
import { useSubmitSampleCollection } from './useSubmitSampleCollection';
import { SampleCollectionCard } from './SampleCollectionCard';
import { LabWorkflowQueueLayout } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import { collectionFilterConfig } from '../constants';
import { mapCollectionWorklistToSampleDisplay } from '../utils/worklistMappers';
import { ErrorBoundary } from '@/components';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import { useAuthStore } from '@/app/authStore';
export const SampleCollectionQueue: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const collectSampleMutation = useCollectSample();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const urlSearch = useLabQueueUrlSearch();
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  React.useEffect(() => {
    if (urlSearch) setSearchQuery(urlSearch);
  }, [urlSearch]);

  const debouncedSearch = useDebouncedValue(searchQuery, LAB_CONFIG.SEARCH_DEBOUNCE_MS);
  const trimmedSearch = debouncedSearch.trim();
  const isSampleLookup = trimmedSearch.length >= LAB_CONFIG.SAMPLE_LOOKUP_MIN_CHARS;
  const isLookupBelowMin =
    trimmedSearch.length > 0 && trimmedSearch.length < LAB_CONFIG.SAMPLE_LOOKUP_MIN_CHARS;

  const { items: worklistItems, isLoading } = useCollectionWorklist(
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
  } = useLabQueueFilters({
    items: collectionDisplays,
    workflowType: 'collection',
    searchQuery,
    onSearchChange: setSearchQuery,
    skipSearchFilter: isSampleLookup,
    collectionSampleLookup: isSampleLookup,
  });
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
          />
        )}
        getItemKey={(display: SampleCollectionQueueItem, idx: number) =>
          `${display.order.orderId}-${display.sample?.sampleType || 'unknown'}-${display.sample?.sampleId || idx}-${idx}`
        }
        emptyIcon="sample-collection"
        emptyTitle={isSampleLookup ? 'No matching samples' : 'No Pending Collections'}
        emptyDescription={
          isSampleLookup
            ? 'Try a display sample ID (e.g. SAM0042), numeric ID, or patient name.'
            : isLookupBelowMin
              ? `Enter at least ${LAB_CONFIG.SAMPLE_LOOKUP_MIN_CHARS} characters to search past samples by sample ID or patient name.`
              : 'There are no samples waiting to be collected.'
        }
        filterRow={
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
        }
      />
    </ErrorBoundary>
  );
};
