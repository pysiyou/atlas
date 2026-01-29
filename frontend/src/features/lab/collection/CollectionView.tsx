/**
 * CollectionView - Main view for sample collection workflow
 *
 * Displays samples awaiting collection with filtering by status.
 */

import React, { useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth.store';
import {
  useOrdersList,
  useOrderLookup,
  useTestCatalog,
  useSamplesList,
  useCollectSample,
  usePatientNameLookup,
} from '@/hooks/queries';
import { queryKeys } from '@/lib/query';
import { toast } from '@/shared/components/feedback';
import { logger } from '@/utils/logger';
import { getErrorMessage, isLikelyNetworkOrTimeout } from '@/utils/errorHelpers';
import type { ContainerType, ContainerTopColor, SampleStatus } from '@/types';
import { calculateRequiredSamples } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { CollectionCard } from './CollectionCard';
import { LabWorkflowView } from '../components/LabWorkflowView';
import { LabFilters } from '../components/LabFilters';
import { useLabWorkflowFilters } from '../hooks/useLabWorkflowFilters';
import { createSampleSearchFilter } from '../utils/lab-helpers';
import { collectionFilterConfig } from '../constants';
import { DataErrorBoundary } from '@/shared/components';
import type { SampleDisplay } from '../types';

export const CollectionView: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { refetch: refreshOrders } = useOrdersList();
  const { tests } = useTestCatalog();
  const { samples } = useSamplesList();
  const collectSampleMutation = useCollectSample();
  const { getPatient, getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  // Build display objects for all samples
  const allSampleDisplays = useMemo(() => {
    const displays: SampleDisplay[] = [];

    samples.forEach(sample => {
      const order = getOrder(sample.orderId);
      if (!order) return;

      const patient = getPatient(order.patientId);
      if (!patient) return;

      const testsForSample = order.tests.filter(t => sample.testCodes.includes(t.testCode));
      if (testsForSample.length > 0) {
        const requirements = calculateRequiredSamples(
          testsForSample,
          tests,
          order.priority,
          order.orderId
        );
        if (requirements.length > 0) {
          displays.push({
            sample,
            order,
            patient,
            priority: sample.priority,
            requirement: requirements[0],
          });
        }
      }
    });

    return displays;
  }, [samples, tests, getPatient, getOrder]);

  const filterSample = useMemo(
    () => createSampleSearchFilter(getPatientName, tests),
    [getPatientName, tests]
  );

  const getOrderDate = useCallback((d: SampleDisplay) => d.order.orderDate, []);
  const getSampleType = useCallback((d: SampleDisplay) => d.requirement?.sampleType ?? d.sample?.sampleType, []);
  const getStatus = useCallback((d: SampleDisplay) => d.sample?.status, []);

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
        subtitle: 'The sample or requirement data is missing or invalid. Refresh the page and try again.',
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
      await refreshOrders();
      toast.success({
        title: `${(display.sample.sampleType ?? 'sample').toString().toUpperCase()} sample collected`,
        subtitle: 'The sample has been recorded and the order has been updated. You can continue with the next sample.',
      });
    } catch (error) {
      logger.error('Error collecting sample', error instanceof Error ? error : undefined);
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      if (isLikelyNetworkOrTimeout(error)) {
        toast.error({
          title: 'Action may have completed',
          subtitle: 'The request did not complete. Please refresh the page to see the latest status.',
        });
      } else {
        const message = getErrorMessage(error, 'The collection could not be saved. Check your connection and try again.');
        toast.error({
          title: 'Failed to collect sample',
          subtitle: message,
        });
      }
    }
  };

  return (
    <DataErrorBoundary>
      <LabWorkflowView
        items={filteredDisplays}
        renderCard={display => (
          <CollectionCard display={display} onCollect={handleCollect} isMobile={isMobile} />
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
    </DataErrorBoundary>
  );
};
