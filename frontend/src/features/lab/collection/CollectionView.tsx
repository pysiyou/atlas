/**
 * CollectionView - Main view for sample collection workflow
 *
 * Displays samples awaiting collection with filtering by status.
 */

import React, { useMemo, useState } from 'react';
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
import { MultiSelectFilter, type FilterOption } from '@/shared/ui';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { CollectionCard } from './CollectionCard';
import { CollectionMobileCard } from './CollectionMobileCard';
import { LabWorkflowView } from '../components/LabWorkflowView';
import { DataErrorBoundary } from '@/shared/components';
import type { SampleDisplay } from '../types';

/** Sample status filter options */
const SAMPLE_STATUS_FILTER_OPTIONS: FilterOption[] = [
  { id: 'pending', label: 'PENDING', color: 'warning' },
  { id: 'collected', label: 'COLLECTED', color: 'success' },
  { id: 'rejected', label: 'REJECTED', color: 'error' },
];

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
  const [statusFilters, setStatusFilters] = useState<SampleStatus[]>(['pending']);
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

  // Create memoized filter function
  const filterSample = useMemo(() => createSampleFilter(getPatientName, tests), [getPatientName, tests]);

  // Apply status filter to displays
  const filteredByStatus = useMemo(() => {
    if (statusFilters.length === 0) return allSampleDisplays;
    return allSampleDisplays.filter(
      d => d.sample?.status && statusFilters.includes(d.sample.status)
    );
  }, [allSampleDisplays, statusFilters]);

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
      title="Sample Collection"
      items={filteredByStatus}
      filterFn={filterSample}
      renderCard={display =>
        isMobile ? (
          <CollectionMobileCard display={display} onCollect={handleCollect} />
        ) : (
          <CollectionCard display={display} onCollect={handleCollect} />
        )
      }
      getItemKey={(display, idx) =>
        `${display.order.orderId}-${display.sample?.sampleType || 'unknown'}-${display.sample?.sampleId || idx}-${idx}`
      }
      emptyIcon="sample-collection"
      emptyTitle="No Pending Collections"
      emptyDescription="There are no samples waiting to be collected."
      searchPlaceholder="Search samples..."
      filters={
        <MultiSelectFilter
          label="Status"
          options={SAMPLE_STATUS_FILTER_OPTIONS}
          selectedIds={statusFilters}
          onChange={ids => setStatusFilters(ids as SampleStatus[])}
          selectAllLabel="Select all"
          icon="checklist"
        />
      }
    />
    </DataErrorBoundary>
  );
};
