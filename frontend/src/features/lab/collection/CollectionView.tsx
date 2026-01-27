/**
 * CollectionView - Main view for sample collection workflow
 *
 * Displays samples awaiting collection with filtering by status.
 */

import React, { useMemo, useState } from 'react';
import type { FilterValues } from '@/utils/filters';
import { useAuth } from '@/hooks';
import {
  useOrdersList,
  useOrderLookup,
  useTestCatalog,
  useSamplesList,
  useCollectSample,
  usePatientNameLookup,
} from '@/hooks/queries';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import type { ContainerType, ContainerTopColor, SampleStatus, Test } from '@/types';
import { calculateRequiredSamples, getCollectionRequirements } from '@/utils/sampleHelpers';
import { getTestNames } from '@/utils/typeHelpers';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { CollectionCard } from './CollectionCard';
import { LabWorkflowView } from '../components/LabWorkflowView';
import { DataErrorBoundary } from '@/shared/components';
import { FilterBar, useFilteredData } from '@/utils/filters';
import { collectionFilterConfig } from '../constants';
import type { SampleDisplay } from '../types';

/**
 * Creates a filter function for samples that searches across multiple fields
 */
const createSampleFilter =
  (getPatientName: (patientId: number) => string, tests: Test[]) =>
  // High complexity is necessary for comprehensive search across multiple fields (order ID, sample ID, patient name, test names, rejection reasons, notes)
  // eslint-disable-next-line complexity
  (display: SampleDisplay, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const sample = display.sample;
    const sampleType = sample?.sampleType;
    const collectionType = sampleType ? getCollectionRequirements(sampleType).collectionType : '';
    const patientName = getPatientName(display.order.patientId);
    const testNames = sample?.testCodes ? getTestNames(sample.testCodes, tests) : [];

    // Search in rejection reasons/notes for rejected samples
    const rejectionReasons =
      sample?.status === 'rejected' && 'rejectionReasons' in sample
        ? (sample.rejectionReasons || []).join(' ').toLowerCase()
        : '';
    const rejectionNotes =
      sample?.status === 'rejected' && 'rejectionNotes' in sample
        ? (sample.rejectionNotes || '').toLowerCase()
        : '';

    // Search in collection notes
    const collectionNotes =
      (sample?.status === 'collected' || sample?.status === 'rejected') &&
      'collectionNotes' in sample
        ? (sample.collectionNotes || '').toLowerCase()
        : '';

    return (
      display.order.orderId.toString().toLowerCase().includes(lowerQuery) ||
      sample?.sampleId?.toString().toLowerCase().includes(lowerQuery) ||
      patientName.toLowerCase().includes(lowerQuery) ||
      sampleType?.toLowerCase()?.includes(lowerQuery) ||
      (collectionType.toLowerCase().includes(lowerQuery) && collectionType !== sampleType) ||
      testNames.some((name: string) => name.toLowerCase().includes(lowerQuery)) ||
      rejectionReasons.includes(lowerQuery) ||
      rejectionNotes.includes(lowerQuery) ||
      collectionNotes.includes(lowerQuery)
    );
  };

export const CollectionView: React.FC = () => {
  const { currentUser } = useAuth();
  const { refetch: refreshOrders } = useOrdersList();
  const { tests } = useTestCatalog();
  const { samples } = useSamplesList();
  const collectSampleMutation = useCollectSample();
  const { getPatient, getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  // Centralized filter state management
  const [filters, setFilters] = useState<FilterValues>({
    searchQuery: '',
    dateRange: null,
    sampleType: [],
    status: ['pending'] as SampleStatus[],
  });
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

  // Create memoized filter function for search
  const filterSample = useMemo(
    () => createSampleFilter(getPatientName, tests),
    [getPatientName, tests]
  );

  // Apply filters using centralized hook with custom search
  const filteredDisplays = useFilteredData<SampleDisplay>({
    items: allSampleDisplays,
    filterValues: filters,
    filterConfig: collectionFilterConfig,
    customSearchFields: display => {
      // Return fields that would match - this is a simplified version
      // The actual filtering happens in customFilters
      return [
        display.order.orderId.toString(),
        getPatientName(display.order.patientId),
        display.sample?.sampleId?.toString() || '',
      ];
    },
    customDateGetter: (display, field) => {
      if (field === 'dateRange' || field === 'orderDate') {
        return display.order.orderDate;
      }
      return null;
    },
    customFilters: {
      searchQuery: (display, value) => {
        const query = (value as string) || '';
        if (!query.trim()) return true;
        return filterSample(display, query);
      },
      sampleType: (display, value) => {
        const filterValues = (value as string[]) || [];
        if (filterValues.length === 0) return true;
        const st = display.requirement?.sampleType ?? display.sample?.sampleType;
        return !!(st && filterValues.includes(st));
      },
      status: (display, value) => {
        const filterValues = (value as SampleStatus[]) || [];
        if (filterValues.length === 0) return true;
        return !!(display.sample?.status && filterValues.includes(display.sample.status));
      },
    },
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
      toast.error('You must be logged in to collect samples');
      return;
    }
    if (!display.sample || !display.requirement) {
      toast.error('Invalid sample data');
      return;
    }
    if (!selectedColor) {
      toast.error('Container color is required');
      return;
    }
    if (!selectedContainerType) {
      toast.error('Container type is required');
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
      toast.success(`${display.sample.sampleType.toUpperCase()} sample collected`);
    } catch (error) {
      logger.error('Error collecting sample', error instanceof Error ? error : undefined);
      toast.error('Failed to collect sample. Please try again.');
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
        filterRow={<FilterBar config={collectionFilterConfig} value={filters} onChange={setFilters} />}
      />
    </DataErrorBoundary>
  );
};
