/**
 * Unified timeline event registry — labels and detail lines for all audit event types.
 */
/* eslint-disable max-lines -- single registry for all audit event type handlers */

import { displayId } from '@/utils';
import type { TimelineEvent } from '@/features/lab/api/labCommandCenter';
import { formatStatusLabel } from './timelineDetails';

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

function resolveOrderId(event: TimelineEvent, meta?: Record<string, unknown>): number | undefined {
  if (event.entityType === 'order') return event.entityId;
  const m = meta ?? event.metadata;
  const id = Number(m.orderId);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

function resolveTestId(event: TimelineEvent, meta?: Record<string, unknown>): number | undefined {
  const fromEvent = testIdFromEvent(event);
  if (fromEvent) return fromEvent;
  const m = meta ?? event.metadata;
  const id = Number(m.orderTestId ?? m.escalatedTestId ?? m.createdTestId);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

function resolveSampleId(event: TimelineEvent, meta?: Record<string, unknown>): number | undefined {
  if (event.entityType === 'sample') return event.entityId;
  const m = meta ?? event.metadata;
  for (const key of ['newSampleId', 'createdSampleId', 'rejectedSampleId', 'originalSampleId']) {
    const id = Number(m[key]);
    if (Number.isFinite(id) && id > 0) return id;
  }
  return undefined;
}

function ordLabel(orderId: number | undefined): string | null {
  if (!orderId) return null;
  return displayId.order(orderId);
}

function tstLabel(testId: number | undefined): string | null {
  if (!testId) return null;
  return displayId.orderTest(testId);
}

function smpLabel(sampleId: number | undefined): string | null {
  if (!sampleId) return null;
  return displayId.sample(sampleId);
}

function headlineOrder(prefix: string, orderId: number | undefined): string {
  const ord = ordLabel(orderId);
  return ord ? `${prefix} ${ord}` : `${prefix}.`;
}

function headlineTestInOrder(
  lead: string,
  testId: number | undefined,
  orderId: number | undefined,
): string {
  const tst = tstLabel(testId);
  const ord = ordLabel(orderId);
  if (tst && ord) return `${lead} for test ${tst} in order ${ord}`;
  if (tst) return `${lead} for test ${tst}`;
  if (ord) return `${lead} for order ${ord}`;
  return `${lead}.`;
}

function headlineTestOrderFromEvent(lead: string, event: TimelineEvent): string {
  const meta = event.metadata;
  return headlineTestInOrder(lead, resolveTestId(event, meta), resolveOrderId(event, meta));
}

function headlineActivityFallback(event: TimelineEvent): string {
  const ord = resolveOrderId(event);
  const tst = resolveTestId(event);
  if (ord) return `Activity recorded for order ${ordLabel(ord)}`;
  if (tst) return `Activity recorded for test ${tstLabel(tst)}`;
  return 'Activity recorded.';
}

function humanizePaymentMethod(method: string): string {
  return method.replace(/_/g, ' ').toLowerCase();
}

function paymentDetails(meta: Record<string, unknown>, event: TimelineEvent): EventDetail[] {
  const parts: string[] = [];
  const amount = meta.amount;
  if (typeof amount === 'number') parts.push(`$${amount.toFixed(2)}`);
  const payStatus = metaString(meta.paymentStatus) ?? getStatusValue(event);
  if (payStatus === 'paid') parts.push('paid');
  const method = metaString(meta.paymentMethod);
  if (method) parts.push(`via ${humanizePaymentMethod(method)}`);
  if (parts.length === 0) return [];
  return [{ type: 'text', value: parts.join(' ') }];
}

function orderStatusChangeDetails(event: TimelineEvent): EventDetail[] {
  const orderId = resolveOrderId(event);
  if (!orderId) return [];
  const ord = ordLabel(orderId);
  if (!ord) return [];
  const before = metaString(event.beforeState?.status);
  const after = getStatusValue(event);
  const beforeLabel = before ? formatStatusLabel(before) : '—';
  const afterLabel = after ? formatStatusLabel(after) : '—';
  return [{ type: 'text', value: `${ord} changed from ${beforeLabel} to ${afterLabel}` }];
}

function testContextWithoutOrder(meta: Record<string, unknown>, testId?: number): EventDetail[] {
  const details: EventDetail[] = [];
  const test = testRef(testId ?? meta.orderTestId ?? meta.escalatedTestId);
  if (test) details.push(test);
  details.push({ type: 'testCode', value: formatTestCodes(meta) });
  return details;
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

const ESCALATION_TRIGGER_LEAD: Record<string, string> = {
  escalation_trigger_crit_val: 'Escalation opened for critical value',
  escalation_trigger_limit_hit: 'Escalation opened for retest limit',
  escalation_trigger_rej_samp: 'Escalation opened for rejected specimen',
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

function testOrderChange(verb: 'added' | 'removed', meta: Record<string, unknown>): FormattedTimelineEvent {
  const code = formatTestCodes(meta);
  const orderId = Number(meta.orderId);
  const ord = Number.isFinite(orderId) && orderId > 0 ? ordLabel(orderId) : null;
  const action =
    ord && verb === 'added'
      ? `${code} added to order ${ord}`
      : ord && verb === 'removed'
        ? `${code} removed from order ${ord}`
        : `${code} ${verb}`;
  return {
    action,
    details: testContextWithoutOrder(meta),
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
    const smp = smpLabel(event.entityId);
    const codes = formatTestCodes(meta);
    const action = smp
      ? `Specimen ${smp} collected for ${codes}`
      : `Specimen collected for ${codes}`;
    return { action, details };
  },

  sample_reject: event => {
    const smp = smpLabel(event.entityId);
    return {
      action: smp ? `Specimen ${smp} rejected at collection` : 'Specimen rejected at collection',
      details: [
        sampleRef(event.entityId) ?? { type: 'id', value: displayId.sample(event.entityId) },
        { type: 'text', value: '—' },
        { type: 'text', value: (event.metadata.rejectionReason as string) || 'Quality issue' },
      ],
    };
  },

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
    const smp = smpLabel(event.entityId);
    const action = smp
      ? `Repeat draw requested for specimen ${smp}`
      : 'Repeat draw requested for specimen';
    return { action, details };
  },

  result_entry: event => ({
    action: headlineTestOrderFromEvent('Results recorded', event),
    details: testOnOrder(event.metadata, event.entityId),
  }),
  result_validation_approve: event => ({
    action: headlineTestOrderFromEvent('Results approved', event),
    details: testCompletedDetails(event.metadata, event.entityId),
  }),

  quality_issue_reported: event => {
    const meta = event.metadata;
    const stage = metaString(meta.stage) ?? metaString(event.afterState?.stage);
    const domain = metaString(meta.domain) ?? metaString(event.afterState?.domain);
    const details: EventDetail[] = [
      ...testTransitionDetails(meta, event),
      { type: 'testCode', value: formatTestCodes(meta) },
    ];
    const reason = metaString(meta.reason);
    const remedy = metaString(event.afterState?.remedy);
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
    if (remedy) {
      details.push({ type: 'text', value: '→' }, { type: 'text', value: remedy.replace(/_/g, ' ') });
    }
    const createdSample = sampleRef(meta.newSampleId);
    if (createdSample && !meta.newTestId) {
      details.push({ type: 'text', value: '→' }, createdSample);
    }
    if (details.length === 0) details.push({ type: 'text', value: 'Reported' });
    let action: string;
    if (stage === 'collection' || domain === 'specimen') {
      const smp = smpLabel(resolveSampleId(event, meta) ?? event.entityId);
      action = smp ? `Specimen issue reported for sample ${smp}` : 'Specimen issue reported';
    } else if (stage === 'validation' || domain === 'results') {
      action = headlineTestOrderFromEvent('Validation issue reported', event);
    } else {
      action = headlineTestOrderFromEvent('Quality issue reported', event);
    }
    return { action, details };
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
    return {
      action: headlineTestOrderFromEvent('Supervisor approved retest', event),
      details,
    };
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
    return {
      action: headlineTestOrderFromEvent('Supervisor approved new specimen', event),
      details,
    };
  },

  escalation_resolution_force_validate: event =>
    completedWithLabel(
      headlineTestOrderFromEvent('Supervisor released results', event),
      event.metadata,
      event.entityId,
    ),
  escalation_resolution_apply_amendment: event =>
    completedWithLabel(
      headlineTestOrderFromEvent('Supervisor signed off on amended results', event),
      event.metadata,
      event.entityId,
    ),

  escalation_resolution_cancel_test: event => {
    const meta = event.metadata;
    const details: EventDetail[] = [{ type: 'testCode', value: formatTestCodes(meta) }];
    const link = orderLink(meta.orderId);
    if (link) details.push({ type: 'text', value: 'on order' }, link);
    details.push(
      { type: 'text', value: '—' },
      { type: 'text', value: metaString(meta.reason) ?? 'Cancelled' }
    );
    return {
      action: headlineTestOrderFromEvent('Supervisor cancelled test', event),
      details,
    };
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
    return {
      action: headlineTestOrderFromEvent('Critical value flagged', event),
      details,
    };
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
    return {
      action: headlineTestOrderFromEvent('Critical value notification sent', event),
      details,
    };
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
    return {
      action: headlineTestOrderFromEvent('Critical value acknowledged', event),
      details,
    };
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
    return {
      action: headlineOrder('Recollection submitted for order', resolveOrderId(event, meta)),
      details,
    };
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
    return {
      action: headlineOrder('Recollection approved for order', resolveOrderId(event, meta)),
      details,
    };
  },

  recollection_request_denied: event => {
    const details: EventDetail[] = [];
    const link = orderLinkFromEvent(event);
    if (link) details.push(link);
    const note = metaString(event.metadata.reviewNotes);
    if (note) details.push({ type: 'note', value: note });
    return {
      action: headlineOrder('Recollection declined for order', resolveOrderId(event)),
      details,
    };
  },

  test_added: event => testOrderChange('added', event.metadata),
  test_removed: event => testOrderChange('removed', event.metadata),

  order_status_change: event => {
    const orderId = resolveOrderId(event);
    const ord = ordLabel(orderId);
    const action = ord ? `The order status of ${ord} changed` : 'The order status changed';
    return { action, details: orderStatusChangeDetails(event) };
  },

  order_payment_recorded: event => {
    const meta = event.metadata;
    return {
      action: headlineOrder('Payment recorded for order', resolveOrderId(event, meta)),
      details: paymentDetails(meta, event),
    };
  },
};

const escalationTriggerHandler: EventHandler = event => {
  const lead = ESCALATION_TRIGGER_LEAD[event.type] ?? 'Escalation opened';
  return {
    action: headlineTestOrderFromEvent(lead, event),
    details: escalationTriggerDetails(event.metadata, event.entityId),
  };
};

for (const type of Object.keys(ESCALATION_TRIGGER_LEAD)) {
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
    : { action: headlineActivityFallback(event), details: entityDetails(event) };
  return appendNote(event, formatted);
}

/** @deprecated Use formatTimelineEvent */
export const formatActivityEvent = formatTimelineEvent;
