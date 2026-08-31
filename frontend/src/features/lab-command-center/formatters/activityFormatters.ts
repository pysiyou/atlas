/**
 * Per-operation formatters for lab audit logs → activity timeline.
 * Activities are grouped by category (Order, Sample, Results & validation, Escalation, Critical value)
 * with consistent, elaborate message structures and copy.
 */
import type { LabOperationRecord, LabOperationType } from '@/types/lab-operations';
import {
  formatPerformerName,
  formatOperationType,
  type ActivityFormatter,
  type ActivityLines,
  type ActivitySegment,
} from './activityTypes';
import {
  formatOrderStatusChange,
  formatTestAdded,
  formatTestRemoved,
} from './orderActivityFormatters';
import {
  formatSampleCollect,
  formatSampleReject,
  formatSampleRecollectionRequest,
} from './sampleActivityFormatters';
import {
  formatResultEntry,
  formatResultValidationApprove,
  formatResultValidationRejectRetest,
  formatResultValidationRejectRecollect,
  formatResultValidationEscalate,
} from './resultActivityFormatters';
import {
  formatEscalationResolutionAuthorizeRetest,
  formatEscalationResolutionFinalReject,
} from './escalationActivityFormatters';
import {
  formatCriticalValueDetected,
  formatCriticalValueNotified,
  formatCriticalValueAcknowledged,
} from './criticalValueActivityFormatters';
import { formatDefault } from './defaultActivityFormatter';

export type { ActivitySegment, ActivityLines };
export { formatPerformerName, formatOperationType };

const FORMATTERS: Partial<Record<LabOperationType, ActivityFormatter>> = {
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
