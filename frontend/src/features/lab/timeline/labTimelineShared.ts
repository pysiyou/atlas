/** Shared lab timeline styles, detail chips, and category helpers. */
import { displayId } from '@/utils';
import type { TimelineEvent } from '../api/labCommandCenter';
import type { LabTimelineLane } from '../constants/labConstants';
import { getLaneDisplay, type LabLaneDisplay } from '../constants/labConstants';

export type CommandCenterTimelineTone = 'problem' | 'resolution' | 'neutral';

export const COMMAND_CENTER_TIMELINE = {
  toneDot: {
    problem: 'bg-danger-fg-emphasis',
    resolution: 'bg-success-fg-emphasis',
    neutral: 'bg-brand',
  } satisfies Record<CommandCenterTimelineTone, string>,
  connectorStem: 'bg-brand',
  eventDot: 'relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-surface',
  eventDotTrack: 'relative flex w-2.5 shrink-0 flex-col items-center self-stretch',
  eventConnectorStem:
    'pointer-events-none absolute top-[1.375rem] bottom-0 w-px -translate-x-1/2 left-1/2',
  groupHeader: 'flex items-center gap-2 py-2 sticky top-0 z-1 bg-surface/95 backdrop-blur-sm',
  groupDivider: 'flex-1 h-px bg-border-subtle',
  groupLabel: 'text-xxs font-light text-text-tertiary uppercase tracking-widest',
  eventRow: 'flex items-start gap-2.5 relative',
  eventBody: 'flex-1 min-w-0 pb-3',
  eventTitleRow: 'flex flex-wrap items-center gap-x-2 gap-y-1',
  eventAction: 'text-sm font-light text-text-primary',
  eventDetails: 'flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-0.5',
  eventDetailText: 'text-xs font-normal text-text-secondary',
  eventMeta: 'text-xs text-text-tertiary mt-1',
  loadMore: 'px-4 py-2 flex justify-center border-t border-border-subtle',
  retryLink: 'text-sm text-brand hover:underline',
  retryLinkDisabled: 'text-sm text-brand hover:underline disabled:opacity-60',
} as const;

export type EventDetail =
  | { type: 'text'; value: string }
  | { type: 'id'; value: string }
  | {
      type: 'entityRef';
      entityType: 'sample' | 'order_test';
      entityId: number;
      value: string;
    }
  | { type: 'note'; value: string }
  | { type: 'testCode'; value: string }
  | { type: 'status'; value: string }
  | { type: 'sampleType'; value: string };

export interface FormattedTimelineEvent {
  action: string;
  details: EventDetail[];
  note?: string;
}

export function metaString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
}

export function formatTestCodes(meta: Record<string, unknown>): string {
  const codes = meta.testCodes;
  if (Array.isArray(codes) && codes.length > 0) {
    return codes.map(code => String(code)).join('/');
  }
  if (meta.testCode) return String(meta.testCode);
  return 'Test';
}

export function sampleRef(sampleId: unknown): EventDetail | null {
  const id = Number(sampleId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    type: 'entityRef',
    entityType: 'sample',
    entityId: id,
    value: displayId.sample(id),
  };
}

export function testRef(testId: unknown): EventDetail | null {
  const id = Number(testId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    type: 'entityRef',
    entityType: 'order_test',
    entityId: id,
    value: displayId.orderTest(id),
  };
}

export function testIdFromEvent(event: TimelineEvent): number | undefined {
  if (event.entityType === 'test' || event.entityType === 'order_test') {
    return event.entityId;
  }
  const fromMeta = Number(event.metadata.orderTestId ?? event.metadata.escalatedTestId);
  return Number.isFinite(fromMeta) && fromMeta > 0 ? fromMeta : undefined;
}

export function testTransitionDetails(
  meta: Record<string, unknown>,
  event?: TimelineEvent,
): EventDetail[] {
  const details: EventDetail[] = [];
  const sourceId =
    meta.escalatedTestId ?? meta.orderTestId ?? (event ? testIdFromEvent(event) : undefined);
  const source = testRef(sourceId);
  const target = testRef(meta.newTestId);

  if (source) details.push(source);
  if (target) {
    if (source) details.push({ type: 'text', value: '→' });
    details.push(target);
  }
  return details;
}

export function appendNote(
  event: TimelineEvent,
  formatted: FormattedTimelineEvent,
): FormattedTimelineEvent {
  const note = metaString(event.comment);
  if (!note) return formatted;
  const detailText = formatted.details
    .filter(d => d.type === 'text' || d.type === 'note')
    .map(d => d.value)
    .join(' ');
  if (detailText.includes(note)) return formatted;
  return { ...formatted, note };
}

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

