/**
 * Stage-aware header helpers for the unified test detail modal.
 */

import type { LabModalStage } from './detailModalLayout';
import type { LabWorkItemProjection } from '@/types/labProjection';
import type { Order, OrderTest } from '@/types';
import type { LabModalWorkItem } from '../../types/labQueueChrome';

export type TestDetailHeaderVariant = 'entry' | 'validation' | 'escalation';

export function resolveTestDetailModalStage(lab?: LabWorkItemProjection | null): LabModalStage {
  const stage = lab?.pipelineStage;
  if (stage === 'escalation') return 'escalation';
  if (stage === 'validation' || stage === 'completed') return 'validation';
  if (stage === 'entry') return 'entry';
  if (stage === 'collection') return 'collection';
  return 'validation';
}

export function resolveTestDetailHeaderVariant(stage: LabModalStage): TestDetailHeaderVariant {
  if (stage === 'escalation') return 'escalation';
  if (stage === 'entry' || stage === 'collection') return 'entry';
  return 'validation';
}

/** Queue-age anchor matches the active pipeline step (same rules as lab queue cards). */
export function resolveTestDetailQueueSince(
  stage: LabModalStage,
  order: Order,
  orderTest: OrderTest,
  workItem: Pick<LabModalWorkItem, 'collectedAt' | 'resultEnteredAt'>
): string | undefined {
  if (stage === 'validation' || stage === 'escalation') {
    return orderTest.resultEnteredAt ?? workItem.collectedAt ?? order.orderDate;
  }
  return workItem.collectedAt ?? order.orderDate;
}

export function countFilledResults(results: OrderTest['results']): number {
  if (!results) return 0;
  return Object.values(results).filter(v => v != null && String(v).trim() !== '').length;
}
