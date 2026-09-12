/**
 * Attention types — groups queue items by why they need action (not workflow stage).
 */

import type { BadgeVariant } from '@/components/primitives/badgeHelpers';
import type { BlockedReason } from '@/features/lab/utils/deriveWorkItemState';
import { LAB_CONFIG } from '../constants';
import type { AttentionItem } from './hooks/useLabTechBoard';
import type { CommandCenterBadgeTextTone, CommandCenterTimelineTone } from './components/styles';

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
  badgeTextTone: CommandCenterBadgeTextTone;
  sortOrder: number;
}

const BLOCKED_TYPE: Record<BlockedReason, AttentionType> = {
  critical_value: 'escalation_critical',
  amendment_pending: 'escalation_amendment',
  retry_limit: 'escalation_retry_limit',
  recollection_limit: 'escalation_recollection_limit',
  supervisor_review: 'supervisor_approval',
  recollection_approval: 'supervisor_recollection_request',
  payment_unpaid: 'payment_blocked',
  sample_rejected: 'sample_rejected',
  specimen_recollection: 'recollection_waiting',
  retest_pending: 'retest_in_progress',
};

export const ATTENTION_TYPE_CONFIG: Record<AttentionType, AttentionTypeConfig> = {
  escalation_critical: {
    id: 'escalation_critical',
    groupLabel: 'Panic value',
    pillLabel: 'Panic',
    badgeVariant: 'escalated',
    badgeTextTone: 'danger',
    sortOrder: 10,
  },
  escalation_amendment: {
    id: 'escalation_amendment',
    groupLabel: 'Amended result',
    pillLabel: 'Amended',
    badgeVariant: 'escalated',
    badgeTextTone: 'danger',
    sortOrder: 20,
  },
  escalation_retry_limit: {
    id: 'escalation_retry_limit',
    groupLabel: 'Repeat limit',
    pillLabel: 'Repeat limit',
    badgeVariant: 'escalated',
    badgeTextTone: 'danger',
    sortOrder: 30,
  },
  escalation_recollection_limit: {
    id: 'escalation_recollection_limit',
    groupLabel: 'Redraw limit',
    pillLabel: 'Redraw limit',
    badgeVariant: 'escalated',
    badgeTextTone: 'danger',
    sortOrder: 40,
  },
  supervisor_approval: {
    id: 'supervisor_approval',
    groupLabel: 'Path review',
    pillLabel: 'Path review',
    badgeVariant: 'escalated',
    badgeTextTone: 'danger',
    sortOrder: 45,
  },
  supervisor_recollection_request: {
    id: 'supervisor_recollection_request',
    groupLabel: 'Redraw approval',
    pillLabel: 'Redraw approval',
    badgeVariant: 'escalated',
    badgeTextTone: 'danger',
    sortOrder: 48,
  },
  payment_blocked: {
    id: 'payment_blocked',
    groupLabel: 'Unpaid accession',
    pillLabel: 'Unpaid',
    badgeVariant: 'warning',
    badgeTextTone: 'warning',
    sortOrder: 50,
  },
  sample_rejected: {
    id: 'sample_rejected',
    groupLabel: 'Rejected specimen',
    pillLabel: 'Rejected',
    badgeVariant: 'cancelled',
    badgeTextTone: 'danger',
    sortOrder: 60,
  },
  recollection_waiting: {
    id: 'recollection_waiting',
    groupLabel: 'Pending redraw',
    pillLabel: 'Redraw',
    badgeVariant: 'warning',
    badgeTextTone: 'warning',
    sortOrder: 70,
  },
  retest_in_progress: {
    id: 'retest_in_progress',
    groupLabel: 'Repeat analysis',
    pillLabel: 'Repeat',
    badgeVariant: 'info',
    badgeTextTone: 'info',
    sortOrder: 80,
  },
  priority_urgent: {
    id: 'priority_urgent',
    groupLabel: 'STAT',
    pillLabel: 'STAT',
    badgeVariant: 'urgent',
    badgeTextTone: 'danger',
    sortOrder: 82,
  },
  priority_high: {
    id: 'priority_high',
    groupLabel: 'Elevated priority',
    pillLabel: 'High',
    badgeVariant: 'high',
    badgeTextTone: 'warning',
    sortOrder: 84,
  },
  queue_overdue_critical: {
    id: 'queue_overdue_critical',
    groupLabel: `TAT >${LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS}h`,
    pillLabel: `${LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS}h+`,
    badgeVariant: 'danger',
    badgeTextTone: 'danger',
    sortOrder: 90,
  },
  queue_overdue_warning: {
    id: 'queue_overdue_warning',
    groupLabel: `TAT >${LAB_CONFIG.QUEUE_AGE_WARNING_HOURS}h`,
    pillLabel: `${LAB_CONFIG.QUEUE_AGE_WARNING_HOURS}h+`,
    badgeVariant: 'warning',
    badgeTextTone: 'warning',
    sortOrder: 100,
  },
};

/** Display order for feed sections (escalations → blockers → priority → SLA). */
export const ATTENTION_TYPE_ORDER: AttentionType[] = (
  Object.values(ATTENTION_TYPE_CONFIG) as AttentionTypeConfig[]
)
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map(config => config.id);

export function getAttentionType(item: AttentionItem): AttentionType {
  if (item.blockedReason) {
    return BLOCKED_TYPE[item.blockedReason];
  }
  if (item.waitingHours >= LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS) {
    return 'queue_overdue_critical';
  }
  if (item.waitingHours >= LAB_CONFIG.QUEUE_AGE_WARNING_HOURS) {
    return 'queue_overdue_warning';
  }
  if (item.priority === 'urgent') {
    return 'priority_urgent';
  }
  if (item.priority === 'high') {
    return 'priority_high';
  }
  return 'queue_overdue_warning';
}

export function getAttentionTypeConfig(type: AttentionType): AttentionTypeConfig {
  return ATTENTION_TYPE_CONFIG[type];
}

export function getAttentionTone(item: AttentionItem): CommandCenterTimelineTone {
  const type = getAttentionType(item);
  if (
    type.startsWith('escalation_') ||
    type.startsWith('supervisor_') ||
    type === 'sample_rejected' ||
    type === 'priority_urgent'
  ) {
    return 'problem';
  }
  if (type === 'queue_overdue_critical') return 'problem';
  if (
    type === 'payment_blocked' ||
    type === 'recollection_waiting' ||
    type === 'priority_high' ||
    type === 'queue_overdue_warning'
  ) {
    return 'neutral';
  }
  return 'neutral';
}

export function attentionTypeSortKey(type: AttentionType): number {
  return ATTENTION_TYPE_CONFIG[type].sortOrder;
}

export function isSupervisorAttentionType(type: AttentionType): boolean {
  return (
    type.startsWith('escalation_') ||
    type === 'supervisor_approval' ||
    type === 'supervisor_recollection_request'
  );
}

export function isPriorityAttentionType(type: AttentionType): boolean {
  return type === 'priority_urgent' || type === 'priority_high';
}
