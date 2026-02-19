/**
 * CollectionView - Main view for sample collection workflow
 *
 * Displays samples awaiting collection with filtering by status.
 */

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { usePatientNameLookup } from '@/features/patients/api/usePatients';
import { useOrderLookup } from '@/features/orders/utils/useOrderUtils';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { useCollectSample, useSamplesList } from '@/features/collection/api/useSamples';
import { useCollectionSampleDisplays } from '@/features/collection/hooks/useCollectionSampleDisplays';
import { queryKeys } from '@/lib/query';
import { toast } from '@/app/AppToastBar';
import { logger } from '@/utils/logger';
import { getErrorMessage, getErrorDetails, isLikelyNetworkOrTimeout } from '@/utils/errors';
import type { ContainerType, ContainerTopColor, SampleStatus } from '@/types';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { CollectionCard } from './CollectionCard';
import { LabWorkflowView } from '@/features/lab/components/LabWorkflowView';
import { LabFilters } from '@/features/lab/components/LabFilters';
import { useLabWorkflowFilters } from '@/features/lab/hooks/useLabWorkflowFilters';
import { collectionFilterConfig } from '@/features/lab/constants';
import { ErrorBoundary } from '@/components';
import { LabWorkflowViewSkeleton } from '@/features/lab/components/LabWorkflowViewSkeleton';
import type { SampleDisplay } from '@/features/lab/types';

export const CollectionView: React.FC = () => {
  const queryClient = useQueryClient();
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
  });

  /**
   * Handle sample collection
   */
  const handleCollect = async (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    selectedContainerType?: ContainerType
  ) => {
    if (!currentUser) {
      toast.error({
        title: 'You must be logged in to collect samples',
        subtitle: 'Please sign in to record sample collections, then try again.',
      });
      return;
    }
    if (!display.sample || !display.requirement) {
      toast.error({
        title: 'Invalid sample data',
        subtitle:
          'The sample or requirement data is missing or invalid. Refresh the page and try again.',
      });
      return;
    }
    if (!selectedColor) {
      toast.error({
        title: 'Container color is required',
        subtitle: 'Select the container cap color before confirming the collection.',
      });
      return;
    }
    if (!selectedContainerType) {
      toast.error({
        title: 'Container type is required',
        subtitle: 'Select the container type (e.g. cup or tube) before confirming the collection.',
      });
      return;
    }

    try {
      await collectSampleMutation.mutateAsync({
        sampleId: display.sample.sampleId.toString(),
        collectedVolume: volume,
        actualContainerType: selectedContainerType,
        actualContainerColor: selectedColor as ContainerTopColor,
        collectionNotes: notes,
      });
      toast.success({
        title: `${(display.sample.sampleType ?? 'sample').toString().toUpperCase()} sample collected`,
        subtitle:
          'The sample has been recorded and the order has been updated. You can continue with the next sample.',
      });
      try {
        await refreshOrders();
      } catch (refetchError) {
        const err = refetchError as Error & { name?: string };
        if (err?.name !== 'AbortError') {
          logger.error('Error refreshing orders after collection', getErrorDetails(refetchError));
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      }
    } catch (error) {
      logger.error('Error collecting sample', getErrorDetails(error));
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      if (isLikelyNetworkOrTimeout(error)) {
        toast.error({
          title: 'Action may have completed',
          subtitle:
            'The request did not complete. Please refresh the page to see the latest status.',
        });
      } else {
        const message = getErrorMessage(
          error,
          'The collection could not be saved. Check your connection and try again.'
        );
        toast.error({
          title: 'Failed to collect sample',
          subtitle: message,
        });
      }
    }
  };

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
