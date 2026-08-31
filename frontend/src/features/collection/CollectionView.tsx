/**
 * CollectionView - Main view for sample collection workflow
 *
 * Displays samples awaiting collection with filtering by status.
 */

import React from 'react';
import { useAuthStore } from '@/app/store';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { usePatientNameLookup } from '@/features/patients/api/usePatients';
import { useOrderLookup } from '@/features/orders/utils/useOrderUtils';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { useCollectSample, useSamplesList } from '@/features/collection/api/useSamples';
import { useCollectionSampleDisplays } from '@/features/collection/hooks/useCollectionSampleDisplays';
import { useCollectionCollectHandler } from '@/features/collection/hooks/useCollectionCollectHandler';
import type { SampleStatus } from '@/types';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { CollectionCard } from './CollectionCard';
import { LabWorkflowView } from '@/features/lab/components/LabWorkflowView';
import { LabFilters } from '@/features/lab/components/LabFilters';
import { useLabWorkflowFilters, useLabUrlSearch } from '@/features/lab/hooks';
import { collectionFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary } from '@/components';
import { LabWorkflowViewSkeleton } from '@/features/lab/components/LabWorkflowViewSkeleton';
import type { SampleDisplay } from '@/features/lab/types';

export const CollectionView: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { refetch: refreshOrders, isLoading: ordersLoading } = useOrdersList();
  const { tests, isLoading: testsLoading } = useTestCatalog();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const collectSampleMutation = useCollectSample();
  const { getPatient, getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const { displays: allSampleDisplays, filterSample, getOrderDate, getSampleType, getStatus } =
    useCollectionSampleDisplays({
      samples,
      tests,
      getOrder,
      getPatient,
      getPatientName,
    });

  const urlSearch = useLabUrlSearch();

  const {
    filteredItems: filteredDisplays,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters,
    setStatusFilters,
  } = useLabWorkflowFilters<SampleDisplay, SampleStatus>({
    items: allSampleDisplays,
    getOrderDate,
    getSampleType,
    getStatus,
    searchFilterFn: filterSample,
    initialStatusFilters: ['pending'],
    initialSearchQuery: urlSearch,
    sortByQueuePriority: true,
    getPriority: display => display.priority,
    getQueueSince: display => display.order?.orderDate,
  });

  const { handleCollect } = useCollectionCollectHandler({
    isAuthenticated: !!currentUser,
    collectSampleMutation,
    refreshOrders,
  });

  const isLoading = ordersLoading || testsLoading || samplesLoading;
  const hasNoItems = allSampleDisplays.length === 0;
  if (isLoading && hasNoItems) {
    return (
      <ErrorBoundary>
        <LabWorkflowViewSkeleton />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LabWorkflowView
        items={filteredDisplays}
        renderCard={display => (
          <CollectionCard
            display={display}
            onCollect={handleCollect}
            isCollecting={collectSampleMutation.isPending}
            isMobile={isMobile}
          />
        )}
        getItemKey={(display, idx) =>
          `${display.order.orderId}-${display.sample?.sampleType || 'unknown'}-${display.sample?.sampleId || idx}-${idx}`
        }
        emptyIcon="sample-collection"
        emptyTitle="No Pending Collections"
        emptyDescription="There are no samples waiting to be collected."
        filterRow={
          <LabFilters<SampleStatus[]>
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
