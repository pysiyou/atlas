/**
 * Natural-language event log sentences aligned with AuditEmitter metadata keys.
 */
import { displayId, withHashPrefix } from '@/utils/id';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/types/enums/generated/order';
import type { EventLogHeadlinePart, EventLogRecord } from './types';
import type { EventTypeRegistryEntry } from './registry';

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

function metaCode(record: EventLogRecord, key: string): string | undefined {
  const raw = metaString(record, key);
  return raw ? withHashPrefix(raw) : undefined;
}

function emphasizeCode(value: string): EventLogHeadlinePart {
  return { text: withHashPrefix(value), emphasis: true };
}

function changeNew(record: EventLogRecord, field: string): string | undefined {
  const raw = record.changes?.newValues?.[field];
  if (raw === undefined || raw === null) return undefined;
  return humanizeValue(raw) || undefined;
}

function targetPatient(record: EventLogRecord): EventLogHeadlinePart {
  return { text: displayId.patient(record.targetId), emphasis: true };
}

function targetOrder(record: EventLogRecord): EventLogHeadlinePart {
  const id = record.orderId ?? record.targetId;
  return { text: displayId.order(id), emphasis: true };
}

function targetSample(record: EventLogRecord): EventLogHeadlinePart {
  return { text: displayId.sample(record.targetId), emphasis: true };
}

/** Order-test row (#TST…) — catalog code only when no TST id is available. */
function targetOrderTestRef(record: EventLogRecord): EventLogHeadlinePart[] {
  const testId = resolveOrderTestId(record);
  if (testId) {
    return [
      { text: 'test ' },
      { text: displayId.orderTest(testId), emphasis: true },
    ];
  }
  const code = metaString(record, 'test_code');
  if (code) {
    return [{ text: 'test ' }, emphasizeCode(code)];
  }
  return [
    { text: 'test ' },
    { text: displayId.orderTest(record.targetId), emphasis: true },
  ];
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

/** Appends ". " then the inline highlighted reason (after lineage / main phrase). */
function appendClause(parts: EventLogHeadlinePart[], clause: string): EventLogHeadlinePart[] {
  if (!clause.trim()) return parts;
  const label = formatReasonLabel(clause);
  return append(parts, { text: REASON_LEAD_IN }, { text: label, highlight: 'inline' });
}

/** Keeps the ". " separator on the reason tail so lineage is inserted before it. */
function splitHeadlineForLineage(parts: EventLogHeadlinePart[]): {
  head: EventLogHeadlinePart[];
  tail: EventLogHeadlinePart[];
} {
  const inlineAt = parts.findIndex(part => part.highlight === 'inline');
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
  if (includesDisplayId(parts, displayId.order(orderId))) return parts;
  const prefix = options?.leadingComma ? ', under order ' : ' under order ';
  let next = appendText(parts, prefix);
  next = append(next, { text: displayId.order(orderId), emphasis: true });
  return next;
}

function appendPatientLineage(parts: EventLogHeadlinePart[], patientId: number): EventLogHeadlinePart[] {
  if (includesDisplayId(parts, displayId.patient(patientId))) return parts;
  let next = appendText(parts, ', for patient ');
  next = append(next, { text: displayId.patient(patientId), emphasis: true });
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
      if (orderTestId && !includesDisplayId(next, displayId.orderTest(orderTestId))) {
        next = appendText(next, ', belonging to test ');
        next = append(next, { text: displayId.orderTest(orderTestId), emphasis: true });
      }
      if (orderId) {
        next = appendOrderLineage(next, orderId);
      }
      break;
    }
    case 'order_test': {
      let linkedSample = false;
      if (sampleId && !includesDisplayId(next, displayId.sample(sampleId))) {
        next = appendText(next, ', for sample ');
        next = append(next, { text: displayId.sample(sampleId), emphasis: true });
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
      if (orderId && !includesDisplayId(next, displayId.order(orderId))) {
        next = appendText(next, ', for order ');
        next = append(next, { text: displayId.order(orderId), emphasis: true });
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
      return append(parts, ...targetOrderTestRef(record));
    case 'user':
      return append(parts, { text: displayId.user(record.targetId), emphasis: true });
    case 'test_catalog':
      return append(parts, {
        text: metaCode(record, 'test_code') ?? withHashPrefix(String(record.targetId)),
        emphasis: true,
      });
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
      parts = append(parts, ...targetOrderTestRef(record));
      break;
    case 'order.test.remove':
      parts = appendText(parts, 'removed ');
      parts = append(parts, ...targetOrderTestRef(record));
      parts = append(parts, ...statusToPhrase(changeNew(record, 'status')));
      break;
    case 'order.test.cancel':
      parts = appendText(parts, 'cancelled ');
      parts = append(parts, ...targetOrderTestRef(record));
      parts = appendClause(parts, metaString(record, 'reason') ?? '');
      break;
    case 'order.test.retest':
      parts = appendText(parts, 'ordered retest for ');
      parts = append(parts, ...targetOrderTestRef(record));
      parts = appendClause(parts, metaString(record, 'reason') ?? '');
      break;
    case 'order.test.reflex':
      parts = appendText(parts, 'added reflex test ');
      parts = append(parts, {
        text: metaCode(record, 'added_test_code') ?? '—',
        emphasis: true,
      });
      parts = appendText(parts, ' triggered by ');
      parts = append(parts, {
        text: metaCode(record, 'triggered_by') ?? '—',
        emphasis: true,
      });
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
      parts = append(parts, ...targetOrderTestRef(record));
      break;
    case 'laboratory.result.update':
      parts = appendText(parts, 'updated results for ');
      parts = append(parts, ...targetOrderTestRef(record));
      parts = append(parts, ...statusToPhrase(changeNew(record, 'status')));
      break;
    case 'laboratory.result.critical_detect':
      parts = appendText(parts, 'detected critical result on ');
      parts = append(parts, ...targetOrderTestRef(record));
      break;
    case 'laboratory.result.critical_notify':
      parts = appendText(parts, 'sent critical notification for ');
      parts = append(parts, ...targetOrderTestRef(record));
      break;
    case 'laboratory.result.critical_acknowledge':
      parts = appendText(parts, 'acknowledged critical result on ');
      parts = append(parts, ...targetOrderTestRef(record));
      break;
    case 'laboratory.validation.approve':
      parts = appendText(parts, 'validated results for ');
      parts = append(parts, ...targetOrderTestRef(record));
      break;
    case 'laboratory.validation.reject':
      parts = appendText(parts, 'returned ');
      parts = append(parts, ...targetOrderTestRef(record));
      parts = appendText(parts, ' for correction');
      parts = appendClause(parts, metaString(record, 'reason') ?? '');
      break;
    case 'laboratory.escalation.trigger':
      parts = appendText(parts, 'escalated ');
      parts = append(parts, ...targetOrderTestRef(record));
      if (metaString(record, 'reason_code')) {
        parts = appendText(parts, ` (${metaString(record, 'reason_code')})`);
      }
      break;
    case 'laboratory.escalation.resolve':
      parts = appendText(parts, 'resolved escalation on ');
      parts = append(parts, ...targetOrderTestRef(record));
      if (metaString(record, 'resolution')) {
        parts = appendText(parts, ` (${metaString(record, 'resolution')})`);
      }
      break;
    case 'billing.payment.process':
      parts = appendText(parts, 'recorded payment ');
      parts = append(parts, { text: displayId.payment(record.targetId), emphasis: true });
      break;
    case 'billing.invoice.generate':
      parts = appendText(parts, 'generated invoice ');
      parts = append(parts, { text: displayId.invoice(record.targetId), emphasis: true });
      break;
    case 'billing.invoice.void':
      parts = appendText(parts, 'voided invoice ');
      parts = append(parts, { text: displayId.invoice(record.targetId), emphasis: true });
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
      parts = append(parts, ...targetOrderTestRef(record));
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
      parts = append(parts, { text: displayId.user(record.targetId), emphasis: true });
      break;
    case 'system.user.update':
      parts = appendText(parts, 'updated user ');
      parts = append(parts, { text: displayId.user(record.targetId), emphasis: true });
      break;
    case 'system.catalog.create':
      parts = appendText(parts, 'added catalog test ');
      parts = append(parts, {
        text: metaCode(record, 'test_code') ?? withHashPrefix(String(record.targetId)),
        emphasis: true,
      });
      break;
    case 'system.catalog.update':
      parts = appendText(parts, 'updated catalog test ');
      parts = append(parts, {
        text: metaCode(record, 'test_code') ?? withHashPrefix(String(record.targetId)),
        emphasis: true,
      });
      break;
    default: {
      parts = buildFromRegistryFallback(record, registry);
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
