/**
 * Default formatter for unknown lab operation types.
 */
import { displayId } from '@/utils/id';
import type { LabOperationRecord } from '@/types/lab-operations';
import { formatOperationType, type ActivityLines } from './activityTypes';

export function formatDefault(log: LabOperationRecord, performer: string): ActivityLines {
  const entityDisplayId =
    log.entityType === 'order'
      ? displayId.order(log.entityId)
      : log.entityType === 'sample'
        ? displayId.sample(log.entityId)
        : displayId.orderTest(log.entityId);
  const orderLink = log.entityType === 'order' ? `/orders/${log.entityId}` : undefined;
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: formatOperationType(log.operationType).toLowerCase() },
      { type: 'badge', value: entityDisplayId, variant: 'neutral', isId: true, link: orderLink },
    ],
  ];
}
