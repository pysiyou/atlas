import { PRIORITY_LEVEL_VALUES } from '@/types';
import {
  BLOCKED_LABELS,
  BLOCKED_REASON_KEYS,
  type OrderTestBlockReason,
} from '@/types/generated/labBlockers';
import { differenceInHours, parseISO, isValid } from 'date-fns';
import { LAB_CONFIG } from '../constants/labConstants';
import type { OrderTest, TestStatus } from '@/types';

export type { OrderTestBlockReason };
export { BLOCKED_LABELS };

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

const BLOCKED_REASON_SET = new Set<string>(BLOCKED_REASON_KEYS);

export interface LabWorkItemProjectionLike {
  denyReason?: string | null;
  denyMessage?: string | null;
  blockedReason?: string | null;
  blockedLabel?: string | null;
  pipelineStage?: string;
}

export interface OrderTestQueueContext {
  /** Server-driven fields from worklists or order test `lab` projection. */
  serverDenyReason?: string | null;
  serverDenyMessage?: string | null;
  serverBlockedReason?: string | null;
  lab?: LabWorkItemProjectionLike | null;
}

export interface OrderTestQueueState {
  stage: OrderTestQueueStage;
  blockedReason: OrderTestBlockReason | null;
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
 * Derive queue stage and optional blockage reason for an order test.
 */
export function deriveOrderTestQueueState(
  test: Pick<OrderTest, 'status' | 'isRetest'>,
  context: OrderTestQueueContext = {}
): OrderTestQueueState {
  const status = test.status as TestStatus;
  const stage = stageFromTestStatus(status);

  const denyReason =
    context.serverDenyReason ?? context.lab?.denyReason ?? null;
  const denyMessage =
    context.serverDenyMessage ?? context.lab?.denyMessage ?? null;
  const blockedKey =
    context.serverBlockedReason ??
    context.lab?.blockedReason ??
    denyReason;

  if (blockedKey != null || denyMessage != null) {
    const blockedReason =
      blockedKey && BLOCKED_REASON_SET.has(blockedKey)
        ? (blockedKey as OrderTestBlockReason)
        : null;
    const label =
      denyMessage ??
      context.lab?.blockedLabel ??
      (blockedReason ? BLOCKED_LABELS[blockedReason] : stageLabel(stage));
    return { stage, blockedReason, label };
  }

  return { stage, blockedReason: null, label: stageLabel(stage) };
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
      return 'In progress';
  }
}
