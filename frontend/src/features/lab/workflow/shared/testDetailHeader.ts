/**
 * Stage-aware header helpers for the unified test detail modal.
 */

import type { LabModalStage } from './DetailModalLayout';
import type { LabWorkItemProjection } from '@/lib/api/types';
import type { Order, OrderTest } from '@/types';
import type { LabModalWorkItem } from '../../types/labQueueChrome';

export type TestDetailHeaderVariant = 'entry' | 'validation' | 'escalation';

export function resolveTestDetailModalStage(
  lab?: LabWorkItemProjection | null,
  status?: string | null
): LabModalStage {
  if (status === 'escalated') return 'escalation';

  const stage = lab?.pipelineStage;
  if (stage === 'entry') return 'entry';
  if (stage === 'validation' || stage === 'completed') return 'validation';
  if (stage === 'collection' || stage === 'cancelled') return 'collection';

  if (
    status === 'resulted' ||
    status === 'validated' ||
    status === 'superseded' ||
    status === 'removed'
  ) {
    return 'validation';
  }
  if (status === 'sample-collected') return 'entry';
  return 'collection';
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
