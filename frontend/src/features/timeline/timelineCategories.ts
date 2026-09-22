/** Timeline event categories — aligned with backend TimelineCategory. */
import type { TimelineEvent } from '@/features/lab/api/labCommandCenter';

/** Backend-aligned filter buckets (presets). */
export type TimelineCategory = 'order' | 'payment' | 'sample' | 'result' | 'other';

/**
 * Display lanes for the activity feed — maps lab workflow to readable feed categories.
 * Accession → billing → specimen → analytical results → quality & safety → oversight.
 */
export type TimelineFeedKind =
  | 'accession'
  | 'billing'
  | 'specimen'
  | 'analytical'
  | 'quality'
  | 'oversight';

export type TimelineTone = 'neutral' | 'problem' | 'resolution';

export const TIMELINE_CATEGORY_ORDER: TimelineCategory[] = [
  'order',
  'payment',
  'sample',
  'result',
  'other',
];

export const TIMELINE_FEED_KIND_ORDER: TimelineFeedKind[] = [
  'accession',
  'billing',
  'specimen',
  'analytical',
  'quality',
  'oversight',
];

export const TIMELINE_PRESET_CATEGORIES: Record<
  'lab' | 'order' | 'commandCenter' | 'all',
  TimelineCategory[] | null
> = {
  lab: ['sample', 'result', 'other'],
  order: null,
  commandCenter: ['sample', 'result', 'other', 'order', 'payment'],
  all: null,
};

/** Command-center feed minus order lifecycle events (test add/remove, order status). */
export const ENTITY_MODAL_TIMELINE_CATEGORIES: TimelineCategory[] = [
  'sample',
  'result',
  'other',
  'payment',
];

const OPERATION_CATEGORY: Record<string, TimelineCategory> = {
  sample_collect: 'sample',
  sample_reject: 'sample',
  sample_recollection_request: 'sample',
  result_entry: 'result',
  result_validation_approve: 'result',
  critical_value_detected: 'result',
  critical_value_notified: 'result',
  critical_value_acknowledged: 'result',
  quality_issue_reported: 'result',
  test_added: 'order',
  test_removed: 'order',
  order_status_change: 'order',
  order_payment_recorded: 'payment',
  recollection_request_created: 'other',
  recollection_request_approved: 'other',
  recollection_request_denied: 'other',
  escalation_trigger_crit_val: 'other',
  escalation_trigger_rej_samp: 'other',
  escalation_trigger_limit_hit: 'other',
  escalation_trigger_amend_res: 'other',
  escalation_resolution_authorize_retest: 'other',
  escalation_resolution_authorize_recollect: 'other',
  escalation_resolution_force_validate: 'other',
  escalation_resolution_apply_amendment: 'other',
  escalation_resolution_cancel_test: 'other',
};

const QUALITY_EVENT_TYPES = new Set([
  'critical_value_detected',
  'critical_value_notified',
  'critical_value_acknowledged',
  'quality_issue_reported',
]);

const PROBLEM_TYPES = new Set([
  'sample_reject',
  'quality_issue_reported',
  'critical_value_detected',
  'critical_value_notified',
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

function metaString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
}

function qualityStage(event: TimelineEvent): string | null {
  return (
    metaString(event.metadata.stage) ??
    metaString(event.afterState?.stage) ??
    null
  );
}

export function resolveCategory(event: TimelineEvent): TimelineCategory {
  const apiCategory = event.category;
  if (
    apiCategory === 'order' ||
    apiCategory === 'payment' ||
    apiCategory === 'sample' ||
    apiCategory === 'result' ||
    apiCategory === 'other'
  ) {
    return apiCategory;
  }

  if (event.type === 'quality_issue_reported' && qualityStage(event) === 'collection') {
    return 'sample';
  }

  return OPERATION_CATEGORY[event.type] ?? 'other';
}

/** Feed category for presentation — splits analytical work from quality & safety. */
export function resolveFeedKind(event: TimelineEvent): TimelineFeedKind {
  const category = resolveCategory(event);
  switch (category) {
    case 'order':
      return 'accession';
    case 'payment':
      return 'billing';
    case 'sample':
      return 'specimen';
    case 'other':
      return 'oversight';
    case 'result':
      return QUALITY_EVENT_TYPES.has(event.type) ? 'quality' : 'analytical';
    default:
      return 'oversight';
  }
}

export function resolveTone(event: TimelineEvent): TimelineTone {
  const apiTone = event.tone;
  if (apiTone === 'neutral' || apiTone === 'problem' || apiTone === 'resolution') {
    return apiTone;
  }
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

export function categoriesForPreset(
  preset: keyof typeof TIMELINE_PRESET_CATEGORIES,
): TimelineCategory[] | null {
  return TIMELINE_PRESET_CATEGORIES[preset];
}

export function filterEventsByCategories(
  events: TimelineEvent[],
  allowed: TimelineCategory[] | null,
): TimelineEvent[] {
  if (!allowed) return events;
  const set = new Set(allowed);
  return events.filter(event => set.has(resolveCategory(event)));
}
