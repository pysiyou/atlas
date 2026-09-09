/**
 * Timeline event categories — maps LabOperationType values to workflow groups.
 */

import type { IconName } from '@/components';
import { ICONS } from '@/config/icons';
import type { TimelineEvent } from '../api/monitoring.api';
import type { CommandCenterTimelineTone } from './commandCenterStyles';

export type TimelineEventCategory =
  | 'specimen'
  | 'results'
  | 'validation'
  | 'escalation'
  | 'quality'
  | 'order';

export interface TimelineCategoryConfig {
  id: TimelineEventCategory;
  label: string;
  icon: IconName;
  pillClass: string;
  iconWrapClass: string;
  iconClass: string;
}

const PROBLEM_TYPES = new Set([
  'sample_reject',
  'quality_issue_reported',
  'critical_value_detected',
  'critical_value_notified',
  'escalation_trigger_crit_val',
  'escalation_trigger_rej_samp',
  'escalation_trigger_limit_hit',
  'escalation_trigger_amend_res',
  'recollection_request_denied',
  'test_removed',
  'escalation_resolution_cancel_test',
  'sample_recollection_request',
  'recollection_request_created',
]);

const RESOLUTION_TYPES = new Set([
  'result_validation_approve',
  'critical_value_acknowledged',
  'recollection_request_approved',
  'escalation_resolution_authorize_retest',
  'escalation_resolution_authorize_recollect',
  'escalation_resolution_force_validate',
  'escalation_resolution_apply_amendment',
]);

const TYPE_CATEGORY: Record<string, TimelineEventCategory> = {
  sample_collect: 'specimen',
  sample_reject: 'specimen',
  sample_recollection_request: 'specimen',
  recollection_request_created: 'specimen',
  recollection_request_approved: 'specimen',
  recollection_request_denied: 'specimen',
  result_entry: 'results',
  critical_value_detected: 'results',
  critical_value_notified: 'results',
  critical_value_acknowledged: 'results',
  result_validation_approve: 'validation',
  escalation_trigger_crit_val: 'escalation',
  escalation_trigger_rej_samp: 'escalation',
  escalation_trigger_limit_hit: 'escalation',
  escalation_trigger_amend_res: 'escalation',
  escalation_resolution_authorize_retest: 'escalation',
  escalation_resolution_authorize_recollect: 'escalation',
  escalation_resolution_force_validate: 'escalation',
  escalation_resolution_apply_amendment: 'escalation',
  escalation_resolution_cancel_test: 'escalation',
  quality_issue_reported: 'quality',
  test_added: 'order',
  test_removed: 'order',
  order_status_change: 'order',
};

export const TIMELINE_CATEGORY_CONFIG: Record<TimelineEventCategory, TimelineCategoryConfig> = {
  specimen: {
    id: 'specimen',
    label: 'Specimen',
    icon: ICONS.lab.sampleTube,
    pillClass: 'bg-info-bg text-info-fg-emphasis border-info-fg/20',
    iconWrapClass: 'bg-info-bg border-info-fg/15',
    iconClass: 'text-info-fg-emphasis',
  },
  results: {
    id: 'results',
    label: 'Results',
    icon: ICONS.lab.flask,
    pillClass: 'bg-warning-bg text-warning-fg-emphasis border-warning-fg/20',
    iconWrapClass: 'bg-warning-bg border-warning-fg/15',
    iconClass: 'text-warning-fg-emphasis',
  },
  validation: {
    id: 'validation',
    label: 'Validation',
    icon: ICONS.actions.checkCircle,
    pillClass: 'bg-success-bg text-success-fg-emphasis border-success-fg/20',
    iconWrapClass: 'bg-success-bg border-success-fg/15',
    iconClass: 'text-success-fg-emphasis',
  },
  escalation: {
    id: 'escalation',
    label: 'Escalation',
    icon: ICONS.actions.alertCircle,
    pillClass: 'bg-danger-bg text-danger-fg-emphasis border-danger-fg/20',
    iconWrapClass: 'bg-danger-bg border-danger-fg/15',
    iconClass: 'text-danger-fg-emphasis',
  },
  quality: {
    id: 'quality',
    label: 'Quality',
    icon: ICONS.actions.warning,
    pillClass: 'bg-warning-bg text-warning-fg-emphasis border-warning-fg/20',
    iconWrapClass: 'bg-warning-bg border-warning-fg/15',
    iconClass: 'text-warning-fg-emphasis',
  },
  order: {
    id: 'order',
    label: 'Order',
    icon: ICONS.dataFields.document,
    pillClass: 'bg-tone-neutral-bg text-text-secondary border-border-default',
    iconWrapClass: 'bg-tone-neutral-bg border-border-default',
    iconClass: 'text-text-secondary',
  },
};

export function getEventCategory(type: string): TimelineEventCategory {
  return TYPE_CATEGORY[type] ?? 'order';
}

export function getEventTone(event: TimelineEvent): CommandCenterTimelineTone {
  const { type } = event;
  if (
    PROBLEM_TYPES.has(type) ||
    type.includes('reject') ||
    type.startsWith('escalation_trigger_')
  ) {
    return 'problem';
  }
  if (RESOLUTION_TYPES.has(type) || type.startsWith('escalation_resolution_')) {
    return 'resolution';
  }
  return 'neutral';
}

export function getCategoryConfig(category: TimelineEventCategory): TimelineCategoryConfig {
  return TIMELINE_CATEGORY_CONFIG[category];
}
