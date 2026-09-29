/**
 * Shared headline part builders (metadata, targets, lineage).
 */
import { EVENT_LOG_COPY } from './copy';
import { eventLogId, withHashPrefix } from './formatRef';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/types/enums/generated/order';
import type { EventLogHeadlinePart, EventLogRecord } from './types';
import type { EventTypeRegistryEntry } from './registry';
import { collectTestCodes, formatTestNamesLabel, type TestNameLookup } from './testDisplay';

export interface EventLogHeadlineContext {
  getTestName: TestNameLookup;
}

export const DEFAULT_HEADLINE_CONTEXT: EventLogHeadlineContext = {
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

export function metaString(record: EventLogRecord, key: string): string | undefined {
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
  context: EventLogHeadlineContext
): EventLogHeadlinePart {
  return {
    text: formatTestNamesLabel(codes, context.getTestName),
    variant: 'neutral',
  };
}

export function testHighlightFromMetaKey(
  record: EventLogRecord,
  key: string,
  context: EventLogHeadlineContext
): EventLogHeadlinePart | null {
  const code = metaString(record, key);
  if (!code) return null;
  return testHighlightFromCodes([code], context);
}

export function changeNew(record: EventLogRecord, field: string): string | undefined {
  const raw = record.changes?.newValues?.[field];
  if (raw === undefined || raw === null) return undefined;
  return humanizeValue(raw) || undefined;
}

export function targetPatient(record: EventLogRecord): EventLogHeadlinePart {
  return { text: eventLogId.patient(record.targetId), emphasis: true };
}

export function targetOrder(record: EventLogRecord): EventLogHeadlinePart {
  const id = record.orderId ?? record.targetId;
  return { text: eventLogId.order(id), emphasis: true };
}

export function targetSample(record: EventLogRecord): EventLogHeadlinePart {
  return { text: eventLogId.sample(record.targetId), emphasis: true };
}

/** Catalog test name(s) in a chip; falls back to order-test id when code metadata is missing. */
export function targetOrderTestRef(
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const codes = collectTestCodes(record);
  if (codes.length > 0) {
    return [testHighlightFromCodes(codes, context)];
  }
  const testId = resolveOrderTestId(record);
  const id = testId ?? record.targetId;
  return [{ text: eventLogId.orderTest(id), emphasis: true }];
}

export function append(
  parts: EventLogHeadlinePart[],
  ...next: EventLogHeadlinePart[]
): EventLogHeadlinePart[] {
  return parts.concat(next);
}

export function appendText(parts: EventLogHeadlinePart[], text: string): EventLogHeadlinePart[] {
  if (!text) return parts;
  return append(parts, { text });
}

function formatReasonLabel(raw: string): string {
  return raw.trim().replace(/_/g, ' ');
}

const REASON_LEAD_IN = '. ';

/** Appends ". " then highlighted reason clause in the feed. */
export function appendClause(
  parts: EventLogHeadlinePart[],
  clause: string
): EventLogHeadlinePart[] {
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
    }
  );
}

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

export function statusToPhrase(newStatus: string | undefined): EventLogHeadlinePart[] {
  if (!newStatus) return [];
  return [{ text: ` to ${newStatus}` }];
}

export function formatOrderStatusLabel(raw: string | undefined): string {
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
  options?: { leadingComma?: boolean }
): EventLogHeadlinePart[] {
  if (includesDisplayId(parts, eventLogId.order(orderId))) return parts;
  const prefix = options?.leadingComma ? ', under order ' : ' under order ';
  let next = appendText(parts, prefix);
  next = append(next, { text: eventLogId.order(orderId), emphasis: true });
  return next;
}

function appendPatientLineage(
  parts: EventLogHeadlinePart[],
  patientId: number
): EventLogHeadlinePart[] {
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
export function appendEntityLineage(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord
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

export function buildFromRegistryFallback(
  record: EventLogRecord,
  registry: EventTypeRegistryEntry,
  context: EventLogHeadlineContext
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
        }
      );
    }
    default:
      return append(parts, {
        text: withHashPrefix(`${record.targetType}-${record.targetId}`),
        emphasis: true,
      });
  }
}
