/**
 * Aggregates live lab state for the lab tech command center board.
 */

import { useMemo } from 'react';
import { useLabDataProvider } from '@/features/lab/hooks';
import { finalizeAttentionItems } from './deriveAttention';
import { deriveBoardPipeline } from './derivePipeline';
import { deriveHealth } from './deriveHealth';
import type { LabTechBoardData } from './boardTypes';

export function useLabTechBoard(): LabTechBoardData & { isLoading: boolean } {
  const {
    collectionDisplays,
    entryTests,
    validationTests,
    escalations: escalatedTests,
    recollections: recollectionRequests,
    pipelineCounts: counts,
    isLoading,
    getPatientName,
    getOrder,
  } = useLabDataProvider();

  const board = useMemo(() => {
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
      getPatientName: patientId => getPatientName(patientId),
      getOrder: orderId => getOrder(orderId),
    });

    const { attentionItems, attentionTotal } = finalizeAttentionItems(attentionCandidates);
    const totalActive =
      counts.collection + counts.entry + counts.validation + counts.supervisor;
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
    escalatedTests,
    recollectionRequests,
    getPatientName,
    getOrder,
  ]);

  return { ...board, isLoading };
}
