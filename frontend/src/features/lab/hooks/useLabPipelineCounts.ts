/**
 * useLabPipelineCounts - Shared tab badge counts for the laboratory page.
 * Uses the same TanStack Query cache keys as child workflow views.
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/features/orders/api/useOrderQueries';
import { useSamplesList } from '@/features/collection/api/useSamples';
import { usePendingEscalation } from '@/features/validation/api/usePendingEscalation';
import { useTestCatalog } from '@/features/catalog/api/useTestCatalog';
import { usePatientNameLookup } from '@/features/patients/api/usePatients';
import { useOrderLookup } from '@/features/orders/utils/useOrderUtils';
import { useCollectionSampleDisplays } from '@/features/collection/hooks/useCollectionSampleDisplays';
import { useLabTestsFromOrders } from '@/features/lab/hooks';

export interface LabPipelineCounts {
  collection: number;
  entry: number;
  validation: number;
  escalation: number;
}

export function useLabPipelineCounts() {
  const { orders } = useOrdersList();
  const { samples = [] } = useSamplesList();
  const { tests = [] } = useTestCatalog();
  const { getPatient, getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const { escalatedTests } = usePendingEscalation();

  const { displays: collectionDisplays } = useCollectionSampleDisplays({
    samples,
    tests,
    getOrder,
    getPatient,
    getPatientName,
  });

  const entryTests = useLabTestsFromOrders({
    orders,
    testCatalog: tests,
    statusFilter: ['sample-collected'],
    includePatient: true,
  });

  const validationTests = useLabTestsFromOrders({
    orders,
    testCatalog: tests,
    statusFilter: ['resulted'],
    onlyUnvalidated: true,
  });

  const counts = useMemo<LabPipelineCounts>(() => {
    return {
      collection: collectionDisplays.filter(d => d.sample?.status === 'pending').length,
      entry: entryTests.length,
      validation: validationTests.length,
      escalation: escalatedTests?.length ?? 0,
    };
  }, [collectionDisplays, entryTests, validationTests, escalatedTests]);

  return { counts };
}
