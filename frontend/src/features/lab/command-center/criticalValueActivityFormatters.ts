/**
 * Critical value category activity formatters.
 */
import { displayId } from '@/utils/id';
import type { LabOperationRecord } from '@/types/lab-operations';
import type { ActivityLines, ActivitySegment } from './activityTypes';

export function formatCriticalValueDetected(log: LabOperationRecord, _performer: string): ActivityLines {
  const testCode = log.operationData?.testCode as string | undefined;
  return [
    [
      { type: 'badge', value: 'Critical value', variant: 'critical' },
      { type: 'text', value: 'was detected for' },
      {
        type: 'badge',
        value: testCode || displayId.orderTest(log.entityId),
        variant: 'info',
        isId: true,
      },
    ],
    [{ type: 'text', value: 'Requires notification per protocol.' }],
  ];
}

export function formatCriticalValueNotified(log: LabOperationRecord, performer: string): ActivityLines {
  const notifiedTo = log.operationData?.notifiedTo as string | undefined;
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'sent a critical value notification' },
      ...(notifiedTo ? [{ type: 'text', value: `to ${notifiedTo}` } as ActivitySegment] : []),
    ],
    [{ type: 'text', value: 'Critical value notification delivered per protocol.' }],
  ];
}

export function formatCriticalValueAcknowledged(
  _log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'acknowledged receipt of the' },
      { type: 'badge', value: 'critical value', variant: 'critical' },
      { type: 'text', value: 'notification' },
    ],
    [{ type: 'text', value: 'Acknowledgment recorded.' }],
  ];
}
