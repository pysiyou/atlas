import { PRIORITY_LEVEL_VALUES } from '@/types';
import {
  ATTENTION_LABELS,
  ATTENTION_REASON_KEYS,
  reasonBlocksProgress,
  type LabAttentionReason,
} from '@/types/generated/labBlockers';
import { differenceInHours, parseISO, isValid } from 'date-fns';
import { LAB_CONFIG } from '../constants/labConstants';
import type { OrderTest, TestStatus } from '@/types';

export type { LabAttentionReason };
export { ATTENTION_LABELS };

/** Lab queue priority, age, and derived work-item state. */

const PRIORITY_RANK: Record<string, number> = Object.fromEntries(
  PRIORITY_LEVEL_VALUES.map((level, index) => [level, index])
);

export function compareQueuePriority(
  aPriority: string | undefined,
  bPriority: string | undefined,
  aSince: string | undefined,
  bSince: string | undefined
): number {
  const aRank = PRIORITY_RANK[aPriority ?? 'medium'] ?? 1;
  const bRank = PRIORITY_RANK[bPriority ?? 'medium'] ?? 1;
  if (aRank !== bRank) {
    return bRank - aRank;
  }

  const aTime = aSince ? new Date(aSince).getTime() : Number.MAX_SAFE_INTEGER;
  const bTime = bSince ? new Date(bSince).getTime() : Number.MAX_SAFE_INTEGER;
  return aTime - bTime;
}

type QueueAgeVariant = 'default' | 'warning' | 'danger';

export interface QueueAgeInfo {
  label: string;
  variant: QueueAgeVariant;
  hours: number;
}

/** Computes queue age label and urgency variant from an ISO timestamp. */
export function getQueueAgeInfo(
  since: string | undefined | null,
  turnaroundHours?: number
): QueueAgeInfo | null {
  if (!since) return null;

  const date = parseISO(since);
  if (!isValid(date)) return null;

  const hours = Math.max(0, differenceInHours(new Date(), date));
  const label = hours < 1 ? '<1h waiting' : `${hours}h waiting`;

  const warningThreshold =
    turnaroundHours != null && turnaroundHours > 0
      ? Math.min(turnaroundHours * 0.5, LAB_CONFIG.QUEUE_AGE_WARNING_HOURS)
      : LAB_CONFIG.QUEUE_AGE_WARNING_HOURS;
  const criticalThreshold =
    turnaroundHours != null && turnaroundHours > 0
      ? Math.min(turnaroundHours, LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS)
      : LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS;

  let variant: QueueAgeVariant = 'default';
  if (hours >= criticalThreshold) {
    variant = 'danger';
  } else if (hours >= warningThreshold) {
    variant = 'warning';
  }

  return { label, variant, hours };
}

export type OrderTestQueueStage =
  | 'awaiting_collection'
  | 'awaiting_results'
  | 'awaiting_validation'
  | 'awaiting_supervisor'
  | 'completed'
  | 'cancelled';

const ATTENTION_REASON_SET = new Set<string>(ATTENTION_REASON_KEYS);

export interface LabWorkItemProjectionLike {
  denyReason?: string | null;
  denyMessage?: string | null;
  attentionReason?: string | null;
  attentionLabel?: string | null;
  pipelineStage?: string;
  allowedActions?: {
    collect?: boolean;
    enterResults?: boolean;
    validate?: boolean;
    reject?: boolean;
  };
}

type LabWorklistAction = 'collect' | 'enterResults' | 'validate' | 'reject';

/**
 * Fail closed: missing server flags mean the action is denied.
 */
export function isLabActionAllowed(
  allowedActions: LabWorkItemProjectionLike['allowedActions'] | undefined,
  action: LabWorklistAction
): boolean {
  return allowedActions?.[action] === true;
}

function stageFromPipeline(pipelineStage?: string): OrderTestQueueStage | null {
  switch (pipelineStage) {
    case 'collection':
      return 'awaiting_collection';
    case 'entry':
      return 'awaiting_results';
    case 'validation':
      return 'awaiting_validation';
    case 'escalation':
      return 'awaiting_supervisor';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return null;
  }
}

export interface OrderTestQueueContext {
  /** Server-driven fields from worklists or order test `lab` projection. */
  serverDenyReason?: string | null;
  serverDenyMessage?: string | null;
  serverAttentionReason?: string | null;
  lab?: LabWorkItemProjectionLike | null;
}

export interface OrderTestQueueState {
  stage: OrderTestQueueStage;
  attentionReason: LabAttentionReason | null;
  label: string;
}

function stageFromTestStatus(status: TestStatus): OrderTestQueueStage {
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
 * Derive queue stage and optional attention reason for an order test.
 */
export function deriveOrderTestQueueState(
  test: Pick<OrderTest, 'status' | 'isRetest'>,
  context: OrderTestQueueContext = {}
): OrderTestQueueState {
  const status = test.status as TestStatus;
  const stage = stageFromPipeline(context.lab?.pipelineStage) ?? stageFromTestStatus(status);

  const denyReason = context.serverDenyReason ?? context.lab?.denyReason ?? null;
  const denyMessage = context.serverDenyMessage ?? context.lab?.denyMessage ?? null;
  const attentionKey =
    context.serverAttentionReason ?? context.lab?.attentionReason ?? null;

  const attentionReason =
    attentionKey && ATTENTION_REASON_SET.has(attentionKey)
      ? (attentionKey as LabAttentionReason)
      : null;

  if (denyReason != null || denyMessage != null) {
    const label =
      denyMessage ??
      (denyReason && ATTENTION_REASON_SET.has(denyReason)
        ? ATTENTION_LABELS[denyReason as LabAttentionReason]
        : stageLabel(stage));
    return {
      stage,
      attentionReason: reasonBlocksProgress(denyReason) ? (denyReason as LabAttentionReason) : attentionReason,
      label,
    };
  }

  if (attentionReason != null && reasonBlocksProgress(attentionReason)) {
    const label =
      context.lab?.attentionLabel ?? ATTENTION_LABELS[attentionReason] ?? stageLabel(stage);
    return { stage, attentionReason, label };
  }

  return { stage, attentionReason: null, label: stageLabel(stage) };
}

function stageLabel(stage: OrderTestQueueStage): string {
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
      return 'Running';
  }
}
