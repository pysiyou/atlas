/**
 * Order category activity formatters: status changes, test add/remove.
 */
import { displayId } from '@/utils/id';
import type { LabOperationRecord } from '@/types/lab-operations';
import type { ActivityLines, ActivitySegment } from './activityTypes';

export function formatOrderStatusChange(log: LabOperationRecord, performer: string): ActivityLines {
  const beforeStatus = log.beforeState?.status as string | undefined;
  const afterStatus = log.afterState?.status as string | undefined;
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'updated the order status for' },
      {
        type: 'badge',
        value: displayId.order(log.entityId),
        variant: 'primary',
        isId: true,
        link: `/orders/${log.entityId}`,
      },
    ],
    [
      { type: 'text', value: 'Status transition:' },
      ...(beforeStatus
        ? [
            {
              type: 'badge',
              value: beforeStatus.toUpperCase(),
              variant: beforeStatus,
            } as ActivitySegment,
          ]
        : []),
      ...(beforeStatus && afterStatus ? [{ type: 'text', value: '→' } as ActivitySegment] : []),
      ...(afterStatus
        ? [
            {
              type: 'badge',
              value: afterStatus.toUpperCase(),
              variant: afterStatus,
            } as ActivitySegment,
          ]
        : []),
    ],
  ];
}

export function formatTestAdded(log: LabOperationRecord, performer: string): ActivityLines {
  const testCode = log.operationData?.testCode as string | undefined;
  const orderId = (log.operationData?.orderId as number) || log.entityId;
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'added test' },
      { type: 'badge', value: testCode || 'test', variant: 'success', isId: !!testCode },
      { type: 'text', value: 'to order' },
      {
        type: 'badge',
        value: displayId.order(orderId),
        variant: 'primary',
        isId: true,
        link: `/orders/${orderId}`,
      },
    ],
  ];
}

export function formatTestRemoved(log: LabOperationRecord, performer: string): ActivityLines {
  const testCode = log.operationData?.testCode as string | undefined;
  const orderId = (log.operationData?.orderId as number) || log.entityId;
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'removed test' },
      { type: 'badge', value: testCode || 'test', variant: 'muted', isId: !!testCode },
      { type: 'text', value: 'from order' },
      {
        type: 'badge',
        value: displayId.order(orderId),
        variant: 'primary',
        isId: true,
        link: `/orders/${orderId}`,
      },
    ],
  ];
}
