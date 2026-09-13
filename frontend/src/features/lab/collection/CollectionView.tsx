/**
 * CollectionView - Main view for sample collection workflow
 *
 * Refactored to use useLabDataProvider and createWorkflowFilters.
 */

import React from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useLabDataProvider, createWorkflowFilters } from '@/features/lab/hooks';
import type { SampleDisplay } from '@/features/lab/types';
import { useCollectSample } from '../api/samples.api';
import { useOrdersList } from '@/features/orders';
import { useCollectionCollectHandler } from './useCollectionCollectHandler';
import { CollectionCard } from './CollectionCard/index';
import { LabWorkflowView } from '../components/LabWorkflowView';
import { LabFilters } from '../components/LabFilters';
import { collectionFilterConfig } from '../constants';
import { ErrorBoundary } from '@/components';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import { useAuthStore } from '@/app/store';

export const CollectionView: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { refetch: refreshOrders } = useOrdersList();
  const collectSampleMutation = useCollectSample();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  // Use shared data provider
  const { collectionDisplays, isLoading } = useLabDataProvider();

  // Use filter factory
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
  } = createWorkflowFilters({
    items: collectionDisplays,
    workflowType: 'collection',
  });

  const { handleCollect } = useCollectionCollectHandler({
    isAuthenticated: !!currentUser,
    collectSampleMutation,
    refreshOrders,
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
      <LabWorkflowView
        items={filteredDisplays}
        renderCard={display => (
          <CollectionCard
            display={display as SampleDisplay}
            onCollect={handleCollect}
            isCollecting={collectSampleMutation.isPending}
            isMobile={isMobile}
          />
        )}
        getItemKey={(display: any, idx: number) =>
          `${display.order.orderId}-${display.sample?.sampleType || 'unknown'}-${display.sample?.sampleId || idx}-${idx}`
        }
        emptyIcon="sample-collection"
        emptyTitle="No Pending Collections"
        emptyDescription="There are no samples waiting to be collected."
        filterRow={
          <LabFilters
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
