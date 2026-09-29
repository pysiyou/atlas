import { eventLogId, withHashPrefix } from '../formatRef';
import { collectTestCodes, formatTestNamesLabel } from '../testDisplay';
import type { EventLogHeadlinePart, EventLogRecord } from '../types';
import type { EventLogHeadlineContext } from './context';
import { append, appendText, mainPart, metaString } from './parts';

export function entityPhrase(label: string, idText: string): EventLogHeadlinePart {
  return mainPart(`${label}${idText}`);
}

export function patientEntityPhrase(patientId: number, label = 'patient '): EventLogHeadlinePart {
  return entityPhrase(label, eventLogId.patient(patientId));
}

export function orderEntityPhrase(orderId: number, label = 'order '): EventLogHeadlinePart {
  return entityPhrase(label, eventLogId.order(orderId));
}

export function sampleEntityPhrase(sampleId: number, label = 'sample '): EventLogHeadlinePart {
  return entityPhrase(label, eventLogId.sample(sampleId));
}

export function orderTestEntityPhrase(orderTestId: number, label = 'test '): EventLogHeadlinePart {
  return entityPhrase(label, eventLogId.orderTest(orderTestId));
}

export function paymentEntityPhrase(paymentId: number): EventLogHeadlinePart {
  return entityPhrase('Payment ', eventLogId.payment(paymentId));
}

export function invoiceEntityPhrase(invoiceId: number): EventLogHeadlinePart {
  return entityPhrase('Invoice ', eventLogId.invoice(invoiceId));
}

export function insuranceClaimEntityPhrase(claimId: number): EventLogHeadlinePart {
  return entityPhrase('Insurance claim ', withHashPrefix(String(claimId)));
}

export function userAccountEntityPhrase(userId: number): EventLogHeadlinePart {
  return entityPhrase('User account ', eventLogId.user(userId));
}

export function highlightedTestListPart(
  codes: string[],
  context: EventLogHeadlineContext
): EventLogHeadlinePart {
  return {
    text: formatTestNamesLabel(codes, context.getTestName),
    variant: 'neutral',
    main: true,
  };
}

function testHighlightFromCodes(
  codes: string[],
  context: EventLogHeadlineContext
): EventLogHeadlinePart {
  return highlightedTestListPart(codes, context);
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

export function targetPatient(record: EventLogRecord): EventLogHeadlinePart {
  return patientEntityPhrase(record.targetId);
}

export function targetOrder(record: EventLogRecord, label = 'order '): EventLogHeadlinePart {
  const id = record.orderId ?? record.targetId;
  return orderEntityPhrase(id, label);
}

export function targetSample(record: EventLogRecord, label = 'sample '): EventLogHeadlinePart {
  return sampleEntityPhrase(record.targetId, label);
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

export function resolveOrderId(record: EventLogRecord): number | undefined {
  if (record.orderId != null && record.orderId > 0) return record.orderId;
  if (record.targetType === 'order' && record.targetId > 0) return record.targetId;
  return undefined;
}

export function resolveOrderTestId(record: EventLogRecord): number | undefined {
  if (record.targetType === 'order_test' && record.targetId > 0) return record.targetId;
  if (record.testId != null && record.testId > 0) return record.testId;
  return metaNumber(record, 'order_test_id');
}

function resolvePatientId(record: EventLogRecord): number | undefined {
  if (record.targetType === 'patient' && record.targetId > 0) return record.targetId;
  if (record.patientId != null && record.patientId > 0) return record.patientId;
  return undefined;
}

export function targetPatientFromContext(record: EventLogRecord): EventLogHeadlinePart | null {
  const patientId = resolvePatientId(record);
  if (patientId == null) return null;
  return patientEntityPhrase(patientId);
}

function partsText(parts: EventLogHeadlinePart[]): string {
  return parts.map(part => part.text).join('');
}

function includesDisplayId(parts: EventLogHeadlinePart[], formatted: string): boolean {
  return partsText(parts).includes(formatted);
}

export function appendForOrderPhrase(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord
): EventLogHeadlinePart[] {
  const orderId = resolveOrderId(record);
  if (!orderId || includesDisplayId(parts, eventLogId.order(orderId))) return parts;
  let next = appendText(parts, ' for ');
  return append(next, orderEntityPhrase(orderId));
}

export function appendUnderOrderPhrase(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord
): EventLogHeadlinePart[] {
  const orderId = resolveOrderId(record);
  if (!orderId || includesDisplayId(parts, eventLogId.order(orderId))) return parts;
  let next = appendText(parts, ' under ');
  return append(next, orderEntityPhrase(orderId));
}

export function targetOrderTestRef(
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const codes = collectTestCodes(record);
  if (codes.length > 0) {
    return [mainPart('Test '), testHighlightFromCodes(codes, context)];
  }
  const testId = resolveOrderTestId(record);
  const id = testId ?? record.targetId;
  return [orderTestEntityPhrase(id, 'Test ')];
}

export function testUnderOrderWithTrailing(
  record: EventLogRecord,
  context: EventLogHeadlineContext,
  trailing: string
): EventLogHeadlinePart[] {
  let parts = append([], ...targetOrderTestRef(record, context));
  parts = appendUnderOrderPhrase(parts, record);
  return appendText(parts, trailing);
}

export function retestUnderOrderWithTrailing(
  record: EventLogRecord,
  context: EventLogHeadlineContext,
  trailing: string
): EventLogHeadlinePart[] {
  let parts = appendText([], 'Retest for ');
  parts = append(parts, ...targetOrderTestRef(record, context));
  parts = appendUnderOrderPhrase(parts, record);
  return appendText(parts, trailing);
}

export function resultsForTestUnderOrderPhrase(
  record: EventLogRecord,
  context: EventLogHeadlineContext,
  trailing: string
): EventLogHeadlinePart[] {
  let parts = appendText([], 'Results for ');
  parts = append(parts, ...targetOrderTestRef(record, context));
  parts = appendUnderOrderPhrase(parts, record);
  return appendText(parts, trailing);
}

export function testCentricUnderOrderPhrase(
  record: EventLogRecord,
  context: EventLogHeadlineContext,
  prefix: string,
  trailing: string
): EventLogHeadlinePart[] {
  let parts = appendText([], prefix);
  parts = append(parts, ...targetOrderTestRef(record, context));
  parts = appendUnderOrderPhrase(parts, record);
  return appendText(parts, trailing);
}

export function recollectionForSamplePhrase(
  record: EventLogRecord,
  verb: 'requested' | 'approved' | 'denied'
): EventLogHeadlinePart[] {
  let parts = appendText([], 'Recollection for ');
  parts = append(parts, targetSample(record));
  parts = appendUnderOrderPhrase(parts, record);
  return appendText(parts, ` ${verb}`);
}
