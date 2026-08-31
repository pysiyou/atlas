/**
 * Results & validation category activity formatters.
 */
import { displayId } from '@/utils/id';
import type { LabOperationRecord } from '@/types/lab-operations';
import type { ActivityLines } from './activityTypes';

export function formatResultEntry(log: LabOperationRecord, performer: string): ActivityLines {
  const testCode = log.operationData?.testCode as string | undefined;
  const orderId = log.operationData?.orderId as number | undefined;
  const lines: ActivityLines = [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'entered lab results for' },
      {
        type: 'badge',
        value: testCode || displayId.orderTest(log.entityId),
        variant: 'in-progress',
        isId: true,
      },
    ],
  ];
  if (orderId) {
    lines.push([
      { type: 'text', value: 'Associated order:' },
      {
        type: 'badge',
        value: displayId.order(orderId),
        variant: 'primary',
        isId: true,
        link: `/orders/${orderId}`,
      },
    ]);
  }
  return lines;
}

export function formatResultValidationApprove(log: LabOperationRecord, performer: string): ActivityLines {
  const testCode = log.operationData?.testCode as string | undefined;
  const orderId = log.operationData?.orderId as number | undefined;
  const lines: ActivityLines = [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'validated and approved results for' },
      {
        type: 'badge',
        value: testCode || displayId.orderTest(log.entityId),
        variant: 'validated',
        isId: true,
      },
    ],
    [
      { type: 'text', value: 'Result status:' },
      { type: 'badge', value: 'VALIDATED', variant: 'validated' },
    ],
  ];
  if (orderId) {
    lines.push([
      { type: 'text', value: 'Order:' },
      {
        type: 'badge',
        value: displayId.order(orderId),
        variant: 'primary',
        isId: true,
        link: `/orders/${orderId}`,
      },
    ]);
  }
  return lines;
}

function resultRejectBaseLines(
  log: LabOperationRecord,
  performer: string,
  actionText: string
): ActivityLines[0] {
  const testCode = log.operationData?.testCode as string | undefined;
  const orderId = log.operationData?.orderId as number | undefined;
  return [
    { type: 'name', value: performer },
    { type: 'text', value: actionText },
    {
      type: 'badge',
      value: testCode || displayId.orderTest(log.entityId),
      variant: 'rejected',
      isId: true,
    },
    ...(orderId
      ? [
          { type: 'text' as const, value: 'in' },
          {
            type: 'badge' as const,
            value: displayId.order(orderId),
            variant: 'primary',
            isId: true,
            link: `/orders/${orderId}`,
          },
        ]
      : []),
  ];
}

export function formatResultValidationRejectRetest(
  log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    resultRejectBaseLines(log, performer, 'rejected results for'),
    [
      { type: 'text', value: 'Outcome:' },
      { type: 'badge', value: 'Retest ordered', variant: 're-test' },
      { type: 'text', value: '(same sample to be retested)' },
    ],
  ];
}

export function formatResultValidationRejectRecollect(
  log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    resultRejectBaseLines(log, performer, 'rejected results for'),
    [
      { type: 'text', value: 'Outcome:' },
      { type: 'badge', value: 'Recollection requested', variant: 're-collect' },
      { type: 'text', value: '(new sample required)' },
    ],
  ];
}

export function formatResultValidationEscalate(log: LabOperationRecord, performer: string): ActivityLines {
  const testCode = log.operationData?.testCode as string | undefined;
  const orderId = log.operationData?.orderId as number | undefined;
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'escalated results for' },
      {
        type: 'badge',
        value: testCode || displayId.orderTest(log.entityId),
        variant: 'escalated',
        isId: true,
      },
      ...(orderId
        ? [
            { type: 'text' as const, value: 'in' },
            {
              type: 'badge' as const,
              value: displayId.order(orderId),
              variant: 'primary',
              isId: true,
              link: `/orders/${orderId}`,
            },
          ]
        : []),
    ],
    [
      { type: 'text', value: 'Escalation:' },
      { type: 'badge', value: 'Pending supervisor resolution', variant: 'escalated' },
    ],
  ];
}
