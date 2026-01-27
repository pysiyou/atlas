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
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { CollectionCard } from './CollectionCard';
import { LabWorkflowView } from '../components/LabWorkflowView';
import { CollectionFilters } from '../components/filters';
import { DataErrorBoundary } from '@/shared/components';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
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
  const filterSample = useMemo(
    () => createSampleFilter(getPatientName, tests),
    [getPatientName, tests]
  );

  // Apply date range, sample type, status, then search (same order as Order filters)
  const filteredDisplays = useMemo(() => {
    let out = allSampleDisplays;

    if (dateRange) {
      const [start, end] = dateRange;
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      out = out.filter(d => {
        const orderDate = new Date(d.order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    if (sampleTypeFilters.length > 0) {
      out = out.filter(d => {
        const st = d.requirement?.sampleType ?? d.sample?.sampleType;
        return st && sampleTypeFilters.includes(st);
      });
    }

    if (statusFilters.length > 0) {
      out = out.filter(d => d.sample?.status && statusFilters.includes(d.sample.status));
    }

    if (searchQuery.trim()) {
      out = out.filter(d => filterSample(d, searchQuery));
    }

    return out;
  }, [allSampleDisplays, dateRange, sampleTypeFilters, statusFilters, searchQuery, filterSample]);

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
        filterRow={
          <CollectionFilters
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
