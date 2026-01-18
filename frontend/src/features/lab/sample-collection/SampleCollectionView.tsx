import React, { useMemo, useState } from 'react';
import { useOrders, useTests, useAuth, useSamples, usePatients } from '@/hooks';
import toast from 'react-hot-toast';
import type { Sample, ContainerType, ContainerTopColor, SampleStatus, Patient, Test } from '@/types';
import { calculateRequiredSamples, sortByPriority, getCollectionRequirements } from '../../../utils/sampleHelpers';
import { getPatientName, getTestNames } from '@/utils/typeHelpers';
import { SampleCard } from './SampleCard';
import { SearchBar, MultiSelectFilter, type FilterOption, EmptyState } from '@/shared/ui';
import { useSearch } from '@/utils/filtering';
import type { SampleDisplay } from './types';

// Sample status filter options with colors
const SAMPLE_STATUS_FILTER_OPTIONS: FilterOption[] = [
  { id: 'pending', label: 'PENDING', color: 'warning' },
  { id: 'collected', label: 'COLLECTED', color: 'success' },
];

const createFilterSample = (patients: Patient[], tests: Test[]) => (display: SampleDisplay, query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  const sampleType = display.sample?.sampleType;
  
  // Also match on collection type (e.g. searching "blood" should find plasma)
  const collectionType = sampleType ? getCollectionRequirements(sampleType).collectionType : '';
  
  const patientName = getPatientName(display.order.patientId, patients);
  const testNames = display.sample?.testCodes ? getTestNames(display.sample.testCodes, tests) : [];
  
  return (
    display.order.orderId.toLowerCase().includes(lowerQuery) ||
    patientName.toLowerCase().includes(lowerQuery) ||
    (sampleType?.toLowerCase()?.includes(lowerQuery) || false) ||
    (collectionType.toLowerCase().includes(lowerQuery) && collectionType !== sampleType) ||
    (testNames.some((name: string) => name.toLowerCase().includes(lowerQuery))) ||
    false
  );
};

export const SampleCollectionView: React.FC = () => {
  const { currentUser } = useAuth();
  const { orders, collectSampleForTests } = useOrders();
  const { tests } = useTests();
  const { samples, collectSample } = useSamples();
  const { getPatient, patients } = usePatients();
  const [statusFilters, setStatusFilters] = useState<SampleStatus[]>(['pending']);

  const allSampleDisplays = useMemo(() => {
    const displays: SampleDisplay[] = [];

    orders.forEach(order => {
      const patient = getPatient(order.patientId);
      if (!patient) return; // Skip if patient not found

      const uncollectedTests = order.tests.filter(test => test.status === 'pending');

      // Create pending sample displays for uncollected tests
      if (uncollectedTests.length > 0) {
        const requirements = calculateRequiredSamples(uncollectedTests, tests, order.priority, order.orderId);
        requirements.forEach(req => {
          // Check if we already have a pending sample for this
          const existingSample = samples.find(
            s => s.orderId === order.orderId &&
                 s.sampleType === req.sampleType &&
                 s.status === 'pending'
          );

          if (existingSample) {
            // Use the existing pending sample from seed data
            displays.push({
              sample: existingSample,
              order,
              patient,
              priority: order.priority,
              requirement: req,
            });
          } else {
            // Create a virtual pending sample for display
            const pendingSample: Sample = {
              sampleId: `PENDING-${order.orderId}-${req.sampleType}`,
              orderId: order.orderId,
              sampleType: req.sampleType,
              testCodes: req.testCodes,
              requiredVolume: req.totalVolume,
              priority: req.priority,
              requiredContainerTypes: req.containerTypes,
              requiredContainerColors: req.containerTopColors,
              createdAt: new Date().toISOString(),
              createdBy: 'system',
              updatedAt: new Date().toISOString(),
              updatedBy: 'system',
              status: 'pending',
            };

            displays.push({
              sample: pendingSample,
              order,
              patient,
              priority: order.priority,
              requirement: req,
            });
          }
        });
      }

      // Add collected samples
      const collectedTests = order.tests.filter(test => test.status !== 'pending');
      const collectedSampleIds = new Set(collectedTests.map(t => t.sampleId).filter(Boolean));

      collectedSampleIds.forEach(sampleId => {
        const sample = samples.find(s => s.sampleId === sampleId);
        if (sample) {
          const testsForSample = collectedTests.filter(t => t.sampleId === sampleId);
          const requirements = calculateRequiredSamples(testsForSample, tests, order.priority, order.orderId);

          if (requirements.length > 0) {
            displays.push({
              sample,
              order,
              patient,
              priority: order.priority,
              requirement: requirements[0],
            });
          }
        }
      });
    });

    return displays;
  }, [orders, tests, samples, getPatient]);

  const filterSample = useMemo(() => createFilterSample(patients, tests), [patients, tests]);

  const { filteredItems: filteredDisplays, searchQuery, setSearchQuery, isEmpty } = useSearch(
    allSampleDisplays,
    filterSample
  );

  const displayedSamples = useMemo(() => {
    // Apply status filter (if any selected, otherwise show all)
    const statusFiltered = statusFilters.length === 0
      ? filteredDisplays
      : filteredDisplays.filter(d => d.sample?.status && statusFilters.includes(d.sample.status));

    return sortByPriority(statusFiltered.map(d => ({ ...d, priority: d.sample?.priority || d.priority })));
  }, [filteredDisplays, statusFilters]);

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
      const errorMessage = display.sample.sampleType === 'urine'
        ? 'Container color is required for sample identification'
        : 'Container color is required for physical tube identification';
      toast.error(errorMessage);
      return;
    }

    if (!selectedContainerType) {
      toast.error('Container type is required');
      return;
    }

    try {
      // Collect the sample via API
      await collectSample(
        display.sample.sampleId,
        volume,
        selectedContainerType,
        selectedColor as ContainerTopColor,
        notes
      );

      // Update the order tests to mark them as collected and link to the sample
      const collectionDate = new Date().toISOString();
      collectSampleForTests(
        display.order.orderId,
        display.requirement.testCodes,
        display.sample.sampleId,
        {
          collectionDate,
          collectedBy: currentUser.id,
          collectionNotes: notes,
        }
      );

      toast.success(`${display.sample.sampleType.toUpperCase()} sample collected`);
    } catch (error) {
      console.error('Error collecting sample:', error);
      toast.error('Failed to collect sample. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-medium text-gray-900">Sample Collection</h3>
          {allSampleDisplays.length > 0 && (
            <>
              <div className="h-6 w-px bg-gray-300 hidden md:block" />
              <MultiSelectFilter
                label="Status"
                options={SAMPLE_STATUS_FILTER_OPTIONS}
                selectedIds={statusFilters}
                onChange={(ids) => setStatusFilters(ids as SampleStatus[])}
                selectAllLabel="Select all"
                icon="checklist"
              />
            </>
          )}
        </div>

        {allSampleDisplays.length > 0 && (
          <div className="w-full md:w-72">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search samples..."
              size="sm"
            />
          </div>
        )}
      </div>

      <div className={`flex-1 ${displayedSamples.length === 0 ? 'flex flex-col' : 'grid gap-4 overflow-y-auto min-h-0'}`}>
        {displayedSamples.map((display, idx) => (
          <SampleCard
            key={`${display.order.orderId}-${display.sample?.sampleType || 'unknown'}-${display.sample?.sampleId || idx}-${idx}`}
            display={display}
            onCollect={handleCollect}
          />
        ))}

        {isEmpty && (
          <div className="flex-1">
            <EmptyState
              icon={searchQuery ? 'search' : 'sample-collection'}
              title={searchQuery ? 'No Matches Found' : 'No Pending Collections'}
              description={searchQuery ? `No tests found matching "${searchQuery}"` : 'There are no samples waiting to be collected.'}
            />
          </div>
        )}
      </div>
    </div>
  );
};
