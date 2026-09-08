/**
 * Timeline event formatting — maps audit log events to display labels and detail chips.
 */
/* eslint-disable max-lines -- single registry for all audit event type handlers */

import { displayId } from '@/utils';
import type { TimelineEvent } from '../api/monitoring.api';

export type EventDetail =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; to: string }
  | { type: 'id'; value: string }
  | { type: 'note'; value: string }
  | { type: 'testCode'; value: string }
  | { type: 'status'; value: string }
  | { type: 'sampleType'; value: string };

export interface FormattedTimelineEvent {
  action: string;
  details: EventDetail[];
  note?: string;
}

type EventHandler = (event: TimelineEvent) => FormattedTimelineEvent;

// --- metadata helpers ---

function metaString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
}

function formatTestCodes(meta: Record<string, unknown>): string {
  const codes = meta.testCodes;
  if (Array.isArray(codes) && codes.length > 0) {
    return codes.map(code => String(code)).join('/');
  }
  if (meta.testCode) return String(meta.testCode);
  return 'Test';
}

function getStatusValue(event: TimelineEvent): string | null {
  const status = event.afterState?.status;
  return typeof status === 'string' ? status : null;
}

function entityRoute(event: TimelineEvent): string {
  if (event.entityType === 'order') return `/orders/${event.entityId}`;
  if (event.entityType === 'sample') return '/laboratory/collection';
  return `/orders/${event.metadata.orderId ?? ''}`;
}

// --- detail builders ---

function orderLink(orderId: unknown): EventDetail | null {
  const id = Number(orderId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { type: 'link', value: displayId.order(id), to: `/orders/${id}` };
}

function sampleRef(sampleId: unknown): EventDetail | null {
  const id = Number(sampleId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { type: 'id', value: displayId.sample(id) };
}

function testRef(testId: unknown): EventDetail | null {
  const id = Number(testId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { type: 'id', value: displayId.orderTest(id) };
}

function testOnOrder(meta: Record<string, unknown>): EventDetail[] {
  const details: EventDetail[] = [{ type: 'testCode', value: formatTestCodes(meta) }];
  const link = orderLink(meta.orderId);
  if (link) details.push({ type: 'text', value: 'for order' }, link);
  return details;
}

function testCompletedDetails(meta: Record<string, unknown>): EventDetail[] {
  const details = testOnOrder(meta);
  if (meta.orderCompleted === true) {
    details.push({ type: 'text', value: '→' }, { type: 'status', value: 'completed' });
  }
  return details;
}

function orderAndTestDetails(meta: Record<string, unknown>): EventDetail[] {
  const details: EventDetail[] = [];
  if (meta.testCode || meta.testCodes) {
    details.push({ type: 'testCode', value: formatTestCodes(meta) });
  }
  const link = orderLink(meta.orderId);
  if (link) {
    if (details.length > 0) details.push({ type: 'text', value: 'for order' });
    details.push(link);
  }
  const sample = sampleRef(meta.sampleId);
  if (sample) details.push({ type: 'text', value: 'on' }, sample);
  return details;
}

function escalationTriggerDetails(meta: Record<string, unknown>): EventDetail[] {
  const details = testOnOrder(meta);
  const reason = metaString(meta.reasonCode);
  if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
  return details;
}

function entityDetails(event: TimelineEvent): EventDetail[] {
  const { entityType, entityId, metadata } = event;
  switch (entityType) {
    case 'order': {
      const link = orderLink(entityId);
      return link ? [link] : [{ type: 'id', value: displayId.order(entityId) }];
    }
    case 'sample':
      return [{ type: 'link', value: displayId.sample(entityId), to: '/laboratory/collection' }];
    case 'order_test':
    case 'test': {
      const details: EventDetail[] = [{ type: 'testCode', value: formatTestCodes(metadata) }];
      const link = orderLink(metadata.orderId);
      if (link) details.push({ type: 'text', value: 'for order' }, link);
      return details;
    }
    default:
      return [{ type: 'id', value: String(entityId) }];
  }
}

// --- per-type handlers ---

const ESCALATION_TRIGGER_LABELS: Record<string, string> = {
  escalation_trigger_crit_val: 'Critical value escalation',
  escalation_trigger_limit_hit: 'Limit hit escalation',
  escalation_trigger_rej_samp: 'Rejected sample escalation',
  escalation_trigger_amend_res: 'Amendment escalation',
};

function completedWithLabel(label: string, meta: Record<string, unknown>): FormattedTimelineEvent {
  return {
    action: 'Test completed',
    details: [{ type: 'text', value: label }, { type: 'text', value: '—' }, ...testCompletedDetails(meta)],
  };
}

function testOrderChange(action: string, preposition: string, meta: Record<string, unknown>): FormattedTimelineEvent {
  const link = orderLink(meta.orderId);
  return {
    action,
    details: [
      { type: 'testCode', value: formatTestCodes(meta) },
      { type: 'text', value: preposition },
      ...(link ? [link] : []),
    ],
  };
}

const EVENT_HANDLERS: Record<string, EventHandler> = {
  sample_collect: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      { type: 'link', value: displayId.sample(event.entityId), to: entityRoute(event) },
      { type: 'text', value: 'for' },
      { type: 'testCode', value: formatTestCodes(meta) },
    ];
    const sampleType = meta.sampleType;
    if (typeof sampleType === 'string') details.push({ type: 'sampleType', value: sampleType });
    return { action: 'Sample collected', details };
  },

  sample_reject: event => ({
    action: 'Sample rejected',
    details: [
      { type: 'link', value: displayId.sample(event.entityId), to: entityRoute(event) },
      { type: 'text', value: '—' },
      { type: 'text', value: (event.metadata.rejectionReason as string) || 'Quality issue' },
    ],
  }),

  sample_recollection_request: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      { type: 'link', value: displayId.sample(event.entityId), to: entityRoute(event) },
      { type: 'text', value: 'replacing' },
      { type: 'id', value: displayId.sample(meta.originalSampleId as number) },
    ];
    const reason = metaString(meta.recollectionReason);
    if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
    const attempt = meta.recollectionAttempt;
    if (typeof attempt === 'number' && attempt > 0) {
      details.push({ type: 'text', value: `(attempt ${attempt})` });
    }
    return { action: 'Recollection requested', details };
  },

  result_entry: event => ({ action: 'Result entered', details: testOnOrder(event.metadata) }),
  result_validation_approve: event => ({
    action: 'Test completed',
    details: testCompletedDetails(event.metadata),
  }),

  quality_issue_reported: event => {
    const meta = event.metadata;
    const details = orderAndTestDetails(meta);
    const domain = metaString(meta.domain) ?? metaString(event.afterState?.domain);
    const reason = metaString(meta.reason);
    const remedy = metaString(event.afterState?.remedy);
    if (domain) {
      if (details.length > 0) details.push({ type: 'text', value: '—' });
      details.push({ type: 'text', value: domain });
    }
    if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
    if (remedy) {
      details.push({ type: 'text', value: '→' }, { type: 'text', value: remedy.replace(/_/g, ' ') });
    }
    if (details.length === 0) details.push({ type: 'text', value: 'Reported' });
    return { action: 'Quality issue reported', details };
  },

  escalation_resolution_authorize_retest: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      { type: 'testCode', value: formatTestCodes(meta) },
      { type: 'text', value: '→' },
      testRef(meta.newTestId) ?? { type: 'text', value: 'New test' },
    ];
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    const reason = metaString(meta.reason);
    if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
    return { action: 'Retest authorized', details };
  },

  escalation_resolution_authorize_recollect: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      { type: 'testCode', value: formatTestCodes(meta) },
      { type: 'text', value: '→' },
    ];
    const newSample = sampleRef(meta.newSampleId);
    if (newSample) details.push(newSample);
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    const reason = metaString(meta.reason);
    if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
    return { action: 'Recollection authorized', details };
  },

  escalation_resolution_force_validate: event => completedWithLabel('Force validate', event.metadata),
  escalation_resolution_apply_amendment: event => completedWithLabel('Amendment applied', event.metadata),

  escalation_resolution_cancel_test: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [{ type: 'testCode', value: formatTestCodes(meta) }];
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    details.push(
      { type: 'text', value: '—' },
      { type: 'text', value: metaString(meta.reason) ?? 'Cancelled' }
    );
    return { action: 'Test cancelled', details };
  },

  critical_value_detected: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      { type: 'testCode', value: formatTestCodes(meta) },
      { type: 'text', value: 'in order' },
    ];
    const link = orderLink(meta.orderId);
    if (link) details.push(link);
    const values = meta.criticalValues;
    if (Array.isArray(values) && values.length > 0) {
      const summary = values
        .map(item => {
          if (!item || typeof item !== 'object') return null;
          const row = item as Record<string, unknown>;
          const name = row.item_name ?? row.itemName ?? row.item_code ?? row.itemCode;
          const value = row.value;
          const unit = row.unit;
          if (!name || value == null) return null;
          return unit ? `${name}: ${value} ${unit}` : `${name}: ${value}`;
        })
        .filter(Boolean)
        .join(', ');
      if (summary) details.push({ type: 'text', value: '—' }, { type: 'text', value: summary });
    }
    return { action: 'Critical value detected', details };
  },

  critical_value_notified: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      { type: 'testCode', value: formatTestCodes(meta) },
      { type: 'text', value: '→' },
      { type: 'text', value: (meta.notifiedTo as string) || 'Provider' },
    ];
    const method = metaString(meta.notificationMethod);
    if (method) details.push({ type: 'text', value: `via ${method}` });
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    return { action: 'Critical value notified', details };
  },

  critical_value_acknowledged: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      { type: 'testCode', value: formatTestCodes(meta) },
      { type: 'text', value: 'by' },
      { type: 'text', value: (meta.acknowledgedBy as string) || 'Provider' },
    ];
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    return { action: 'Critical value acknowledged', details };
  },

  recollection_request_created: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [];
    const link = orderLink(event.entityId);
    if (link) details.push(link);
    const rejected = sampleRef(meta.rejectedSampleId);
    if (rejected) details.push({ type: 'text', value: 'for' }, rejected);
    const stage = metaString(meta.stage);
    if (stage) details.push({ type: 'text', value: 'at' }, { type: 'text', value: stage });
    return { action: 'Recollection request created', details };
  },

  recollection_request_approved: event => {
    const details: EventDetail[] = [];
    const link = orderLink(event.entityId);
    if (link) details.push(link);
    const created = sampleRef(event.metadata.createdSampleId);
    if (created) details.push({ type: 'text', value: '→' }, created);
    return { action: 'Recollection request approved', details };
  },

  recollection_request_denied: event => {
    const details: EventDetail[] = [];
    const link = orderLink(event.entityId);
    if (link) details.push(link);
    const note = metaString(event.metadata.reviewNotes);
    if (note) details.push({ type: 'note', value: note });
    return { action: 'Recollection request denied', details };
  },

  test_added: event => testOrderChange('Test added', 'to order', event.metadata),
  test_removed: event => testOrderChange('Test removed', 'from order', event.metadata),

  order_status_change: event => {
    const details: EventDetail[] = [];
    const link = orderLink(event.entityId);
    if (link) details.push(link);
    const status = getStatusValue(event);
    if (status) details.push({ type: 'text', value: '→' }, { type: 'status', value: status });
    return { action: 'Order status changed', details };
  },
};

const escalationTriggerHandler: EventHandler = event => ({
  action: ESCALATION_TRIGGER_LABELS[event.type] ?? 'Escalation triggered',
  details: escalationTriggerDetails(event.metadata),
});

for (const type of Object.keys(ESCALATION_TRIGGER_LABELS)) {
  EVENT_HANDLERS[type] = escalationTriggerHandler;
}

function appendNote(event: TimelineEvent, formatted: FormattedTimelineEvent): FormattedTimelineEvent {
  const note = metaString(event.comment);
  if (!note) return formatted;
  const detailText = formatted.details
    .filter(d => d.type === 'text' || d.type === 'note')
    .map(d => d.value)
    .join(' ');
  if (detailText.includes(note)) return formatted;
  return { ...formatted, note };
}

export function formatTimelineEvent(event: TimelineEvent): FormattedTimelineEvent {
  const handler = EVENT_HANDLERS[event.type];
  const formatted = handler
    ? handler(event)
    : { action: event.type.replace(/_/g, ' '), details: entityDetails(event) };
  return appendNote(event, formatted);
}
