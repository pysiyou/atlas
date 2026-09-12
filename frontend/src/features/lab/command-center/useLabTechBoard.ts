/**
 * Aggregates live lab state for the lab tech command center board.
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/features/orders';
import { useSamplesList } from '@/features/lab/api/samples.api';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { useOrderLookup } from '@/features/orders';
import { useCollectionSampleDisplays } from '@/features/lab/collection/useCollectionSampleDisplays';
import { usePendingEscalation } from '@/features/lab/api/results.api';
import { usePendingRecollectionRequests } from '@/features/lab/api/recollection-requests.api';
import { useLabPipelineCounts, useLabTestsFromOrders } from '@/features/lab/hooks';
import { finalizeAttentionItems } from './deriveAttention';
import { deriveBoardPipeline } from './derivePipeline';
import { deriveHealth } from './deriveHealth';
import { deriveTodayThroughput } from './deriveThroughput';
import type { LabTechBoardData } from './boardTypes';

export function useLabTechBoard(): LabTechBoardData {
  const { orders = [] } = useOrdersList();
  const { samples = [] } = useSamplesList();
  const { tests: testCatalog = [] } = useTestCatalog();
  const { getPatient, getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const { counts } = useLabPipelineCounts();
  const { escalatedTests = [] } = usePendingEscalation();
  const { requests: recollectionRequests = [] } = usePendingRecollectionRequests();

  const { displays: collectionDisplays } = useCollectionSampleDisplays({
    samples,
    tests: testCatalog,
    getOrder,
    getPatient,
    getPatientName,
  });

  const entryTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['sample-collected'],
    includePatient: false,
  });

  const validationTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['resulted'],
    onlyUnvalidated: true,
  });

  return useMemo(() => {
    const {
      queueAge,
      blockers,
      ageBuckets,
      priorityMix,
      attentionCandidates,
    } = deriveBoardPipeline({
      collectionDisplays,
      entryTests,
      validationTests,
      escalatedTests,
      recollectionRequests,
      getPatientName,
      getOrder,
    });

    const { attentionItems, attentionTotal } = finalizeAttentionItems(attentionCandidates);
    const todayThroughput = deriveTodayThroughput(orders, samples);
    const totalActive = counts.collection + counts.entry + counts.validation;
    const { health, healthMessage, suggestedTab } = deriveHealth(
      queueAge,
      blockers,
      attentionItems,
    );

    return {
      counts,
      queueAge,
      blockers,
      attentionItems,
      attentionTotal,
      todayThroughput,
      ageBuckets,
      priorityMix,
      health,
      healthMessage,
      suggestedTab,
      totalActive,
    };
  }, [
    collectionDisplays,
    entryTests,
    validationTests,
    counts,
    orders,
    samples,
    getPatientName,
    getOrder,
    escalatedTests,
    recollectionRequests,
  ]);
}
