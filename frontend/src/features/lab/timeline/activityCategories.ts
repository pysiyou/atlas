/**
 * Timeline event categories — maps LabOperationType values to workflow groups.
 */

import type { LabTimelineLane } from '../constants/labCopy';
import { getLaneDisplay, type LabLaneDisplay } from '../constants/labWorkflowVisual';
import type { TimelineEvent } from '../api/commandCenter.api';
import type { CommandCenterTimelineTone } from './timelineStyles';

export type TimelineEventCategory = LabTimelineLane;

export type TimelineCategoryConfig = LabLaneDisplay;

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
  'order_payment_recorded',
]);

const TYPE_CATEGORY: Record<string, TimelineEventCategory> = {
  sample_collect: 'sample',
  sample_reject: 'sample',
  sample_recollection_request: 'sample',
  recollection_request_created: 'order',
  recollection_request_approved: 'order',
  recollection_request_denied: 'order',
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
  order_payment_recorded: 'order',
};

export const TIMELINE_CATEGORY_CONFIG: Record<TimelineEventCategory, TimelineCategoryConfig> = {
  sample: getLaneDisplay('sample'),
  results: getLaneDisplay('results'),
  validation: getLaneDisplay('validation'),
  escalation: getLaneDisplay('escalation'),
  quality: getLaneDisplay('quality'),
  order: getLaneDisplay('order'),
  composition: getLaneDisplay('composition'),
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
