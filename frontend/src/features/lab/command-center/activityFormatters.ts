/**
 * Per-operation formatters for lab audit logs → activity timeline.
 * Activities are grouped by category (Order, Sample, Results & validation, Escalation, Critical value)
 * with consistent, elaborate message structures and copy.
 */
import { displayId } from '@/utils/id';
import type { LabOperationRecord, LabOperationType } from '@/types/lab-operations';

// ---------------------------------------------------------------------------
// Types & shared utilities
// ---------------------------------------------------------------------------

export interface ActivitySegment {
  type: 'text' | 'badge' | 'name';
  value: string;
  variant?: string;
  isId?: boolean;
  link?: string;
}

export type ActivityLines = ActivitySegment[][];

type ActivityFormatter = (log: LabOperationRecord, performer: string) => ActivityLines;

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

// ---------------------------------------------------------------------------
// Default formatter
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Order formatters
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Sample formatters
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Results & validation formatters
// ---------------------------------------------------------------------------

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
        variant: 'resulted',
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

// ---------------------------------------------------------------------------
// Escalation resolution formatters
// ---------------------------------------------------------------------------

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
      { type: 'badge', value: 'Test cancelled', variant: 'cancelled' },
    ],
    [{ type: 'text', value: 'Test cancelled; no further action.' }],
  ];
}

function formatEscalationResolutionForceValidate(
  _log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'resolved an escalation with outcome' },
      { type: 'badge', value: 'Force validated', variant: 'approved' },
    ],
    [{ type: 'text', value: 'Supervisor override; results released.' }],
  ];
}

function formatEscalationResolutionAuthorizeRecollect(
  _log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'resolved an escalation with outcome' },
      { type: 'badge', value: 'Authorized re-collect', variant: 'authorize_recollect' },
    ],
    [{ type: 'text', value: 'New sample and test created for re-collection.' }],
  ];
}

// ---------------------------------------------------------------------------
// Critical value formatters
// ---------------------------------------------------------------------------

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
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'sent a critical value notification' },
      ...(notifiedTo ? [{ type: 'text', value: `to ${notifiedTo}` } as ActivitySegment] : []),
    ],
    [{ type: 'text', value: 'Critical value notification delivered per protocol.' }],
  ];
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

// ---------------------------------------------------------------------------
// Formatter registry & public API
// ---------------------------------------------------------------------------

const FORMATTERS: Partial<Record<LabOperationType, ActivityFormatter>> = {
  order_status_change: formatOrderStatusChange,
  test_added: formatTestAdded,
  test_removed: formatTestRemoved,
  sample_collect: formatSampleCollect,
  sample_reject: formatSampleReject,
  sample_recollection_request: formatSampleRecollectionRequest,
  result_entry: formatResultEntry,
  result_validation_approve: formatResultValidationApprove,
  quality_issue_reported: formatResultValidationEscalate,
  escalation_resolution_apply_amendment: formatEscalationResolutionForceValidate,
  escalation_resolution_cancel_test: formatEscalationResolutionFinalReject,
  escalation_resolution_authorize_retest: formatEscalationResolutionAuthorizeRetest,
  escalation_resolution_authorize_recollect: formatEscalationResolutionAuthorizeRecollect,
  escalation_resolution_force_validate: formatEscalationResolutionForceValidate,
  critical_value_detected: formatCriticalValueDetected,
  critical_value_notified: formatCriticalValueNotified,
  critical_value_acknowledged: formatCriticalValueAcknowledged,
};

export interface ActivityItemResult {
  id: number;
  lines: ActivityLines;
  timestamp: Date;
  /** Subtle dot color hint — no extra UI chrome. */
  emphasis: 'normal' | 'warning' | 'critical';
}

const CRITICAL_TYPES: LabOperationType[] = [
  'critical_value_detected',
  'critical_value_notified',
  'critical_value_acknowledged',
  'escalation_trigger_crit_val',
  'escalation_trigger_rej_samp',
  'escalation_trigger_limit_hit',
  'escalation_trigger_amend_res',
];

const WARNING_TYPES: LabOperationType[] = ['sample_reject', 'quality_issue_reported'];

function getEmphasis(type: LabOperationType): ActivityItemResult['emphasis'] {
  if (CRITICAL_TYPES.includes(type)) return 'critical';
  if (WARNING_TYPES.includes(type)) return 'warning';
  return 'normal';
}

export function buildActivityItem(log: LabOperationRecord): ActivityItemResult {
  const performer = formatPerformerName(log.performedByName ?? log.performedBy ?? 'System');
  const formatter = FORMATTERS[log.operationType] ?? formatDefault;
  const lines = formatter(log, performer);
  return {
    id: log.id,
    lines,
    timestamp: new Date(log.performedAt),
    emphasis: getEmphasis(log.operationType),
  };
}
