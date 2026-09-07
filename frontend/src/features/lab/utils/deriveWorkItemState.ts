/**
 * deriveWorkItemState — computed queue stage and blockage reason for lab work items.
 *
 * Read-model only: not persisted. Surfaces why a test/sample is waiting or blocked.
 */

import type { OrderTest, PaymentStatus, SampleStatus, TestStatus } from '@/types';

export type WorkItemStage =
  | 'awaiting_collection'
  | 'awaiting_results'
  | 'awaiting_validation'
  | 'awaiting_supervisor'
  | 'completed'
  | 'cancelled';

export type BlockedReason =
  | 'payment_unpaid'
  | 'specimen_recollection'
  | 'specimen_rejected'
  | 'retest_pending'
  | 'critical_value'
  | 'amendment_pending'
  | 'retry_limit'
  | 'recollection_limit';

export interface WorkItemContext {
  paymentStatus?: PaymentStatus;
  sampleStatus?: SampleStatus;
  sampleIsRecollection?: boolean;
  escalationReasonCode?: string | null;
}

export interface WorkItemState {
  stage: WorkItemStage;
  blockedReason: BlockedReason | null;
  label: string;
}

const BLOCKED_LABELS: Record<BlockedReason, string> = {
  payment_unpaid: 'Payment required',
  specimen_recollection: 'Redraw required',
  specimen_rejected: 'Specimen rejected',
  retest_pending: 'Re-test in progress',
  critical_value: 'Critical value — supervisor review',
  amendment_pending: 'Amendment pending',
  retry_limit: 'Re-test limit reached',
  recollection_limit: 'Redraw limit reached',
};

function stageFromTestStatus(status: TestStatus): WorkItemStage {
  switch (status) {
    case 'pending':
      return 'awaiting_collection';
    case 'sample-collected':
      return 'awaiting_results';
    case 'resulted':
      return 'awaiting_validation';
    case 'escalated':
      return 'awaiting_supervisor';
    case 'validated':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'awaiting_collection';
  }
}

/**
 * Derive queue stage and optional blockage reason for an order test.
 */
export function deriveWorkItemState(
  test: Pick<OrderTest, 'status' | 'isRetest'>,
  context: WorkItemContext = {}
): WorkItemState {
  const status = test.status as TestStatus;
  const stage = stageFromTestStatus(status);

  let blockedReason: BlockedReason | null = null;

  if (context.paymentStatus === 'unpaid' && stage === 'awaiting_collection') {
    blockedReason = 'payment_unpaid';
  } else if (status === 'escalated') {
    if (context.escalationReasonCode === 'CRIT-VAL') {
      blockedReason = 'critical_value';
    } else if (context.escalationReasonCode === 'AMEND-RES') {
      blockedReason = 'amendment_pending';
    } else if (context.escalationReasonCode === 'LIMIT-HIT') {
      blockedReason = 'retry_limit';
    } else if (context.escalationReasonCode === 'REJ-SAMP') {
      blockedReason = 'recollection_limit';
    }
  } else if (context.sampleStatus === 'rejected') {
    blockedReason = 'specimen_rejected';
  } else if (context.sampleIsRecollection && stage === 'awaiting_collection') {
    blockedReason = 'specimen_recollection';
  } else if (test.isRetest && stage === 'awaiting_results') {
    blockedReason = 'retest_pending';
  }

  const label = blockedReason ? BLOCKED_LABELS[blockedReason] : stageLabel(stage);

  return { stage, blockedReason, label };
}

function stageLabel(stage: WorkItemStage): string {
  switch (stage) {
    case 'awaiting_collection':
      return 'Awaiting collection';
    case 'awaiting_results':
      return 'Awaiting results';
    case 'awaiting_validation':
      return 'Awaiting validation';
    case 'awaiting_supervisor':
      return 'Supervisor review';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'In progress';
  }
}

export function getBlockedReasonLabel(reason: BlockedReason): string {
  return BLOCKED_LABELS[reason];
}
