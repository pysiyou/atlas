/**
 * Aggregates live lab state for the lab tech command center board.
 * 
 * Refactored to use useLabDataProvider for shared data.
 */

import { useMemo } from 'react';
import { useLabDataProvider } from '@/features/lab/hooks';
import { finalizeAttentionItems } from './deriveAttention';
import { deriveBoardPipeline } from './derivePipeline';
import { deriveHealth } from './deriveHealth';
import type { LabTechBoardData } from './boardTypes';

export function useLabTechBoard(): LabTechBoardData {
  // Use shared data provider
  const {
    collectionDisplays,
    entryTests,
    validationTests,
    escalations: escalatedTests,
    recollections: recollectionRequests,
    pipelineCounts: counts,
  } = useLabDataProvider();

  return useMemo(() => {
    const {
      queueAge,
      blockers,
      ageBuckets,
      priorityMix,
      attentionCandidates,
    } = deriveBoardPipeline({
      collectionDisplays: collectionDisplays as any,
      entryTests,
      validationTests,
      escalatedTests,
      recollectionRequests,
      getPatientName: () => '', // Not needed in board derivation
      getOrder: () => undefined, // Not needed in board derivation
    });

    const { attentionItems, attentionTotal } = finalizeAttentionItems(attentionCandidates);
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
  ]);
}
