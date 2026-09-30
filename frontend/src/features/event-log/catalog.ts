/**
 * Event types, headline builders, and catalog registry for the event log feed.
 */
import { displayId } from '@/utils/id';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/types/enums/generated/order';
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
  return append(parts, { text });
}

function formatReasonLabel(raw: string): string {
  return raw.trim().replace(/_/g, ' ');
}

const REASON_LEAD_IN = '. ';

export function appendClause(parts: EventLogHeadlinePart[], clause: string): EventLogHeadlinePart[] {
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

export function appendOutcomeClause(
  parts: EventLogHeadlinePart[],
  outcome: string
): EventLogHeadlinePart[] {
  if (!outcome.trim()) return parts;
  const label = formatReasonLabel(outcome);
  return append(
    parts,
    { text: REASON_LEAD_IN },
    {
      text: `${EVENT_LOG_COPY.outcomeInlinePrefix}${label}`,
      variant: 'info',
      icon: false,
      decoration: 'underline',
    }
  );
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

export function entityPhrase(label: string, idText: string): EventLogHeadlinePart {
  return mainPart(`${label}${idText}`);
}

export function patientEntityPhrase(
  patientId: number,
  context: EventLogHeadlineContext,
  label = 'patient '
): EventLogHeadlinePart {
  return entityPhrase(label, context.getPatientName(patientId));
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

export function targetPatient(
  record: EventLogRecord,
  context: EventLogHeadlineContext,
  label = 'patient '
): EventLogHeadlinePart {
  return patientEntityPhrase(record.targetId, context, label);
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

export function targetPatientFromContext(
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart | null {
  const patientId = resolvePatientId(record);
  if (patientId == null) return null;
  return patientEntityPhrase(patientId, context);
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


// --- catalogBuilders.ts ---

export const EVENT_HEADLINE_BUILDERS: Record<
  string,
  (record: EventLogRecord, context: EventLogHeadlineContext) => EventLogHeadlinePart[]
> = {
  'patient.create': (r, c) => {
    let parts = appendText([], 'New profile for ');
    parts = append(parts, targetPatient(r, c));
    return appendText(parts, ' created');
  },
  'patient.update': (r, c) => {
    let parts = appendText([], 'Details for ');
    parts = append(parts, targetPatient(r, c));
    return appendText(parts, ' updated');
  },
  'patient.delete': (r, c) => {
    let parts = appendText([], 'Profile for ');
    parts = append(parts, targetPatient(r, c));
    return appendText(parts, ' archived');
  },
  'patient.view': (r, c) => {
    let parts = append([], targetPatient(r, c, ''));
    return appendText(parts, "'s profile viewed");
  },
  'order.create': (r, c) => {
    let parts = appendText([], 'New ');
    parts = append(parts, targetOrder(r));
    parts = appendText(parts, ' placed');
    const patient = targetPatientFromContext(r, c);
    if (patient) {
      parts = appendText(parts, ' for ');
      parts = append(parts, patient);
    }
    return parts;
  },
  'order.update': r => {
    let parts = appendText([], 'Details for ');
    parts = append(parts, targetOrder(r));
    return appendText(parts, ' updated');
  },
  'order.delete': r => appendText(append([], targetOrder(r, 'Order ')), ' cancelled'),
  'order.status': r => {
    const statusLabel = formatOrderStatusLabel(changeNew(r, 'status'));
    const orderId = resolveOrderId(r);
    let parts = appendText([], 'Status for ');
    if (orderId) parts = append(parts, orderEntityPhrase(orderId));
    parts = appendText(parts, ' updated to ');
    return append(parts, mainPart(statusLabel));
  },
  'order.test.add': (r, c) => {
    let parts = append([], ...targetOrderTestRef(r, c));
    parts = appendText(parts, ' added to ');
    const orderId = resolveOrderId(r);
    if (orderId) parts = append(parts, orderEntityPhrase(orderId));
    return parts;
  },
  'order.test.remove': (r, c) => {
    let parts = append([], ...targetOrderTestRef(r, c));
    parts = appendText(parts, ' removed from ');
    const orderId = resolveOrderId(r);
    if (orderId) parts = append(parts, orderEntityPhrase(orderId));
    return parts;
  },
  'order.test.cancel': (r, c) =>
    appendClause(testUnderOrderWithTrailing(r, c, ' cancelled'), metaString(r, 'reason') ?? ''),
  'order.test.retest': (r, c) =>
    appendClause(retestUnderOrderWithTrailing(r, c, ' ordered'), metaString(r, 'reason') ?? ''),
  'order.test.reflex': (r, c) => {
    let parts = appendText([], 'Reflex test ');
    parts = append(parts, testHighlightFromMetaKey(r, 'added_test_code', c) ?? mainPart('—'));
    parts = appendText(parts, ' added to ');
    const orderId = resolveOrderId(r);
    if (orderId) parts = append(parts, orderEntityPhrase(orderId));
    parts = appendText(parts, ' (triggered by ');
    const trigger = testHighlightFromMetaKey(r, 'triggered_by', c) ?? mainPart('test —');
    parts = append(parts, trigger);
    return appendText(parts, ')');
  },
  'laboratory.sample.create': (r, c) => {
    let parts = appendText([], 'Label for ');
    parts = append(parts, targetSample(r));
    parts = appendText(parts, ' generated');
    const codes = collectTestCodes(r);
    if (codes.length > 0) {
      parts = appendText(parts, ' for ');
      parts = append(parts, highlightedTestListPart(codes, c));
    }
    return appendUnderOrderPhrase(parts, r);
  },
  'laboratory.sample.collect': (r, c) => {
    let parts = appendText(append([], targetSample(r, 'Sample ')), ' collected');
    const codes = collectTestCodes(r);
    if (codes.length > 0) {
      parts = appendText(parts, ' for ');
      parts = append(parts, highlightedTestListPart(codes, c));
    }
    return appendUnderOrderPhrase(parts, r);
  },
  'laboratory.sample.reject': r => {
    let parts = append([], targetSample(r, 'Sample '));
    const orderTestId = resolveOrderTestId(r);
    if (orderTestId) {
      parts = appendText(parts, ' belonging to ');
      parts = append(parts, orderTestEntityPhrase(orderTestId));
    }
    parts = appendUnderOrderPhrase(parts, r);
    parts = appendText(parts, ' rejected');
    return appendClause(parts, metaString(r, 'rejection_reason') ?? '');
  },
  'laboratory.sample.recollect_request': r => recollectionForSamplePhrase(r, 'requested'),
  'laboratory.sample.recollect_approve': r => recollectionForSamplePhrase(r, 'approved'),
  'laboratory.sample.recollect_deny': r =>
    appendClause(recollectionForSamplePhrase(r, 'denied'), metaString(r, 'reason') ?? ''),
  'laboratory.result.enter': (r, c) => resultsForTestUnderOrderPhrase(r, c, ' entered'),
  'laboratory.result.update': (r, c) => resultsForTestUnderOrderPhrase(r, c, ' updated'),
  'laboratory.result.critical_detect': (r, c) =>
    testCentricUnderOrderPhrase(r, c, 'Critical value for ', ' detected'),
  'laboratory.result.critical_notify': (r, c) =>
    testCentricUnderOrderPhrase(r, c, 'Clinician notification for ', ' documented'),
  'laboratory.result.critical_acknowledge': (r, c) =>
    testCentricUnderOrderPhrase(r, c, 'Critical value protocol for ', ' acknowledged'),
  'laboratory.validation.approve': (r, c) => resultsForTestUnderOrderPhrase(r, c, ' validated'),
  'laboratory.validation.reject': (r, c) =>
    appendClause(
      resultsForTestUnderOrderPhrase(r, c, ' returned for correction'),
      metaString(r, 'reason') ?? ''
    ),
  'laboratory.escalation.trigger': (r, c) => {
    let parts = testCentricUnderOrderPhrase(r, c, 'Escalation for ', ' opened');
    if (metaString(r, 'reason_code')) {
      parts = appendText(parts, ` (${metaString(r, 'reason_code')})`);
    }
    return parts;
  },
  'laboratory.escalation.resolve': (r, c) =>
    appendOutcomeClause(
      testCentricUnderOrderPhrase(r, c, 'Escalation for ', ' resolved'),
      metaString(r, 'resolution') ?? ''
    ),
  'billing.payment.process': r => {
    let parts = appendText(append([], paymentEntityPhrase(r.targetId)), ' recorded');
    return appendForOrderPhrase(parts, r);
  },
  'billing.invoice.generate': r => {
    let parts = appendText(append([], invoiceEntityPhrase(r.targetId)), ' generated');
    return appendForOrderPhrase(parts, r);
  },
  'billing.invoice.void': r => {
    let parts = appendText(append([], invoiceEntityPhrase(r.targetId)), ' voided');
    parts = appendForOrderPhrase(parts, r);
    return appendClause(parts, metaString(r, 'reason') ?? '');
  },
  'billing.insurance.submit': r => {
    let parts = appendText(append([], insuranceClaimEntityPhrase(r.targetId)), ' submitted');
    return appendForOrderPhrase(parts, r);
  },
  'reporting.generate': r => {
    let parts = appendText([], 'Report for ');
    return append(parts, targetOrder(r));
  },
  'reporting.download': (r, c) => {
    let parts = appendText([], 'Report for ');
    parts = append(parts, ...targetOrderTestRef(r, c));
    parts = appendText(parts, ' downloaded');
    if (metaString(r, 'format')) {
      parts = appendText(parts, ` as ${metaString(r, 'format')}`);
    }
    return appendUnderOrderPhrase(parts, r);
  },
  'system.user.login': () => appendText([], 'signed in'),
  'system.user.logout': () => appendText([], 'signed out'),
  'system.user.create': r =>
    appendText(append([], userAccountEntityPhrase(r.targetId)), ' created'),
  'system.user.update': r =>
    appendText(append([], userAccountEntityPhrase(r.targetId)), ' updated'),
  'system.catalog.create': (r, c) => {
    const highlight = testHighlightFromMetaKey(r, 'test_code', c);
    if (highlight) {
      return append(append([], mainPart('Catalog test ')), highlight);
    }
    return [mainPart(`Catalog test ${withHashPrefix(String(r.targetId))}`)];
  },
  'system.catalog.update': (r, c) => {
    const highlight = testHighlightFromMetaKey(r, 'test_code', c);
    const parts: EventLogHeadlinePart[] = highlight
      ? [mainPart('Catalog test '), highlight]
      : [mainPart(`Catalog test ${withHashPrefix(String(r.targetId))}`)];
    return appendText(parts, ' updated');
  },
};


// --- catalogFallback.ts ---

export function buildFallbackHeadline(
  record: EventLogRecord,
  entry: EventCatalogEntry,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const parts: EventLogHeadlinePart[] = [{ text: `${entry.verbPhrase} ` }];
  switch (record.targetType) {
    case 'patient':
      return append(parts, targetPatient(record, context));
    case 'order':
      return append(parts, targetOrder(record));
    case 'sample':
      return append(parts, targetSample(record));
    case 'order_test':
      return append(parts, ...targetOrderTestRef(record, context));
    case 'user':
      return append(parts, userAccountEntityPhrase(record.targetId));
    case 'test_catalog': {
      const catalogHighlight = testHighlightFromMetaKey(record, 'test_code', context);
      return append(
        parts,
        catalogHighlight ?? mainPart(withHashPrefix(String(record.targetId)))
      );
    }
    default:
      return append(parts, mainPart(withHashPrefix(`${record.targetType}-${record.targetId}`)));
  }
}


// --- catalogEvents.ts ---

const LAB_SAMPLE = {
  domain: 'laboratory' as const,
  laboratorySubdomain: 'sample' as const,
  domainLabel: 'Sample',
};

const LAB_RESULT = {
  domain: 'laboratory' as const,
  laboratorySubdomain: 'result' as const,
  domainLabel: 'Results',
};

const LAB_VALIDATION = {
  domain: 'laboratory' as const,
  laboratorySubdomain: 'validation' as const,
  domainLabel: 'Validation',
};

const LAB_ESCALATION = {
  domain: 'laboratory' as const,
  laboratorySubdomain: 'escalation' as const,
  domainLabel: 'Escalation',
};

type CatalogSeed = Omit<EventCatalogEntry, 'buildHeadline'> & {
  eventType: string;
};

function withBuilder(seed: CatalogSeed): [string, EventCatalogEntry] {
  const builder = EVENT_HEADLINE_BUILDERS[seed.eventType];
  const entry: EventCatalogEntry = {
    domain: seed.domain,
    laboratorySubdomain: seed.laboratorySubdomain,
    domainLabel: seed.domainLabel,
    verbPhrase: seed.verbPhrase,
    headlineMetaKeys: seed.headlineMetaKeys,
    leadingActor: seed.leadingActor,
    trailingActor: seed.trailingActor,
    treatAsSystemActor: seed.treatAsSystemActor,
    buildHeadline: builder
      ? (record, context) => builder(record, context)
      : (record, context) => buildFallbackHeadline(record, entry, context),
  };
  return [seed.eventType, entry];
}

const CATALOG_SEEDS: CatalogSeed[] = [
  {
    eventType: 'patient.create',
    domain: 'patient',
    verbPhrase: 'new profile created for patient',
    domainLabel: 'Patient',
  },
  {
    eventType: 'patient.update',
    domain: 'patient',
    verbPhrase: 'patient details updated for',
    domainLabel: 'Patient',
  },
  {
    eventType: 'patient.delete',
    domain: 'patient',
    verbPhrase: 'patient profile archived for',
    domainLabel: 'Patient',
  },
  {
    eventType: 'patient.view',
    domain: 'patient',
    verbPhrase: "patient profile viewed",
    domainLabel: 'Patient',
  },
  {
    eventType: 'order.create',
    domain: 'order',
    verbPhrase: 'new order placed',
    domainLabel: 'Order',
  },
  {
    eventType: 'order.update',
    domain: 'order',
    verbPhrase: 'updated order',
    domainLabel: 'Order',
    headlineMetaKeys: ['field', 'value'],
  },
  {
    eventType: 'order.status',
    domain: 'order',
    verbPhrase: 'order status updated for',
    domainLabel: 'Order',
    headlineMetaKeys: ['trigger'],
  },
  {
    eventType: 'order.delete',
    domain: 'order',
    verbPhrase: 'cancelled order',
    domainLabel: 'Order',
  },
  {
    eventType: 'order.test.add',
    domain: 'order',
    verbPhrase: 'added test to order',
    domainLabel: 'Order',
    headlineMetaKeys: ['test_code'],
  },
  {
    eventType: 'order.test.remove',
    domain: 'order',
    verbPhrase: 'removed test from order',
    domainLabel: 'Order',
    headlineMetaKeys: ['test_code'],
  },
  {
    eventType: 'order.test.cancel',
    domain: 'order',
    verbPhrase: 'cancelled test on order',
    domainLabel: 'Order',
    headlineMetaKeys: ['test_code', 'reason'],
  },
  {
    eventType: 'order.test.retest',
    domain: 'order',
    verbPhrase: 'requested retest for',
    domainLabel: 'Order',
    headlineMetaKeys: ['test_code', 'reason'],
  },
  {
    eventType: 'order.test.reflex',
    domain: 'order',
    verbPhrase: 'added reflex test',
    domainLabel: 'Order',
    headlineMetaKeys: ['added_test_code', 'triggered_by'],
  },
  {
    eventType: 'laboratory.sample.create',
    ...LAB_SAMPLE,
    verbPhrase: 'sample label generated for',
    headlineMetaKeys: ['test_codes'],
    treatAsSystemActor: true,
  },
  {
    eventType: 'laboratory.sample.collect',
    ...LAB_SAMPLE,
    verbPhrase: 'sample collected for',
    headlineMetaKeys: ['test_codes'],
  },
  {
    eventType: 'laboratory.sample.reject',
    ...LAB_SAMPLE,
    verbPhrase: 'sample rejected for',
    headlineMetaKeys: ['rejection_reason'],
  },
  {
    eventType: 'laboratory.sample.recollect_request',
    ...LAB_SAMPLE,
    verbPhrase: 'sample recollection requested for',
    headlineMetaKeys: ['stage'],
  },
  {
    eventType: 'laboratory.sample.recollect_approve',
    ...LAB_SAMPLE,
    verbPhrase: 'sample recollection approved for',
  },
  {
    eventType: 'laboratory.sample.recollect_deny',
    ...LAB_SAMPLE,
    verbPhrase: 'sample recollection denied for',
    headlineMetaKeys: ['reason'],
  },
  {
    eventType: 'laboratory.result.enter',
    ...LAB_RESULT,
    verbPhrase: 'entered results for',
    headlineMetaKeys: ['test_code'],
  },
  {
    eventType: 'laboratory.result.update',
    ...LAB_RESULT,
    verbPhrase: 'updated results for',
    headlineMetaKeys: ['test_code'],
  },
  {
    eventType: 'laboratory.result.critical_detect',
    ...LAB_RESULT,
    verbPhrase: 'critical value detected for',
    headlineMetaKeys: ['test_code'],
  },
  {
    eventType: 'laboratory.result.critical_notify',
    ...LAB_RESULT,
    verbPhrase: 'clinician notification documented for',
    headlineMetaKeys: ['test_code'],
  },
  {
    eventType: 'laboratory.result.critical_acknowledge',
    ...LAB_RESULT,
    verbPhrase: 'critical value protocol acknowledged for',
    headlineMetaKeys: ['test_code'],
  },
  {
    eventType: 'laboratory.validation.approve',
    ...LAB_VALIDATION,
    verbPhrase: 'validated',
    headlineMetaKeys: ['test_code'],
  },
  {
    eventType: 'laboratory.validation.reject',
    ...LAB_VALIDATION,
    verbPhrase: 'sent back for correction on',
    headlineMetaKeys: ['reason', 'test_code'],
  },
  {
    eventType: 'laboratory.escalation.trigger',
    ...LAB_ESCALATION,
    verbPhrase: 'escalated',
    headlineMetaKeys: ['reason_code', 'test_code'],
  },
  {
    eventType: 'laboratory.escalation.resolve',
    ...LAB_ESCALATION,
    verbPhrase: 'escalation resolved for',
    headlineMetaKeys: ['resolution', 'test_code'],
  },
  {
    eventType: 'billing.payment.process',
    domain: 'billing',
    verbPhrase: 'payment recorded for',
    domainLabel: 'Billing',
    headlineMetaKeys: ['amount', 'payment_method'],
  },
  {
    eventType: 'billing.invoice.generate',
    domain: 'billing',
    verbPhrase: 'invoice generated for',
    domainLabel: 'Billing',
    trailingActor: 'never',
  },
  {
    eventType: 'billing.invoice.void',
    domain: 'billing',
    verbPhrase: 'voided invoice for order',
    domainLabel: 'Billing',
    headlineMetaKeys: ['reason'],
  },
  {
    eventType: 'billing.insurance.submit',
    domain: 'billing',
    verbPhrase: 'submitted insurance claim for order',
    domainLabel: 'Billing',
    headlineMetaKeys: ['payer', 'claim_number'],
  },
  {
    eventType: 'reporting.generate',
    domain: 'reporting',
    verbPhrase: 'generated report for order',
    domainLabel: 'Reporting',
  },
  {
    eventType: 'reporting.download',
    domain: 'reporting',
    verbPhrase: 'downloaded report for order',
    domainLabel: 'Reporting',
    headlineMetaKeys: ['format'],
  },
  {
    eventType: 'system.user.login',
    domain: 'system',
    verbPhrase: 'signed in',
    domainLabel: 'System',
    leadingActor: true,
    trailingActor: 'never',
  },
  {
    eventType: 'system.user.logout',
    domain: 'system',
    verbPhrase: 'signed out',
    domainLabel: 'System',
    leadingActor: true,
    trailingActor: 'never',
  },
  {
    eventType: 'system.user.create',
    domain: 'system',
    verbPhrase: 'created user account',
    domainLabel: 'System',
  },
  {
    eventType: 'system.user.update',
    domain: 'system',
    verbPhrase: 'updated user account',
    domainLabel: 'System',
  },
  {
    eventType: 'system.catalog.create',
    domain: 'system',
    verbPhrase: 'added catalog entry',
    domainLabel: 'Catalog',
    headlineMetaKeys: ['test_code'],
  },
  {
    eventType: 'system.catalog.update',
    domain: 'system',
    verbPhrase: 'updated catalog entry',
    domainLabel: 'Catalog',
    headlineMetaKeys: ['test_code'],
  },
];

export const EVENT_CATALOG: Record<string, EventCatalogEntry> = Object.fromEntries(
  CATALOG_SEEDS.map(withBuilder)
);

export function getCatalogEntry(eventType: string): EventCatalogEntry {
  const known = EVENT_CATALOG[eventType];
  if (known) return known;

  const prefix = eventType.split('.')[0] ?? 'system';
  const domain: EventLogDomain =
    prefix === 'patient' ||
    prefix === 'order' ||
    prefix === 'laboratory' ||
    prefix === 'billing' ||
    prefix === 'reporting' ||
    prefix === 'system'
      ? (prefix as EventLogDomain)
      : 'system';

  const fallbackEntry: EventCatalogEntry = {
    domain,
    verbPhrase: 'updated',
    domainLabel: domain.charAt(0).toUpperCase() + domain.slice(1),
    buildHeadline: (record, context) => buildFallbackHeadline(record, fallbackEntry, context),
  };
  return fallbackEntry;
}

/** Metadata keys already rendered in the headline (exclude from note cards). */
export function headlineMetaKeysFor(eventType: string): readonly string[] {
  return getCatalogEntry(eventType).headlineMetaKeys ?? [];
}


// --- headlinePipeline.ts ---

export function buildEventLogHeadline(
  record: EventLogRecord,
  context: EventLogHeadlineContext = DEFAULT_HEADLINE_CONTEXT
): BuiltEventLogHeadline {
  const catalog = getCatalogEntry(record.eventType);
  let parts = catalog.buildHeadline(record, context);
  parts = appendTrailingActor(parts, record, catalog);

  const filtered = parts.filter(part => part.text.length > 0);
  return {
    parts: filtered,
    omitActorPrefix: !catalog.leadingActor,
  };
}
