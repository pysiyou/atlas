/**
 * useLabDataProvider - Centralized lab data fetching and derivation
 *
 * Single source of truth for all lab workflow views, eliminating triplicated
 * data fetching across CollectionView, EntryView, ValidationView, and CommandCenter.
 *
 * React Query handles deduplication - multiple consumers share the same cache.
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/app/store';
import { useOrdersList } from '@/features/orders';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { useOrderLookup } from '@/features/orders';
import { useSamplesList } from '../api/samples.api';
import { usePendingEscalation } from '../api/results.api';
import { usePendingRecollectionRequests } from '../api/recollection-requests.api';
import { useCollectionSampleDisplays } from '../collection/useCollectionSampleDisplays';
import { useLabTestsFromOrders } from './useLabTestsFromOrders';
import type { Order, Sample, Test, TestWithContext } from '@/types';
import type { SampleDisplay } from '../types';
import type { TestWithContextResult } from './useLabTestsFromOrders';
import type { RecollectionRequestSummary } from '@/types/lab-operations';

export interface LabPipelineCounts {
  collection: number;
  entry: number;
  /** Unvalidated tests in the review queue — matches queue-age charts */
  validation: number;
  /** Escalations and recollection requests — validation tab badge only */
  supervisor: number;
}

/** Tab badge count for the validation workflow (queue + supervisor items). */
export function getValidationTabCount(counts: LabPipelineCounts): number {
  return counts.validation + counts.supervisor;
}

export interface LabDataProviderResult {
  // Raw data
  orders: Order[];
  samples: Sample[];
  tests: Test[];
  
  // Derived displays
  collectionDisplays: SampleDisplay[];
  entryTests: TestWithContextResult[];
  validationTests: TestWithContextResult[];
  escalations: TestWithContext[];
  recollections: RecollectionRequestSummary[];
  
  // Metadata
  pipelineCounts: LabPipelineCounts;
  isLoading: boolean;
  
  // Utilities
  canResolveEscalation: boolean;
  getPatientName: (patientId: number | string) => string;
  getOrder: (orderId: number) => Order | undefined;
}

export function useLabDataProvider(): LabDataProviderResult {
  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);
  
  // Primary data sources
  const { orders = [], isLoading: ordersLoading } = useOrdersList();
  const { samples = [], isLoading: samplesLoading } = useSamplesList();
  const { tests = [], isLoading: catalogLoading } = useTestCatalog();
  const { escalatedTests = [] } = usePendingEscalation();
  const { requests: recollectionRequests = [] } = usePendingRecollectionRequests();
  
  // Lookup utilities
  const { getPatient, getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  
  // Derived collection displays
  const { displays: collectionDisplays } = useCollectionSampleDisplays({
    samples,
    tests,
    getOrder,
    getPatient,
    getPatientName,
  });
  
  // Derived entry tests
  const entryTests = useLabTestsFromOrders({
    orders,
    testCatalog: tests,
    statusFilter: ['sample-collected'],
    includePatient: true,
  });
  
  // Derived validation tests
  const validationTests = useLabTestsFromOrders({
    orders,
    testCatalog: tests,
    statusFilter: ['resulted'],
    onlyUnvalidated: true,
    includeHasCriticalValues: true,
  });
  
  // Pipeline counts
  const pipelineCounts = useMemo<LabPipelineCounts>(() => {
    const escalatedCount = canResolveEscalation ? escalatedTests.length : 0;
    const recollectionCount = canResolveEscalation ? recollectionRequests.length : 0;

    return {
      collection: collectionDisplays.filter(d => d.sample?.status === 'pending').length,
      entry: entryTests.length,
      validation: validationTests.length,
      supervisor: escalatedCount + recollectionCount,
    };
  }, [collectionDisplays, entryTests, validationTests, escalatedTests, recollectionRequests, canResolveEscalation]);
  
  const isLoading = ordersLoading || samplesLoading || catalogLoading;
  
  return {
    orders,
    samples,
    tests,
    collectionDisplays,
    entryTests,
    validationTests,
    escalations: escalatedTests,
    recollections: recollectionRequests,
    pipelineCounts,
    isLoading,
    canResolveEscalation,
    getPatientName,
    getOrder,
  };
}
