/**
 * Per-operation formatters for lab audit logs → activity timeline.
 * Activities are grouped by category (Order, Sample, Results & validation, Escalation, Critical value)
 * with consistent, elaborate message structures and copy.
 */
import { displayId } from '@/utils/ids/idDisplay';
import type { LabOperationRecord, LabOperationType } from '@/types/lab-operations';

export interface ActivitySegment {
  type: 'text' | 'badge' | 'name';
  value: string;
  variant?: string;
  isId?: boolean;
  link?: string;
}

export type ActivityLines = ActivitySegment[][];

type Formatter = (log: LabOperationRecord, performer: string) => ActivityLines;

export function formatPerformerName(name: string): string {
  if (!name) return 'System';
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function formatOperationType(type: LabOperationType): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ─── Order category: status changes, test add/remove ─────────────────────────

function formatOrderStatusChange(log: LabOperationRecord, performer: string): ActivityLines {
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

function formatTestAdded(log: LabOperationRecord, performer: string): ActivityLines {
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

function formatTestRemoved(log: LabOperationRecord, performer: string): ActivityLines {
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

// ─── Sample category: collect, reject, recollection request ───────────────────

function formatSampleCollect(log: LabOperationRecord, performer: string): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'collected sample' },
      { type: 'badge', value: displayId.sample(log.entityId), variant: 'collected', isId: true },
    ],
    [
      { type: 'text', value: 'Sample status set to' },
      { type: 'badge', value: 'COLLECTED', variant: 'collected' },
    ],
  ];
}

function formatSampleReject(log: LabOperationRecord, performer: string): ActivityLines {
  const lines: ActivityLines = [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'rejected sample' },
      { type: 'badge', value: displayId.sample(log.entityId), variant: 'rejected', isId: true },
    ],
    [
      { type: 'text', value: 'Sample status set to' },
      { type: 'badge', value: 'REJECTED', variant: 'rejected' },
    ],
  ];
  if (log.comment) {
    lines.push([
      { type: 'text', value: 'Reason:' },
      { type: 'badge', value: log.comment, variant: 'muted' },
    ]);
  }
  return lines;
}

function formatSampleRecollectionRequest(
  log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'requested a new collection for sample' },
      { type: 'badge', value: displayId.sample(log.entityId), variant: 'pending', isId: true },
    ],
    [
      { type: 'text', value: 'Recollection requested; sample remains' },
      { type: 'badge', value: 'PENDING', variant: 'pending' },
    ],
  ];
}

// ─── Results & validation category: entry, approve, reject (retest/recollect), escalate ───

function formatResultEntry(log: LabOperationRecord, performer: string): ActivityLines {
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

function formatResultValidationApprove(log: LabOperationRecord, performer: string): ActivityLines {
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

function formatResultValidationRejectRetest(
  log: LabOperationRecord,
  performer: string
): ActivityLines {
  const testCode = log.operationData?.testCode as string | undefined;
  const orderId = log.operationData?.orderId as number | undefined;
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'rejected results for' },
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
    ],
    [
      { type: 'text', value: 'Outcome:' },
      { type: 'badge', value: 'Retest ordered', variant: 're-test' },
      { type: 'text', value: '(same sample to be retested)' },
    ],
  ];
}

function formatResultValidationRejectRecollect(
  log: LabOperationRecord,
  performer: string
): ActivityLines {
  const testCode = log.operationData?.testCode as string | undefined;
  const orderId = log.operationData?.orderId as number | undefined;
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'rejected results for' },
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
    ],
    [
      { type: 'text', value: 'Outcome:' },
      { type: 'badge', value: 'Recollection requested', variant: 're-collect' },
      { type: 'text', value: '(new sample required)' },
    ],
  ];
}

function formatResultValidationEscalate(log: LabOperationRecord, performer: string): ActivityLines {
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

// ─── Escalation resolution category ──────────────────────────────────────────

function formatEscalationResolutionAuthorizeRetest(
  _log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'resolved an escalation with outcome' },
      { type: 'badge', value: 'Authorized retest', variant: 'authorize_retest' },
    ],
    [{ type: 'text', value: 'Retest approved; same sample may be retested.' }],
  ];
}

function formatEscalationResolutionFinalReject(
  _log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'resolved an escalation with outcome' },
      { type: 'badge', value: 'Final rejection', variant: 'rejected' },
    ],
    [{ type: 'text', value: 'Result finally rejected; no further action.' }],
  ];
}

// ─── Critical value category ─────────────────────────────────────────────────

function formatCriticalValueDetected(log: LabOperationRecord, _performer: string): ActivityLines {
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

function formatCriticalValueNotified(log: LabOperationRecord, performer: string): ActivityLines {
  const notifiedTo = log.operationData?.notifiedTo as string | undefined;
  const lines: ActivityLines = [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'sent a critical value notification' },
      ...(notifiedTo ? [{ type: 'text', value: `to ${notifiedTo}` } as ActivitySegment] : []),
    ],
    [{ type: 'text', value: 'Critical value notification delivered per protocol.' }],
  ];
  return lines;
}

function formatCriticalValueAcknowledged(
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

// ─── Default (unknown operation type) ────────────────────────────────────────

function formatDefault(log: LabOperationRecord, performer: string): ActivityLines {
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

const FORMATTERS: Partial<Record<LabOperationType, Formatter>> = {
  order_status_change: formatOrderStatusChange,
  test_added: formatTestAdded,
  test_removed: formatTestRemoved,
  sample_collect: formatSampleCollect,
  sample_reject: formatSampleReject,
  sample_recollection_request: formatSampleRecollectionRequest,
  result_entry: formatResultEntry,
  result_validation_approve: formatResultValidationApprove,
  result_validation_reject_retest: formatResultValidationRejectRetest,
  result_validation_reject_recollect: formatResultValidationRejectRecollect,
  result_validation_escalate: formatResultValidationEscalate,
  escalation_resolution_authorize_retest: formatEscalationResolutionAuthorizeRetest,
  escalation_resolution_final_reject: formatEscalationResolutionFinalReject,
  critical_value_detected: formatCriticalValueDetected,
  critical_value_notified: formatCriticalValueNotified,
  critical_value_acknowledged: formatCriticalValueAcknowledged,
};

export interface ActivityItemResult {
  id: number;
  lines: ActivityLines;
  timestamp: Date;
}

export function buildActivityItem(log: LabOperationRecord): ActivityItemResult {
  const performer = formatPerformerName(log.performedByName ?? log.performedBy ?? 'System');
  const formatter = FORMATTERS[log.operationType] ?? formatDefault;
  const lines = formatter(log, performer);
  return {
    id: log.id,
    lines,
    timestamp: new Date(log.performedAt),
  };
}
