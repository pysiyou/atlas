/** Command center board types and attention-queue categories. */
import { getLabCopy } from '@/strings';
import { ATTENTION_TYPE_SORT } from '@/types/generated/policies';
import { LAB_CONFIG } from '../constants/labConstants';
import type { LabAttentionReason } from '../utils/queueDisplay';
import type { PriorityLevel } from '@/types';

/** Accent severity for attention feed rows */
export type AttentionTone = 'problem' | 'neutral';

/** Why the item surfaced in Needs Attention — one per distinct lab exception or SLA breach. */
export type AttentionType =
  | 'escalation_critical'
  | 'escalation_amendment'
  | 'escalation_retry_limit'
  | 'escalation_recollection_limit'
  | 'supervisor_approval'
  | 'payment_blocked'
  | 'sample_rejected'
  | 'retest_in_progress'
  | 'priority_urgent'
  | 'priority_high'
  | 'queue_overdue_critical'
  | 'queue_overdue_warning';

export interface AttentionTypeConfig {
  id: AttentionType;
  /** Section header in the feed */
  groupLabel: string;
  /** Short label on each row badge */
  pillLabel: string;
  badgeVariant: string;
  sortOrder: number;
}

/** Keys for `value in` checks without capturing copy at module load. */
export const ATTENTION_TYPE_KEYS: Record<AttentionType, true> = {
  escalation_critical: true,
  escalation_amendment: true,
  escalation_retry_limit: true,
  escalation_recollection_limit: true,
  supervisor_approval: true,
  payment_blocked: true,
  sample_rejected: true,
  retest_in_progress: true,
  priority_urgent: true,
  priority_high: true,
  queue_overdue_critical: true,
  queue_overdue_warning: true,
};

/** Display order for feed sections — sort weights come from `lab-policy.json`. */
export const ATTENTION_TYPE_ORDER: AttentionType[] = (
  Object.keys(ATTENTION_TYPE_KEYS) as AttentionType[]
).sort((a, b) => (ATTENTION_TYPE_SORT[a] ?? 999) - (ATTENTION_TYPE_SORT[b] ?? 999));

/** Attention type labels resolved at call time so terminology can load after import. */
function buildAttentionTypeConfig(): Record<AttentionType, AttentionTypeConfig> {
  const copy = getLabCopy();
  return {
    escalation_critical: {
      id: 'escalation_critical',
      groupLabel: copy.attention.criticalValue,
      pillLabel: 'Critical',
      badgeVariant: 'escalated',
      sortOrder: ATTENTION_TYPE_SORT.escalation_critical,
    },
    escalation_amendment: {
      id: 'escalation_amendment',
      groupLabel: 'Amended results',
      pillLabel: 'Amended',
      badgeVariant: 'escalated',
      sortOrder: ATTENTION_TYPE_SORT.escalation_amendment,
    },
    escalation_retry_limit: {
      id: 'escalation_retry_limit',
      groupLabel: 'Repeat analysis limit',
      pillLabel: 'Repeat limit',
      badgeVariant: 'escalated',
      sortOrder: ATTENTION_TYPE_SORT.escalation_retry_limit,
    },
    escalation_recollection_limit: {
      id: 'escalation_recollection_limit',
      groupLabel: 'Recollection limit',
      pillLabel: 'Recollect limit',
      badgeVariant: 'escalated',
      sortOrder: ATTENTION_TYPE_SORT.escalation_recollection_limit,
    },
    supervisor_approval: {
      id: 'supervisor_approval',
      groupLabel: 'Pathologist review',
      pillLabel: 'Review',
      badgeVariant: 'escalated',
      sortOrder: ATTENTION_TYPE_SORT.supervisor_approval,
    },
    payment_blocked: {
      id: 'payment_blocked',
      groupLabel: 'Financial hold',
      pillLabel: 'Unpaid',
      badgeVariant: 'warning',
      sortOrder: ATTENTION_TYPE_SORT.payment_blocked,
    },
    sample_rejected: {
      id: 'sample_rejected',
      groupLabel: 'Pre-analytical rejection',
      pillLabel: 'Rejected',
      badgeVariant: 'cancelled',
      sortOrder: ATTENTION_TYPE_SORT.sample_rejected,
    },
    retest_in_progress: {
      id: 'retest_in_progress',
      groupLabel: 'Repeat analysis',
      pillLabel: 'Repeat',
      badgeVariant: 'info',
      sortOrder: ATTENTION_TYPE_SORT.retest_in_progress,
    },
    priority_urgent: {
      id: 'priority_urgent',
      groupLabel: 'STAT priority',
      pillLabel: 'STAT',
      badgeVariant: 'urgent',
      sortOrder: ATTENTION_TYPE_SORT.priority_urgent,
    },
    priority_high: {
      id: 'priority_high',
      groupLabel: 'High priority',
      pillLabel: 'High',
      badgeVariant: 'high',
      sortOrder: ATTENTION_TYPE_SORT.priority_high,
    },
    queue_overdue_critical: {
      id: 'queue_overdue_critical',
      groupLabel: `Turnaround exceeded (${LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS}h+)`,
      pillLabel: 'Critical TAT',
      badgeVariant: 'danger',
      sortOrder: ATTENTION_TYPE_SORT.queue_overdue_critical,
    },
    queue_overdue_warning: {
      id: 'queue_overdue_warning',
      groupLabel: `Turnaround at risk (${LAB_CONFIG.QUEUE_AGE_WARNING_HOURS}h+)`,
      pillLabel: 'TAT warning',
      badgeVariant: 'warning',
      sortOrder: ATTENTION_TYPE_SORT.queue_overdue_warning,
    },
  };
}

export function getAttentionTypeConfig(type: AttentionType): AttentionTypeConfig {
  return buildAttentionTypeConfig()[type];
}

export function getAttentionTone(type: AttentionType): AttentionTone {
  if (
    type.startsWith('escalation_') ||
    type.startsWith('supervisor_') ||
    type === 'sample_rejected' ||
    type === 'priority_urgent' ||
    type === 'queue_overdue_critical'
  ) {
    return 'problem';
  }
  return 'neutral';
}

export type LabPipelineStage = 'collection' | 'entry' | 'validation';

export interface LabAttentionQueueItem {
  id: string;
  stage: LabPipelineStage;
  stageLabel: string;
  orderId: string;
  patientName: string;
  patientId?: string | null;
  sampleId?: string | null;
  testCodes?: string[];
  priority: PriorityLevel;
  waitingHours: number;
  attentionReason: LabAttentionReason | null;
  attentionLabel: string | null;
  queueTab: LabPipelineStage;
  since: string;
  workItemCount: number;
  orderTestIds: number[];
  attentionType: AttentionType;
}

/** Per pipeline stage metrics for the Today panel. */
export interface LabTodayStageSnapshot {
  stage: 'collection' | 'entry' | 'validation';
  atStage: number;
  atStagePercent: number;
  touchedToday: number;
  touchedTodayPercent: number;
}

/** Today panel — stage queue vs today's milestones (% of monitor universe). */
export interface LabTodayPanelSnapshot {
  dayStartUtc: string;
  /** Denominator for stage percentages (monitor worklist universe). */
  totalTests: number;
  testsUpdatedToday: number;
  stages: LabTodayStageSnapshot[];
}

/** UI state for the lab dashboard board (subset of `/lab/board`). */
export interface LabBoardViewState {
  todayPanel: LabTodayPanelSnapshot;
  attentionItems: LabAttentionQueueItem[];
  attentionTotal: number;
}

