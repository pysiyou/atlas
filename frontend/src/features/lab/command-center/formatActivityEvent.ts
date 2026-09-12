/**
 * Activity event formatting — maps audit log events to display labels and detail chips.
 */
/* eslint-disable max-lines -- single registry for all audit event type handlers */

import { displayId } from '@/utils';
import type { TimelineEvent } from '../api/commandCenter.api';

export type EventDetail =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; to: string }
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

// --- detail builders ---

function orderLink(orderId: unknown): EventDetail | null {
  const id = Number(orderId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { type: 'link', value: displayId.order(id), to: `/orders/${id}` };
}

/** Resolve order link from event entity (legacy order logs) or metadata.orderId. */
function orderLinkFromEvent(event: TimelineEvent): EventDetail | null {
  if (event.entityType === 'order') {
    return orderLink(event.entityId);
  }
  return orderLink(event.metadata.orderId);
}

function sampleRef(sampleId: unknown): EventDetail | null {
  const id = Number(sampleId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    type: 'entityRef',
    entityType: 'sample',
    entityId: id,
    value: displayId.sample(id),
  };
}

function testRef(testId: unknown): EventDetail | null {
  const id = Number(testId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    type: 'entityRef',
    entityType: 'order_test',
    entityId: id,
    value: displayId.orderTest(id),
  };
}

function testIdFromEvent(event: TimelineEvent): number | undefined {
  if (event.entityType === 'test' || event.entityType === 'order_test') {
    return event.entityId;
  }
  const fromMeta = Number(event.metadata.orderTestId ?? event.metadata.escalatedTestId);
  return Number.isFinite(fromMeta) && fromMeta > 0 ? fromMeta : undefined;
}

function testTransitionDetails(
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

function testOnOrder(meta: Record<string, unknown>, testId?: number): EventDetail[] {
  const details: EventDetail[] = [];
  const test = testRef(testId ?? meta.orderTestId ?? meta.escalatedTestId);
  if (test) details.push(test);
  details.push({ type: 'testCode', value: formatTestCodes(meta) });
  const link = orderLink(meta.orderId);
  if (link) details.push({ type: 'text', value: 'for order' }, link);
  return details;
}

function testCompletedDetails(meta: Record<string, unknown>, testId?: number): EventDetail[] {
  const details = testOnOrder(meta, testId);
  if (meta.orderCompleted === true) {
    details.push({ type: 'text', value: '→' }, { type: 'status', value: 'completed' });
  }
  return details;
}

function escalationTriggerDetails(meta: Record<string, unknown>, testId?: number): EventDetail[] {
  const details = testOnOrder(meta, testId);
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
      return [sampleRef(entityId) ?? { type: 'id', value: displayId.sample(entityId) }];
    case 'order_test':
    case 'test': {
      const details: EventDetail[] = [];
      const test = testRef(entityId);
      if (test) details.push(test);
      details.push({ type: 'testCode', value: formatTestCodes(metadata) });
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
  escalation_trigger_crit_val: 'Escalation opened for critical value',
  escalation_trigger_limit_hit: 'Escalation opened after retest limit',
  escalation_trigger_rej_samp: 'Escalation opened for rejected sample',
  escalation_trigger_amend_res: 'Escalation opened for result amendment',
};

function completedWithLabel(
  action: string,
  meta: Record<string, unknown>,
  testId?: number,
): FormattedTimelineEvent {
  return {
    action,
    details: testCompletedDetails(meta, testId),
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
      sampleRef(event.entityId) ?? { type: 'id', value: displayId.sample(event.entityId) },
      { type: 'text', value: 'for' },
      { type: 'testCode', value: formatTestCodes(meta) },
    ];
    const sampleType = meta.sampleType;
    if (typeof sampleType === 'string') details.push({ type: 'sampleType', value: sampleType });
    return { action: 'Sample collected and ready for testing', details };
  },

  sample_reject: event => ({
    action: 'Sample rejected during collection',
    details: [
      sampleRef(event.entityId) ?? { type: 'id', value: displayId.sample(event.entityId) },
      { type: 'text', value: '—' },
      { type: 'text', value: (event.metadata.rejectionReason as string) || 'Quality issue' },
    ],
  }),

  sample_recollection_request: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      sampleRef(event.entityId) ?? { type: 'id', value: displayId.sample(event.entityId) },
      { type: 'text', value: 'replacing' },
      ...(sampleRef(meta.originalSampleId) ? [sampleRef(meta.originalSampleId)!] : []),
    ];
    const reason = metaString(meta.recollectionReason);
    if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
    const attempt = meta.recollectionAttempt;
    if (typeof attempt === 'number' && attempt > 0) {
      details.push({ type: 'text', value: `(attempt ${attempt})` });
    }
    return { action: 'New sample recollection requested', details };
  },

  result_entry: event => ({
    action: 'Test results recorded',
    details: testOnOrder(event.metadata, event.entityId),
  }),
  result_validation_approve: event => ({
    action: 'Test validated and marked complete',
    details: testCompletedDetails(event.metadata, event.entityId),
  }),

  quality_issue_reported: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      ...testTransitionDetails(meta, event),
      { type: 'testCode', value: formatTestCodes(meta) },
    ];
    const domain = metaString(meta.domain) ?? metaString(event.afterState?.domain);
    const reason = metaString(meta.reason);
    const remedy = metaString(event.afterState?.remedy);
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    if (domain) {
      if (details.length > 0) details.push({ type: 'text', value: '—' });
      details.push({ type: 'text', value: domain });
    }
    if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
    if (remedy) {
      details.push({ type: 'text', value: '→' }, { type: 'text', value: remedy.replace(/_/g, ' ') });
    }
    const createdSample = sampleRef(meta.newSampleId);
    if (createdSample && !meta.newTestId) {
      details.push({ type: 'text', value: '→' }, createdSample);
    }
    if (details.length === 0) details.push({ type: 'text', value: 'Reported' });
    return { action: 'Quality issue flagged for review', details };
  },

  escalation_resolution_authorize_retest: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      { type: 'testCode', value: formatTestCodes(meta) },
      ...testTransitionDetails(meta, event),
    ];
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    const reason = metaString(meta.reason);
    if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
    return { action: 'Supervisor authorized a retest', details };
  },

  escalation_resolution_authorize_recollect: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [
      { type: 'testCode', value: formatTestCodes(meta) },
      ...(testRef(meta.escalatedTestId ?? event.entityId)
        ? [testRef(meta.escalatedTestId ?? event.entityId)!, { type: 'text' as const, value: '→' }]
        : []),
    ];
    const newSample = sampleRef(meta.newSampleId);
    if (newSample) details.push(newSample);
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    const reason = metaString(meta.reason);
    if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
    return { action: 'Supervisor authorized sample recollection', details };
  },

  escalation_resolution_force_validate: event =>
    completedWithLabel('Test force-validated by supervisor', event.metadata, event.entityId),
  escalation_resolution_apply_amendment: event =>
    completedWithLabel('Amended results applied and validated', event.metadata, event.entityId),

  escalation_resolution_cancel_test: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [{ type: 'testCode', value: formatTestCodes(meta) }];
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    details.push(
      { type: 'text', value: '—' },
      { type: 'text', value: metaString(meta.reason) ?? 'Cancelled' }
    );
    return { action: 'Test cancelled by supervisor', details };
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
    return { action: 'Critical result detected in testing', details };
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
    return { action: 'Provider notified of critical value', details };
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
    return { action: 'Critical value acknowledged by provider', details };
  },

  recollection_request_created: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [];
    const link = orderLinkFromEvent(event);
    if (link) details.push(link);
    const rejected = sampleRef(meta.rejectedSampleId);
    if (rejected) details.push({ type: 'text', value: 'for' }, rejected);
    const test = testRef(meta.orderTestId ?? (event.entityType === 'order_test' ? event.entityId : undefined));
    if (test) details.push(test);
    const stage = metaString(meta.stage);
    if (stage) details.push({ type: 'text', value: 'at' }, { type: 'text', value: stage });
    return { action: 'Recollection sent for supervisor approval', details };
  },

  recollection_request_approved: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [];
    const link = orderLinkFromEvent(event);
    if (link) details.push(link);
    const created = sampleRef(meta.createdSampleId);
    if (created) details.push({ type: 'text', value: '→' }, created);
    const newTest = testRef(meta.createdTestId);
    if (newTest) details.push(newTest);
    return { action: 'Recollection request approved by supervisor', details };
  },

  recollection_request_denied: event => {
    const details: EventDetail[] = [];
    const link = orderLinkFromEvent(event);
    if (link) details.push(link);
    const note = metaString(event.metadata.reviewNotes);
    if (note) details.push({ type: 'note', value: note });
    return { action: 'Recollection request denied by supervisor', details };
  },

  test_added: event => testOrderChange('Test added to order', 'to order', event.metadata),
  test_removed: event => testOrderChange('Test removed from order', 'from order', event.metadata),

  order_status_change: event => {
    const details: EventDetail[] = [];
    const link = orderLinkFromEvent(event);
    if (link) details.push(link);
    const status = getStatusValue(event);
    if (status) details.push({ type: 'text', value: '→' }, { type: 'status', value: status });
    const isSystem = event.performedBy === 'system';
    let action = isSystem ? 'Order status automatically updated' : 'Order status manually updated';
    if (status === 'completed' && isSystem) {
      action = 'Order completed — all tests finished';
    } else if (status === 'in-progress' && isSystem) {
      action = 'Order moved to in progress';
    }
    return { action, details };
  },

  order_payment_recorded: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [];
    const link = orderLinkFromEvent(event);
    if (link) details.push(link);
    const amount = meta.amount;
    if (typeof amount === 'number') {
      details.push({ type: 'text', value: '—' }, { type: 'text', value: `$${amount.toFixed(2)}` });
    }
    const method = metaString(meta.paymentMethod);
    if (method) details.push({ type: 'text', value: 'via' }, { type: 'text', value: method });
    const payStatus = metaString(meta.paymentStatus) ?? getStatusValue(event);
    if (payStatus === 'paid') {
      details.push({ type: 'text', value: '→' }, { type: 'status', value: 'paid' });
    }
    return { action: 'Payment recorded for order', details };
  },
};

const escalationTriggerHandler: EventHandler = event => ({
  action: ESCALATION_TRIGGER_LABELS[event.type] ?? 'Escalation opened for review',
  details: escalationTriggerDetails(event.metadata, event.entityId),
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

export interface FormatActivityOptions {
  interactiveEntities?: boolean;
}

export function formatActivityEvent(
  event: TimelineEvent,
  _options: FormatActivityOptions = {},
): FormattedTimelineEvent {
  const handler = EVENT_HANDLERS[event.type];
  const formatted = handler
    ? handler(event)
    : { action: event.type.replace(/_/g, ' '), details: entityDetails(event) };
  return appendNote(event, formatted);
}
