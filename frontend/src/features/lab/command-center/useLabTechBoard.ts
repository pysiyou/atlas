/**
 * Aggregates live lab state for the lab tech command center board.
 */

import { useMemo } from 'react';
import { useLabDataProvider } from '@/features/lab/hooks';
import { useLabBoard } from '@/features/lab/api/worklists.api';
import { finalizeAttentionItems } from './deriveAttention';
import { deriveBoardPipeline } from './derivePipeline';
import type { LabTechBoardData } from './boardTypes';

export function useLabTechBoard(): LabTechBoardData & { isLoading: boolean } {
  const {
    collectionDisplays,
    entryTests,
    validationTests,
    escalations: escalatedTests,
    recollections: recollectionRequests,
    pipelineCounts: derivedCounts,
    isLoading: dataLoading,
    getPatientName,
    getOrder,
  } = useLabDataProvider();

  const { board: serverBoard, isLoading: boardLoading } = useLabBoard();

  const board = useMemo(() => {
    const {
      queueAge: derivedQueueAge,
      blockers: derivedBlockers,
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

    const counts = serverBoard?.counts ?? derivedCounts;
    const queueAge = (serverBoard?.queueAge as LabTechBoardData['queueAge']) ?? derivedQueueAge;
    const blockers = serverBoard?.blockers ?? derivedBlockers;
    const health = serverBoard?.health ?? 'healthy';
    const healthMessage = serverBoard?.healthMessage ?? 'Queues within TAT';
    const suggestedTab = (serverBoard?.suggestedTab as LabTechBoardData['suggestedTab']) ?? null;

    const totalActive =
      counts.collection + counts.entry + counts.validation + counts.supervisor;

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
    derivedCounts,
    escalatedTests,
    recollectionRequests,
    getPatientName,
    getOrder,
    serverBoard,
  ]);

  return { ...board, isLoading: dataLoading || boardLoading };
}
