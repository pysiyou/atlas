import { LAB_CONFIG } from '@/features/lab/constants';
import {
  getAttentionType,
  isPriorityAttentionType,
  isSupervisorAttentionType,
} from './attentionCategories';
import type { AttentionItem, BlockerSummary, LabTechBoardData } from './boardTypes';

export function deriveHealth(
  queueAge: LabTechBoardData['queueAge'],
  blockers: BlockerSummary,
  attentionItems: AttentionItem[],
): Pick<LabTechBoardData, 'health' | 'healthMessage' | 'suggestedTab'> {
  const criticalCount =
    queueAge.collection.criticalCount +
    queueAge.entry.criticalCount +
    queueAge.validation.criticalCount;

  const warningCount =
    queueAge.collection.warningCount +
    queueAge.entry.warningCount +
    queueAge.validation.warningCount;

  if (criticalCount > 0) {
    const stage =
      (['collection', 'entry', 'validation'] as const).find(
        key => queueAge[key].criticalCount > 0,
      ) ?? 'validation';
    return {
      health: 'critical',
      healthMessage: `${criticalCount} accession${criticalCount === 1 ? '' : 's'} >${LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS}h TAT`,
      suggestedTab: stage,
    };
  }

  const supervisorCount = attentionItems.filter(item =>
    isSupervisorAttentionType(getAttentionType(item)),
  ).length;
  const priorityCount = attentionItems.filter(item =>
    isPriorityAttentionType(getAttentionType(item)),
  ).length;

  if (warningCount > 0 || blockers.total > 0 || supervisorCount > 0 || priorityCount > 0) {
    const parts: string[] = [];
    if (warningCount > 0) {
      parts.push(`${warningCount} >${LAB_CONFIG.QUEUE_AGE_WARNING_HOURS}h TAT`);
    }
    if (supervisorCount > 0) {
      parts.push(`${supervisorCount} path review`);
    }
    if (priorityCount > 0) {
      parts.push(`${priorityCount} STAT/high`);
    }
    if (blockers.paymentUnpaid > 0) {
      parts.push(`${blockers.paymentUnpaid} unpaid hold`);
    }
    if (blockers.retestPending > 0) {
      parts.push(`${blockers.retestPending} repeat pending`);
    }
    if (blockers.recollectionWaiting > 0) {
      parts.push(`${blockers.recollectionWaiting} redraw pending`);
    }

    const topItem = attentionItems[0];
    return {
      health: 'attention',
      healthMessage: parts.join(' · '),
      suggestedTab: topItem?.queueTab ?? null,
    };
  }

  return {
    health: 'healthy',
    healthMessage: 'Queues within TAT',
    suggestedTab: null,
  };
}
