/**
 * Natural-language event log sentences aligned with AuditEmitter metadata keys.
 */
import { EVENT_LOG_COPY } from './copy';
import { eventLogId, withHashPrefix } from './formatRef';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/types/enums/generated/order';
import type { EventLogHeadlinePart, EventLogRecord } from './types';
import type { EventTypeRegistryEntry } from './registry';
import {
  collectTestCodes,
  formatTestNamesLabel,
  type TestNameLookup,
} from './testDisplay';

export interface EventLogHeadlineContext {
  getTestName: TestNameLookup;
}

const DEFAULT_HEADLINE_CONTEXT: EventLogHeadlineContext = {
  getTestName: code => code,
};

export interface BuiltEventLogHeadline {
  parts: EventLogHeadlinePart[];
  /** When true, headline is a full sentence without a leading actor name (e.g. automatic order status). */
  omitActorPrefix?: boolean;
}

function humanizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.replace(/-/g, ' ');
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function metaString(record: EventLogRecord, key: string): string | undefined {
  const value = record.metadata?.[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

function metaNumber(record: EventLogRecord, key: string): number | undefined {
  const value = record.metadata?.[key];
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const n = Number(value.trim());
    return n > 0 ? n : undefined;
  }
  return undefined;
}

function testHighlightFromCodes(
  codes: string[],
  context: EventLogHeadlineContext,
): EventLogHeadlinePart {
  return {
    text: formatTestNamesLabel(codes, context.getTestName),
    variant: 'neutral',
  };
}

function testHighlightFromMetaKey(
  record: EventLogRecord,
  key: string,
  context: EventLogHeadlineContext,
): EventLogHeadlinePart | null {
  const code = metaString(record, key);
  if (!code) return null;
  return testHighlightFromCodes([code], context);
}

function changeNew(record: EventLogRecord, field: string): string | undefined {
  const raw = record.changes?.newValues?.[field];
  if (raw === undefined || raw === null) return undefined;
  return humanizeValue(raw) || undefined;
}

function targetPatient(record: EventLogRecord): EventLogHeadlinePart {
  return { text: eventLogId.patient(record.targetId), emphasis: true };
}

function targetOrder(record: EventLogRecord): EventLogHeadlinePart {
  const id = record.orderId ?? record.targetId;
  return { text: eventLogId.order(id), emphasis: true };
}

function targetSample(record: EventLogRecord): EventLogHeadlinePart {
  return { text: eventLogId.sample(record.targetId), emphasis: true };
}

/** Catalog test name(s) in a chip; falls back to order-test id when code metadata is missing. */
function targetOrderTestRef(
  record: EventLogRecord,
  context: EventLogHeadlineContext,
): EventLogHeadlinePart[] {
  const codes = collectTestCodes(record);
  if (codes.length > 0) {
    return [testHighlightFromCodes(codes, context)];
  }
  const testId = resolveOrderTestId(record);
  const id = testId ?? record.targetId;
  return [{ text: eventLogId.orderTest(id), emphasis: true }];
}

function append(parts: EventLogHeadlinePart[], ...next: EventLogHeadlinePart[]): EventLogHeadlinePart[] {
  return parts.concat(next);
}

function appendText(parts: EventLogHeadlinePart[], text: string): EventLogHeadlinePart[] {
  if (!text) return parts;
  return append(parts, { text });
}

function formatReasonLabel(raw: string): string {
  return raw.trim().replace(/_/g, ' ');
}

const REASON_LEAD_IN = '. ';

/** Appends ". " then highlighted reason clause in the feed. */
function appendClause(parts: EventLogHeadlinePart[], clause: string): EventLogHeadlinePart[] {
  if (!clause.trim()) return parts;
  const label = formatReasonLabel(clause);
  return append(
    parts,
    { text: REASON_LEAD_IN },
    {
      text: `${EVENT_LOG_COPY.reasonInlinePrefix}${label}`,
      variant: 'info',
      icon: false,
      decoration: 'underline',
    },
  );
}

/** Keeps the ". " separator on the reason tail so lineage is inserted before it. */
function splitHeadlineForLineage(parts: EventLogHeadlinePart[]): {
  head: EventLogHeadlinePart[];
  tail: EventLogHeadlinePart[];
} {
  const inlineAt = parts.findIndex(part => part.variant === 'info');
  if (inlineAt < 0) {
    return { head: parts, tail: [] };
  }

  let headEnd = inlineAt;
  if (inlineAt > 0 && parts[inlineAt - 1]?.text === REASON_LEAD_IN) {
    headEnd = inlineAt - 1;
  }

  return {
    head: parts.slice(0, headEnd),
    tail: parts.slice(headEnd),
  };
}

function statusToPhrase(newStatus: string | undefined): EventLogHeadlinePart[] {
  if (!newStatus) return [];
  return [{ text: ` to ${newStatus}` }];
}

function formatOrderStatusLabel(raw: string | undefined): string {
  if (!raw) return 'updated';
  const normalized = raw as OrderStatus;
  if (normalized in ORDER_STATUS_CONFIG) {
    return ORDER_STATUS_CONFIG[normalized].label;
  }
  return humanizeValue(raw);
}

function partsText(parts: EventLogHeadlinePart[]): string {
  return parts.map(part => part.text).join('');
}

function resolveOrderId(record: EventLogRecord): number | undefined {
  if (record.orderId != null && record.orderId > 0) return record.orderId;
  if (record.targetType === 'order' && record.targetId > 0) return record.targetId;
  return undefined;
}

function resolveSampleId(record: EventLogRecord): number | undefined {
  if (record.targetType === 'sample' && record.targetId > 0) return record.targetId;
  return (
    metaNumber(record, 'sample_id') ??
    metaNumber(record, 'sampleId') ??
    metaNumber(record, 'rejected_sample_id')
  );
}

function resolveOrderTestId(record: EventLogRecord): number | undefined {
  if (record.targetType === 'order_test' && record.targetId > 0) return record.targetId;
  if (record.testId != null && record.testId > 0) return record.testId;
  return metaNumber(record, 'order_test_id');
}

function resolvePatientId(record: EventLogRecord): number | undefined {
  if (record.targetType === 'patient' && record.targetId > 0) return record.targetId;
  if (record.patientId != null && record.patientId > 0) return record.patientId;
  return undefined;
}

function includesDisplayId(parts: EventLogHeadlinePart[], formatted: string): boolean {
  return partsText(parts).includes(formatted);
}

type LineagePrimary = 'sample' | 'order_test' | 'order' | 'patient' | 'billing' | 'none';

function resolveLineagePrimary(record: EventLogRecord): LineagePrimary {
  if (record.targetType === 'sample') return 'sample';
  if (record.targetType === 'order_test') return 'order_test';
  if (record.eventType.startsWith('order.test.')) return 'order_test';
  if (record.targetType === 'order') return 'order';
  if (record.targetType === 'patient') return 'patient';
  if (record.targetType === 'payment' || record.targetType === 'invoice') return 'billing';
  if (record.eventType === 'billing.insurance.submit') return 'billing';
  if (record.eventType.startsWith('reporting.')) return 'order';
  if (record.eventType.startsWith('laboratory.')) {
    return record.targetType === 'sample' ? 'sample' : 'order_test';
  }
  return 'none';
}

function shouldAppendLineage(record: EventLogRecord): boolean {
  const primary = resolveLineagePrimary(record);
  return primary !== 'none' && primary !== 'patient';
}

function appendOrderLineage(
  parts: EventLogHeadlinePart[],
  orderId: number,
  options?: { leadingComma?: boolean },
): EventLogHeadlinePart[] {
  if (includesDisplayId(parts, eventLogId.order(orderId))) return parts;
  const prefix = options?.leadingComma ? ', under order ' : ' under order ';
  let next = appendText(parts, prefix);
  next = append(next, { text: eventLogId.order(orderId), emphasis: true });
  return next;
}

function appendPatientLineage(parts: EventLogHeadlinePart[], patientId: number): EventLogHeadlinePart[] {
  if (includesDisplayId(parts, eventLogId.patient(patientId))) return parts;
  let next = appendText(parts, ', for patient ');
  next = append(next, { text: eventLogId.patient(patientId), emphasis: true });
  return next;
}

/**
 * Relational suffixes after the primary entity, e.g.
 * sample: ", belonging to test #TST… under order #ORD…"
 * order_test: ", for sample #SAM… under order #ORD…"
 */
function appendEntityLineage(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord,
): EventLogHeadlinePart[] {
  if (!shouldAppendLineage(record)) return parts;

  const { head, tail } = splitHeadlineForLineage(parts);

  const primary = resolveLineagePrimary(record);
  const orderId = resolveOrderId(record);
  const sampleId = resolveSampleId(record);
  const orderTestId = resolveOrderTestId(record);
  const patientId = resolvePatientId(record);

  let next = head;

  switch (primary) {
    case 'sample': {
      if (orderTestId && !includesDisplayId(next, eventLogId.orderTest(orderTestId))) {
        next = appendText(next, ', belonging to test ');
        next = append(next, { text: eventLogId.orderTest(orderTestId), emphasis: true });
      }
      if (orderId) {
        next = appendOrderLineage(next, orderId);
      }
      break;
    }
    case 'order_test': {
      let linkedSample = false;
      if (sampleId && !includesDisplayId(next, eventLogId.sample(sampleId))) {
        next = appendText(next, ', for sample ');
        next = append(next, { text: eventLogId.sample(sampleId), emphasis: true });
        linkedSample = true;
      }
      if (orderId) {
        next = appendOrderLineage(next, orderId, { leadingComma: !linkedSample });
      }
      break;
    }
    case 'order': {
      if (patientId) {
        next = appendPatientLineage(next, patientId);
      }
      break;
    }
    case 'billing': {
      if (orderId && !includesDisplayId(next, eventLogId.order(orderId))) {
        next = appendText(next, ', for order ');
        next = append(next, { text: eventLogId.order(orderId), emphasis: true });
      }
      break;
    }
    default:
      break;
  }

  return [...next, ...tail];
}

function buildFromRegistryFallback(
  record: EventLogRecord,
  registry: EventTypeRegistryEntry,
  context: EventLogHeadlineContext,
): EventLogHeadlinePart[] {
  const parts: EventLogHeadlinePart[] = [{ text: `${registry.verbPhrase} ` }];
  switch (record.targetType) {
    case 'patient':
      return append(parts, targetPatient(record));
    case 'order':
      return append(parts, targetOrder(record));
    case 'sample':
      return append(parts, targetSample(record));
    case 'order_test':
      return append(parts, ...targetOrderTestRef(record, context));
    case 'user':
      return append(parts, { text: eventLogId.user(record.targetId), emphasis: true });
    case 'test_catalog': {
      const catalogHighlight = testHighlightFromMetaKey(record, 'test_code', context);
      return append(
        parts,
        catalogHighlight ?? {
          text: withHashPrefix(String(record.targetId)),
          emphasis: true,
        },
      );
    }
    default:
      return append(parts, {
        text: withHashPrefix(`${record.targetType}-${record.targetId}`),
        emphasis: true,
      });
  }
}

export function buildEventLogHeadline(
  record: EventLogRecord,
  registry: EventTypeRegistryEntry,
  context: EventLogHeadlineContext = DEFAULT_HEADLINE_CONTEXT,
): BuiltEventLogHeadline {
  const type = record.eventType;
  let parts: EventLogHeadlinePart[] = [];

  switch (type) {
    case 'patient.create':
      parts = appendText(parts, 'registered patient ');
      parts = append(parts, targetPatient(record));
      break;
    case 'patient.update':
      parts = appendText(parts, 'updated patient ');
      parts = append(parts, targetPatient(record));
      break;
    case 'patient.delete':
      parts = appendText(parts, 'archived patient ');
      parts = append(parts, targetPatient(record));
      break;
    case 'patient.view':
      parts = appendText(parts, 'viewed chart for patient ');
      parts = append(parts, targetPatient(record));
      break;
    case 'order.create':
      parts = appendText(parts, 'created order ');
      parts = append(parts, targetOrder(record));
      break;
    case 'order.update':
      parts = appendText(parts, 'updated order ');
      parts = append(parts, targetOrder(record));
      break;
    case 'order.delete':
      parts = appendText(parts, 'cancelled order ');
      parts = append(parts, targetOrder(record));
      break;
    case 'order.status': {
      const statusLabel = formatOrderStatusLabel(changeNew(record, 'status'));
      parts = appendText(parts, 'Order ');
      parts = append(parts, targetOrder(record));
      parts = appendText(parts, ' status moved to ');
      parts = append(parts, { text: statusLabel, emphasis: true });
      break;
    }
    case 'order.test.add':
      parts = appendText(parts, 'added ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      break;
    case 'order.test.remove':
      parts = appendText(parts, 'removed ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      parts = append(parts, ...statusToPhrase(changeNew(record, 'status')));
      break;
    case 'order.test.cancel':
      parts = appendText(parts, 'cancelled ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      parts = appendClause(parts, metaString(record, 'reason') ?? '');
      break;
    case 'order.test.retest':
      parts = appendText(parts, 'ordered retest for ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      parts = appendClause(parts, metaString(record, 'reason') ?? '');
      break;
    case 'order.test.reflex':
      parts = appendText(parts, 'added reflex test ');
      parts = append(
        parts,
        testHighlightFromMetaKey(record, 'added_test_code', context) ?? { text: '—', emphasis: true },
      );
      parts = appendText(parts, ' triggered by ');
      parts = append(
        parts,
        testHighlightFromMetaKey(record, 'triggered_by', context) ?? { text: '—', emphasis: true },
      );
      break;
    case 'laboratory.sample.create':
      parts = appendText(parts, 'accessioned sample ');
      parts = append(parts, targetSample(record));
      break;
    case 'laboratory.sample.collect':
      parts = appendText(parts, 'collected sample ');
      parts = append(parts, targetSample(record));
      break;
    case 'laboratory.sample.reject':
      parts = appendText(parts, 'rejected sample ');
      parts = append(parts, targetSample(record));
      parts = appendClause(parts, metaString(record, 'rejection_reason') ?? '');
      break;
    case 'laboratory.sample.recollect_request':
      parts = appendText(parts, 'requested recollection for sample ');
      parts = append(parts, targetSample(record));
      break;
    case 'laboratory.sample.recollect_approve':
      parts = appendText(parts, 'approved recollection for sample ');
      parts = append(parts, targetSample(record));
      break;
    case 'laboratory.sample.recollect_deny':
      parts = appendText(parts, 'denied recollection for sample ');
      parts = append(parts, targetSample(record));
      parts = appendClause(parts, metaString(record, 'reason') ?? '');
      break;
    case 'laboratory.result.enter':
      parts = appendText(parts, 'entered results for ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      break;
    case 'laboratory.result.update':
      parts = appendText(parts, 'updated results for ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      parts = append(parts, ...statusToPhrase(changeNew(record, 'status')));
      break;
    case 'laboratory.result.critical_detect':
      parts = appendText(parts, 'detected critical result on ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      break;
    case 'laboratory.result.critical_notify':
      parts = appendText(parts, 'sent critical notification for ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      break;
    case 'laboratory.result.critical_acknowledge':
      parts = appendText(parts, 'acknowledged critical result on ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      break;
    case 'laboratory.validation.approve':
      parts = appendText(parts, 'validated results for ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      break;
    case 'laboratory.validation.reject':
      parts = appendText(parts, 'returned ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      parts = appendText(parts, ' for correction');
      parts = appendClause(parts, metaString(record, 'reason') ?? '');
      break;
    case 'laboratory.escalation.trigger':
      parts = appendText(parts, 'escalated ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      if (metaString(record, 'reason_code')) {
        parts = appendText(parts, ` (${metaString(record, 'reason_code')})`);
      }
      break;
    case 'laboratory.escalation.resolve':
      parts = appendText(parts, 'resolved escalation on ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      if (metaString(record, 'resolution')) {
        parts = appendText(parts, ` (${metaString(record, 'resolution')})`);
      }
      break;
    case 'billing.payment.process':
      parts = appendText(parts, 'recorded payment ');
      parts = append(parts, { text: eventLogId.payment(record.targetId), emphasis: true });
      break;
    case 'billing.invoice.generate':
      parts = appendText(parts, 'generated invoice ');
      parts = append(parts, { text: eventLogId.invoice(record.targetId), emphasis: true });
      break;
    case 'billing.invoice.void':
      parts = appendText(parts, 'voided invoice ');
      parts = append(parts, { text: eventLogId.invoice(record.targetId), emphasis: true });
      parts = append(parts, ...statusToPhrase(changeNew(record, 'status')));
      parts = appendClause(parts, metaString(record, 'reason') ?? '');
      break;
    case 'billing.insurance.submit':
      parts = appendText(parts, 'submitted insurance claim ');
      parts = append(parts, {
        text: withHashPrefix(String(record.targetId)),
        emphasis: true,
      });
      break;
    case 'reporting.generate':
      parts = appendText(parts, 'generated report for ');
      parts = append(parts, targetOrder(record));
      break;
    case 'reporting.download':
      parts = appendText(parts, 'downloaded report for ');
      parts = append(parts, ...targetOrderTestRef(record, context));
      if (metaString(record, 'format')) {
        parts = appendText(parts, ` as ${metaString(record, 'format')}`);
      }
      break;
    case 'system.user.login':
      parts = appendText(parts, 'signed in');
      break;
    case 'system.user.logout':
      parts = appendText(parts, 'signed out');
      break;
    case 'system.user.create':
      parts = appendText(parts, 'created user ');
      parts = append(parts, { text: eventLogId.user(record.targetId), emphasis: true });
      break;
    case 'system.user.update':
      parts = appendText(parts, 'updated user ');
      parts = append(parts, { text: eventLogId.user(record.targetId), emphasis: true });
      break;
    case 'system.catalog.create':
      parts = appendText(parts, 'added catalog test ');
      parts = append(
        parts,
        testHighlightFromMetaKey(record, 'test_code', context) ?? {
          text: withHashPrefix(String(record.targetId)),
          emphasis: true,
        },
      );
      break;
    case 'system.catalog.update':
      parts = appendText(parts, 'updated catalog test ');
      parts = append(
        parts,
        testHighlightFromMetaKey(record, 'test_code', context) ?? {
          text: withHashPrefix(String(record.targetId)),
          emphasis: true,
        },
      );
      break;
    default: {
      parts = buildFromRegistryFallback(record, registry, context);
      parts = append(parts, ...statusToPhrase(changeNew(record, 'status')));
      break;
    }
  }

  parts = appendEntityLineage(parts, record);

  const filtered = parts.filter(part => part.text.length > 0);
  return {
    parts: filtered,
    omitActorPrefix: type === 'order.status',
  };
}
