/**
 * Event log headline helpers shared by domain builder maps and the catalog registry.
 */
/* eslint-disable max-lines -- shared phrasing + lab headline helpers */
import { displayId } from '@/utils/id';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/types/enums/generated/order';
import { resolveRejectionReasonLabel } from '@/types/generated/rejectionReasonRegistry';
import { EVENT_LOG_COPY } from './types';
import type {
  EventLogDomain,
  EventLogHeadlinePart,
  EventLogLaboratorySubdomain,
  EventLogRecord,
} from './types';


// --- formatRef.ts ---

/** Event log copy uses lowercase id/code tokens (#ord…, #cbc…); rest of the app keeps displayId casing. */
function eventLogRefBody(label: string): string {
  return label.toLowerCase();
}

export function withHashPrefix(label: string | null | undefined): string {
  if (label === null || label === undefined) return '-';
  const trimmed = String(label).trim();
  if (!trimmed || trimmed === '-') return '-';
  const body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  return `#${eventLogRefBody(body)}`;
}

function hashDisplayId(format: (id: number | null | undefined) => string) {
  return (id: number | null | undefined): string => {
    const base = format(id);
    return base === '-' ? base : withHashPrefix(base);
  };
}

export const eventLogId = {
  patient: hashDisplayId(displayId.patient),
  order: hashDisplayId(displayId.order),
  sample: hashDisplayId(displayId.sample),
  orderTest: hashDisplayId(displayId.orderTest),
  invoice: hashDisplayId(displayId.invoice),
  payment: hashDisplayId(displayId.payment),
  report: hashDisplayId(displayId.report),
  user: hashDisplayId(displayId.user),
  audit: hashDisplayId(displayId.audit),
};


// --- testDisplay.ts ---

export type TestNameLookup = (testCode: string) => string;
export type PatientNameLookup = (patientId: number) => string;

export function collectTestCodes(record: EventLogRecord): string[] {
  const meta = record.metadata ?? {};
  const rawList = meta.test_codes;
  if (Array.isArray(rawList)) {
    const codes = rawList
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map(entry => entry.trim());
    if (codes.length > 0) return codes;
  }
  const single = meta.test_code;
  if (typeof single === 'string' && single.trim()) return [single.trim()];
  return [];
}

/** First test name, then ", +N" when multiple codes are present. */
export function formatTestNamesLabel(codes: string[], lookup: TestNameLookup): string {
  if (codes.length === 0) return '—';
  const names = codes.map(code => {
    const name = lookup(code).trim();
    if (name) return name;
    return code.toLowerCase();
  });
  const first = names[0];
  if (names.length === 1) return first;
  return `${first}, +${names.length - 1}`;
}


// --- headlineContext.ts ---

export interface EventLogHeadlineContext {
  getTestName: TestNameLookup;
  getPatientName: PatientNameLookup;
}

export const DEFAULT_HEADLINE_CONTEXT: EventLogHeadlineContext = {
  getTestName: code => code,
  getPatientName: id => eventLogId.patient(id),
};

export interface BuiltEventLogHeadline {
  parts: EventLogHeadlinePart[];
  omitActorPrefix?: boolean;
}


// --- catalogTypes.ts ---

export type TrailingActorPolicy = 'human' | 'never';

export type HeadlineBuilder = (
  record: EventLogRecord,
  context: EventLogHeadlineContext
) => EventLogHeadlinePart[];

export interface EventCatalogEntry {
  domain: EventLogDomain;
  laboratorySubdomain?: EventLogLaboratorySubdomain;
  domainLabel: string;
  verbPhrase: string;
  headlineMetaKeys?: readonly string[];
  /** Leading actor name (login/logout only). */
  leadingActor?: boolean;
  trailingActor?: TrailingActorPolicy;
  /** Hide system actor; no trailing " by " (e.g. auto sample label). */
  treatAsSystemActor?: boolean;
  buildHeadline: HeadlineBuilder;
}


// --- headlineParts.ts ---

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

export function mainPart(text: string): EventLogHeadlinePart {
  return { text, main: true };
}

export function append(
  parts: EventLogHeadlinePart[],
  ...next: EventLogHeadlinePart[]
): EventLogHeadlinePart[] {
  return parts.concat(next);
}

export function appendText(parts: EventLogHeadlinePart[], text: string): EventLogHeadlinePart[] {
  if (!text) return parts;
  let nextText = text;
  if (parts.length > 0) {
    const lastText = parts[parts.length - 1].text;
    if (
      lastText.length > 0 &&
      !/\s$/.test(lastText) &&
      nextText.length > 0 &&
      !/^\s/.test(nextText)
    ) {
      nextText = ` ${nextText}`;
    }
  }
  return append(parts, { text: nextText });
}

export function formatReasonLabel(raw: string): string {
  return raw.trim().replace(/_/g, ' ');
}

function bracketInfoPart(text: string): EventLogHeadlinePart {
  return { text, variant: 'info', icon: false };
}

function applyInfoVariant(part: EventLogHeadlinePart): EventLogHeadlinePart {
  return { ...part, variant: 'info', icon: false };
}

/** Space before an info highlight; label text must not include leading whitespace. */
export function appendInfoHighlight(parts: EventLogHeadlinePart[], label: string): EventLogHeadlinePart[] {
  const trimmed = label.trim();
  if (!trimmed) return parts;
  const next = parts.length > 0 ? appendText(parts, ' ') : parts;
  return append(next, applyInfoVariant({ text: trimmed }));
}

export function appendClause(parts: EventLogHeadlinePart[], clause: string): EventLogHeadlinePart[] {
  if (!clause.trim()) return parts;
  const label = formatReasonLabel(clause);
  return appendInfoHighlight(parts, `Reason: ${label}`);
}

export function appendBracketReasonLiteral(
  parts: EventLogHeadlinePart[],
  label: string
): EventLogHeadlinePart[] {
  if (!label.trim()) return parts;
  return appendInfoHighlight(parts, `Reason: ${label.trim()}`);
}

export function appendOutcomeClause(
  parts: EventLogHeadlinePart[],
  outcome: string
): EventLogHeadlinePart[] {
  if (!outcome.trim()) return parts;
  const label = formatReasonLabel(outcome);
  return appendInfoHighlight(parts, `Outcome: ${label}`);
}

export function appendFormatClause(
  parts: EventLogHeadlinePart[],
  format: string
): EventLogHeadlinePart[] {
  if (!format.trim()) return parts;
  return append(parts, bracketInfoPart(` Format: ${format.trim()}`));
}

export function changeNew(record: EventLogRecord, field: string): string | undefined {
  const raw = record.changes?.newValues?.[field];
  if (raw === undefined || raw === null) return undefined;
  return humanizeValue(raw) || undefined;
}

export function formatOrderStatusLabel(raw: string | undefined): string {
  if (!raw) return 'updated';
  const normalized = raw as OrderStatus;
  if (normalized in ORDER_STATUS_CONFIG) {
    return ORDER_STATUS_CONFIG[normalized].label;
  }
  return humanizeValue(raw);
}


// --- headlinePhrasing.ts ---

function recordPhrase(label: string, idText: string): EventLogHeadlinePart {
  return mainPart(`${label}${idText}`);
}

export function patientRecordPhrase(
  patientId: number,
  context: EventLogHeadlineContext,
  label = 'patient '
): EventLogHeadlinePart {
  return recordPhrase(label, context.getPatientName(patientId));
}

export function orderRecordPhrase(orderId: number, label = 'order '): EventLogHeadlinePart {
  return recordPhrase(label, eventLogId.order(orderId));
}

export function sampleRecordPhrase(sampleId: number, label = 'sample '): EventLogHeadlinePart {
  return recordPhrase(label, eventLogId.sample(sampleId));
}

export function orderTestRecordPhrase(orderTestId: number, label = 'test '): EventLogHeadlinePart {
  return recordPhrase(label, eventLogId.orderTest(orderTestId));
}

export function paymentRecordPhrase(paymentId: number): EventLogHeadlinePart {
  return recordPhrase('Payment ', eventLogId.payment(paymentId));
}

export function invoiceRecordPhrase(invoiceId: number): EventLogHeadlinePart {
  return recordPhrase('Invoice ', eventLogId.invoice(invoiceId));
}

export function insuranceClaimRecordPhrase(claimId: number): EventLogHeadlinePart {
  return recordPhrase('Insurance claim ', withHashPrefix(String(claimId)));
}

export function userAccountRecordPhrase(userId: number): EventLogHeadlinePart {
  return recordPhrase('User account ', eventLogId.user(userId));
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

export function targetPatient(
  record: EventLogRecord,
  context: EventLogHeadlineContext,
  label = 'patient '
): EventLogHeadlinePart {
  return patientRecordPhrase(record.targetId, context, label);
}

export function targetOrder(record: EventLogRecord, label = 'order '): EventLogHeadlinePart {
  const id = record.orderId ?? record.targetId;
  return orderRecordPhrase(id, label);
}

export function targetSample(record: EventLogRecord, label = 'sample '): EventLogHeadlinePart {
  return sampleRecordPhrase(record.targetId, label);
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

/** Sample id for lab headlines: sample target or metadata from quality / validation flows. */
export function resolveSampleId(record: EventLogRecord): number | undefined {
  if (record.targetType === 'sample' && record.targetId > 0) return record.targetId;
  return metaNumber(record, 'sample_id') ?? metaNumber(record, 'sampleId');
}

/** `Sample #… {action} for order #…` (connectors and action text are muted). */
export function buildLabSampleHeadline(
  record: EventLogRecord,
  action: string,
  afterOrder?: (parts: EventLogHeadlinePart[]) => EventLogHeadlinePart[]
): EventLogHeadlinePart[] {
  const sampleId = resolveSampleId(record);
  if (sampleId == null) {
    let parts = appendText([], action.trim());
    parts = appendForOrderPhrase(parts, record);
    return afterOrder ? afterOrder(parts) : parts;
  }
  let parts = append([], sampleRecordPhrase(sampleId, 'Sample '));
  parts = appendText(parts, ` ${action.trim()}`);
  parts = appendForOrderPhrase(parts, record);
  return afterOrder ? afterOrder(parts) : parts;
}

/** `{lead} for test {name} on order #… {trailingAction}` (test name and order id are primary). */
export function buildLabOrderTestHeadline(
  record: EventLogRecord,
  context: EventLogHeadlineContext,
  lead: string,
  trailingAction: string,
  afterOrder?: (parts: EventLogHeadlinePart[]) => EventLogHeadlinePart[]
): EventLogHeadlinePart[] {
  let parts = appendText([], `${lead} `);
  parts = appendForTestNameRef(parts, record, context);
  parts = appendOnOrderPhrase(parts, record);
  parts = appendText(parts, ` ${trailingAction.trim()}`);
  return afterOrder ? afterOrder(parts) : parts;
}

export function resolvePatientId(record: EventLogRecord): number | undefined {
  if (record.targetType === 'patient' && record.targetId > 0) return record.targetId;
  if (record.patientId != null && record.patientId > 0) return record.patientId;
  return undefined;
}

export function targetPatientFromContext(
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart | null {
  const patientId = resolvePatientId(record);
  if (patientId == null) return null;
  return patientRecordPhrase(patientId, context);
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
  const next = appendText(parts, ' for ');
  return append(next, orderRecordPhrase(orderId));
}

export function appendOnOrderPhrase(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord
): EventLogHeadlinePart[] {
  const orderId = resolveOrderId(record);
  if (!orderId || includesDisplayId(parts, eventLogId.order(orderId))) return parts;
  const next = appendText(parts, ' on ');
  return append(next, orderRecordPhrase(orderId));
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
  return [orderTestRecordPhrase(id, 'Test ')];
}

function testNameRefOnly(
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const codes = collectTestCodes(record);
  if (codes.length > 0) {
    return [testHighlightFromCodes(codes, context)];
  }
  const testId = resolveOrderTestId(record);
  const id = testId ?? record.targetId;
  return [mainPart(eventLogId.orderTest(id))];
}

/** Appends muted `for`, primary `test`, a gap, then the test name highlight. */
export function appendForTestNameRef(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord,
  context: EventLogHeadlineContext,
  forLeadIn = 'for '
): EventLogHeadlinePart[] {
  let next = appendText(parts, forLeadIn);
  next = append(next, mainPart('test'));
  next = appendText(next, ' ');
  return append(next, ...testNameRefOnly(record, context));
}

/** Appends `for test {name} on order {order}`. */
export function appendForTestOnOrderPhrase(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const next = appendForTestNameRef(parts, record, context);
  return appendOnOrderPhrase(next, record);
}

/** Validation reject — remedy is chosen later at escalation approval. */
export function validationRejectTrailingAction(_record: EventLogRecord): string {
  return 'rejected';
}

export function escalationResolveTrailingAction(record: EventLogRecord): string {
  const resolution = metaString(record, 'resolution');
  switch (resolution) {
    case 'authorize_retest':
      return 'approved retest on same sample';
    case 'authorize_recollect':
      return 'approved recollection';
    case 'cancel_test':
      return 'approved cancellation';
    case 'force_validate':
      return 'force validated';
    case 'apply_amendment':
      return 'amendment applied';
    default:
      return 'resolved';
  }
}

function appendValidationRejectReason(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord
): EventLogHeadlinePart[] {
  const raw = metaString(record, 'reason');
  if (!raw) return parts;
  const label = resolveRejectionReasonLabel(raw);
  return appendInfoHighlight(parts, `Reason: ${label}`);
}

export function buildValidationRejectHeadline(
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const action = validationRejectTrailingAction(record);
  const parts =
    record.targetType === 'sample'
      ? buildLabSampleHeadline(record, action)
      : buildLabOrderTestHeadline(record, context, 'Results', action);
  return appendValidationRejectReason(parts, record);
}

export function patientProfileRef(
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const patientId = resolvePatientId(record) ?? record.targetId;
  return [patientRecordPhrase(patientId, context, '')];
}

export function appendTriggeredByClause(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const trigger = testHighlightFromMetaKey(record, 'triggered_by', context);
  if (!trigger) return parts;
  let next = appendText(parts, ' Triggered by:');
  next = appendText(next, ' ');
  return append(next, trigger);
}

// --- headlineActors.ts ---

export function actorDisplayName(record: EventLogRecord): string {
  const snap = record.actorSnapshot;
  if (snap.userId === 'system' || snap.role === 'system') {
    return EVENT_LOG_COPY.systemActorName;
  }
  const name = snap.name.trim();
  return name || 'Unknown';
}

export function isSystemActorRecord(
  record: EventLogRecord,
  catalog?: EventCatalogEntry
): boolean {
  if (catalog?.treatAsSystemActor) return true;
  const snap = record.actorSnapshot;
  return snap.userId === 'system' || snap.role === 'system';
}

export function appendTrailingActor(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord,
  catalog: EventCatalogEntry
): EventLogHeadlinePart[] {
  if (isSystemActorRecord(record, catalog)) return parts;
  if (catalog.trailingActor === 'never') return parts;
  return append(appendText(parts, ' by '), mainPart(actorDisplayName(record)));
}
