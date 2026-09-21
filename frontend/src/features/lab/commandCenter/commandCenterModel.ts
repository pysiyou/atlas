/** Command center board types and attention-queue categories. */
import type { BadgeVariant } from '@/components';
import { LAB_CONFIG, LAB_COPY } from '../constants/labConstants';
import type { OrderTestBlockReason } from '../utils/labQueue';
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
  | 'supervisor_recollection_request'
  | 'payment_blocked'
  | 'sample_rejected'
  | 'recollection_waiting'
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
  badgeVariant: BadgeVariant;
  sortOrder: number;
}

export const ATTENTION_TYPE_CONFIG: Record<AttentionType, AttentionTypeConfig> = {
  escalation_critical: {
    id: 'escalation_critical',
    groupLabel: LAB_COPY.attention.criticalValue,
    pillLabel: 'Critical',
    badgeVariant: 'escalated',
    sortOrder: 10,
  },
  escalation_amendment: {
    id: 'escalation_amendment',
    groupLabel: 'Amended result',
    pillLabel: 'Amended',
    badgeVariant: 'escalated',
    sortOrder: 20,
  },
  escalation_retry_limit: {
    id: 'escalation_retry_limit',
    groupLabel: 'Repeat limit',
    pillLabel: 'Repeat limit',
    badgeVariant: 'escalated',
    sortOrder: 30,
  },
  escalation_recollection_limit: {
    id: 'escalation_recollection_limit',
    groupLabel: 'Recollection limit',
    pillLabel: 'Recollection limit',
    badgeVariant: 'escalated',
    sortOrder: 40,
  },
  supervisor_approval: {
    id: 'supervisor_approval',
    groupLabel: 'Path review',
    pillLabel: 'Path review',
    badgeVariant: 'escalated',
    sortOrder: 45,
  },
  supervisor_recollection_request: {
    id: 'supervisor_recollection_request',
    groupLabel: 'Recollection approval',
    pillLabel: 'Recollection approval',
    badgeVariant: 'escalated',
    sortOrder: 48,
  },
  payment_blocked: {
    id: 'payment_blocked',
    groupLabel: 'Unpaid accession',
    pillLabel: 'Unpaid',
    badgeVariant: 'warning',
    sortOrder: 50,
  },
  sample_rejected: {
    id: 'sample_rejected',
    groupLabel: LAB_COPY.quality.sampleRejected,
    pillLabel: 'Rejected',
    badgeVariant: 'cancelled',
    sortOrder: 60,
  },
  recollection_waiting: {
    id: 'recollection_waiting',
    groupLabel: 'Pending recollection',
    pillLabel: LAB_COPY.attention.recollection,
    badgeVariant: 'warning',
    sortOrder: 70,
  },
  retest_in_progress: {
    id: 'retest_in_progress',
    groupLabel: 'Repeat analysis',
    pillLabel: 'Repeat',
    badgeVariant: 'info',
    sortOrder: 80,
  },
  priority_urgent: {
    id: 'priority_urgent',
    groupLabel: 'STAT',
    pillLabel: 'STAT',
    badgeVariant: 'urgent',
    sortOrder: 82,
  },
  priority_high: {
    id: 'priority_high',
    groupLabel: 'Elevated priority',
    pillLabel: 'High',
    badgeVariant: 'high',
    sortOrder: 84,
  },
  queue_overdue_critical: {
    id: 'queue_overdue_critical',
    groupLabel: `TAT >${LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS}h`,
    pillLabel: `${LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS}h+`,
    badgeVariant: 'danger',
    sortOrder: 90,
  },
  queue_overdue_warning: {
    id: 'queue_overdue_warning',
    groupLabel: `TAT >${LAB_CONFIG.QUEUE_AGE_WARNING_HOURS}h`,
    pillLabel: `${LAB_CONFIG.QUEUE_AGE_WARNING_HOURS}h+`,
    badgeVariant: 'warning',
    sortOrder: 100,
  },
};

/** Display order for feed sections (escalations → blockers → priority → SLA). */
export const ATTENTION_TYPE_ORDER: AttentionType[] = (
  Object.values(ATTENTION_TYPE_CONFIG) as AttentionTypeConfig[]
)
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map(config => config.id);

export function getAttentionTypeConfig(type: AttentionType): AttentionTypeConfig {
  return ATTENTION_TYPE_CONFIG[type];
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

export type LabBoardHealth = 'healthy' | 'attention' | 'critical';

export type LabPipelineStage = 'collection' | 'entry' | 'validation';

export interface QueueAgeStats {
  oldestHours: number | null;
  averageHours: number | null;
  warningCount: number;
  criticalCount: number;
}

export interface LabAttentionQueueItem {
  id: string;
  stage: LabPipelineStage;
  stageLabel: string;
  orderId: number;
  patientName: string;
  priority: PriorityLevel;
  waitingHours: number;
  blockedReason: OrderTestBlockReason | null;
  blockedLabel: string | null;
  queueTab: LabPipelineStage;
  since: string;
  workItemCount: number;
  orderTestIds: number[];
  attentionType: AttentionType;
}

export interface BlockerSummary {
  paymentUnpaid: number;
  retestPending: number;
  recollectionWaiting: number;
  total: number;
}

export interface AgeBuckets {
  fresh: number;
  onTrack: number;
  warning: number;
  critical: number;
}

export interface PriorityMix {
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

export interface DashboardKpis {
  ordersToday: number;
  awaitingResults: number;
  criticalValues: number;
  tatCompliancePercent: number;
  volumeTotal: number;
  volumeWowPercent: number | null;
}

export interface VolumeDayPoint {
  date: string;
  count: number;
}

export interface LabCommandCenterSnapshot {
  counts: { collection: number; entry: number; validation: number; supervisor: number };
  queueAge: Record<LabPipelineStage, QueueAgeStats>;
  blockers: BlockerSummary;
  attentionItems: LabAttentionQueueItem[];
  attentionTotal: number;
  ageBuckets: AgeBuckets;
  priorityMix: PriorityMix;
  health: LabBoardHealth;
  healthMessage: string;
  suggestedTab: LabPipelineStage | null;
  totalActive: number;
  computedAt?: string | null;
  dashboardKpis: DashboardKpis;
  volumeByDay: VolumeDayPoint[];
}

