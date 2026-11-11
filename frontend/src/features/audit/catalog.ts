/**
 * Event log catalog registry, headline maps, and feed resolution.
 * Helpers: `catalogParts`.
 */
/* eslint-disable max-lines -- registry + headline maps + resolve pipeline stay together */
import {
  AUDIT_EVENT_DEFINITIONS,
  AUDIT_EVENT_WIRES,
  type AuditEventDefinition,
  type AuditEventWire,
} from '@/types/generated/auditEventDefinitions';
import { formatRelativeDateTime } from '@/utils/date';
import { EVENT_LOG_COPY } from './types';
import type {
  EventLogDomain,
  EventLogHeadlinePart,
  EventLogLaboratorySubdomain,
  EventLogRecord,
  ResolvedEventLogItem,
} from './types';
import {
  append,
  appendBracketReasonLiteral,
  appendClause,
  appendFormatClause,
  appendForOrderPhrase,
  appendForTestNameRef,
  appendForTestOnOrderPhrase,
  appendInfoHighlight,
  appendOnOrderPhrase,
  appendText,
  appendTrailingActor,
  appendTriggeredByClause,
  buildLabOrderTestHeadline,
  buildLabSampleHeadline,
  buildValidationRejectHeadline,
  changeNew,
  collectTestCodes,
  DEFAULT_HEADLINE_CONTEXT,
  escalationResolveTrailingAction,
  eventLogId,
  formatOrderStatusLabel,
  formatReasonLabel,
  formatTestNamesLabel,
  insuranceClaimRecordPhrase,
  invoiceRecordPhrase,
  isSystemActorRecord,
  mainPart,
  metaString,
  orderRecordPhrase,
  patientProfileRef,
  patientRecordPhrase,
  paymentRecordPhrase,
  resolveOrderId,
  resolvePatientId,
  targetOrder,
  targetOrderTestRef,
  targetPatient,
  targetSample,
  testHighlightFromMetaKey,
  userAccountRecordPhrase,
  withHashPrefix,
  type BuiltEventLogHeadline,
  type EventCatalogEntry,
  type EventLogHeadlineContext,
  type PatientNameLookup,
  type TestNameLookup,
} from './catalogParts';

export {
  collectTestCodes,
  eventLogId,
  withHashPrefix,
  type EventCatalogEntry,
  type EventLogHeadlineContext,
  type TestNameLookup,
  type PatientNameLookup,
} from './catalogParts';

/** Laboratory wires — also used by embedded lab timeline (see laboratoryResolve). */
export const LABORATORY_HEADLINE_BUILDERS: Record<
  string,
  (record: EventLogRecord, context: EventLogHeadlineContext) => EventLogHeadlinePart[]
> = {
  'laboratory.sample.create': r => buildLabSampleHeadline(r, 'label generated'),
  'laboratory.sample.collect': r => buildLabSampleHeadline(r, 'collected'),
  'laboratory.sample.reject': r => {
    const parts = buildLabSampleHeadline(r, 'rejected');
    return appendClause(parts, metaString(r, 'rejection_reason') ?? '');
  },
  'laboratory.sample.recollect_request': r =>
    buildLabSampleHeadline(r, 'recollection requested'),
  'laboratory.sample.recollect_approve': r =>
    buildLabSampleHeadline(r, 'recollection approved'),
  'laboratory.sample.recollect_deny': r => {
    const parts = buildLabSampleHeadline(r, 'recollection denied');
    return appendClause(parts, metaString(r, 'reason') ?? '');
  },
  'laboratory.analyzer.duplicate_ingest': (r, c) => {
    const parts = buildLabOrderTestHeadline(r, c, 'Analyzer ingest', 'ignored');
    return appendBracketReasonLiteral(parts, 'Duplicate');
  },
  'laboratory.analyzer.ingest_rejected': (r, c) => {
    const parts = buildLabOrderTestHeadline(r, c, 'Analyzer ingest', 'rejected');
    return appendClause(parts, metaString(r, 'reason') ?? '');
  },
  'laboratory.result.enter': (r, c) =>
    buildLabOrderTestHeadline(r, c, 'Results', 'recorded'),
  'laboratory.result.update': (r, c) =>
    buildLabOrderTestHeadline(r, c, 'Results', 'updated'),
  'laboratory.result.critical_detect': (r, c) =>
    buildLabOrderTestHeadline(r, c, 'Critical value', 'detected'),
  'laboratory.result.critical_notify': (r, c) =>
    buildLabOrderTestHeadline(r, c, 'Clinician notification', 'documented'),
  'laboratory.result.critical_acknowledge': (r, c) =>
    buildLabOrderTestHeadline(r, c, 'Critical value protocol', 'acknowledged'),
  'laboratory.validation.approve': (r, c) =>
    buildLabOrderTestHeadline(r, c, 'Results', 'validated'),
  'laboratory.validation.reject': (r, c) => buildValidationRejectHeadline(r, c),
  'laboratory.escalation.trigger': (r, c) => {
    const parts = buildLabOrderTestHeadline(r, c, 'Escalation', 'triggered');
    return appendClause(parts, metaString(r, 'reason_code') ?? '');
  },
  'laboratory.escalation.resolve': (r, c) => {
    const parts = buildLabOrderTestHeadline(r, c, 'Escalation', escalationResolveTrailingAction(r));
    const reasonCode = metaString(r, 'reason_code');
    if (reasonCode) {
      return appendInfoHighlight(parts, `Exception: ${formatReasonLabel(reasonCode)}`);
    }
    return parts;
  },
};

const EVENT_HEADLINE_BUILDERS: Record<
  string,
  (record: EventLogRecord, context: EventLogHeadlineContext) => EventLogHeadlinePart[]
> = {
  'patient.create': (r, c) => {
    let parts = appendText([], 'Patient profile ');
    parts = append(parts, ...patientProfileRef(r, c));
    return appendText(parts, ' created');
  },
  'patient.update': (r, c) => {
    let parts = appendText([], 'Patient profile ');
    parts = append(parts, ...patientProfileRef(r, c));
    return appendText(parts, ' updated');
  },
  'patient.delete': (r, c) => {
    let parts = appendText([], 'Patient profile ');
    parts = append(parts, ...patientProfileRef(r, c));
    return appendText(parts, ' archived');
  },
  'patient.view': (r, c) => {
    let parts = appendText([], 'Patient chart ');
    parts = append(parts, ...patientProfileRef(r, c));
    return appendText(parts, ' viewed');
  },
  'order.create': (r, c) => {
    const orderId = resolveOrderId(r);
    let parts = orderId ? append([], orderRecordPhrase(orderId, 'Order ')) : appendText([], 'Order ');
    parts = appendText(parts, ' created');
    const patientId = resolvePatientId(r);
    if (patientId != null) {
      parts = appendText(parts, ' for patient ');
      parts = append(parts, patientRecordPhrase(patientId, c, ''));
    }
    return parts;
  },
  'order.update': r => {
    const orderId = resolveOrderId(r);
    const parts = orderId ? append([], orderRecordPhrase(orderId, 'Order ')) : appendText([], 'Order ');
    return appendText(parts, ' updated');
  },
  'order.delete': r => appendText(append([], targetOrder(r, 'Order ')), ' cancelled'),
  'order.status': r => {
    const statusLabel = formatOrderStatusLabel(changeNew(r, 'status'));
    const orderId = resolveOrderId(r);
    let parts = orderId ? append([], orderRecordPhrase(orderId, 'Order ')) : appendText([], 'Order ');
    parts = appendText(parts, ' status changed to ');
    return append(parts, mainPart(statusLabel));
  },
  'order.test.add': (r, c) => {
    let parts = append([], ...targetOrderTestRef(r, c));
    parts = appendText(parts, ' added to ');
    const orderId = resolveOrderId(r);
    if (orderId) parts = append(parts, orderRecordPhrase(orderId));
    return parts;
  },
  'order.test.remove': (r, c) => {
    let parts = append([], ...targetOrderTestRef(r, c));
    parts = appendText(parts, ' removed from ');
    const orderId = resolveOrderId(r);
    if (orderId) parts = append(parts, orderRecordPhrase(orderId));
    return parts;
  },
  'order.test.cancel': (r, c) => {
    let parts = append([], ...targetOrderTestRef(r, c));
    parts = appendText(parts, ' cancelled');
    parts = appendOnOrderPhrase(parts, r);
    return appendClause(parts, metaString(r, 'reason') ?? '');
  },
  'order.test.retest': (r, c) => {
    let parts = appendText([], 'Retest ordered ');
    parts = appendForTestNameRef(parts, r, c);
    parts = appendOnOrderPhrase(parts, r);
    return appendClause(parts, metaString(r, 'reason') ?? '');
  },
  'order.test.reflex': (r, c) => {
    let parts = appendText([], 'Reflex test ');
    parts = append(parts, testHighlightFromMetaKey(r, 'added_test_code', c) ?? mainPart('—'));
    parts = appendText(parts, ' added to ');
    const orderId = resolveOrderId(r);
    if (orderId) parts = append(parts, orderRecordPhrase(orderId));
    return appendTriggeredByClause(parts, r, c);
  },
  ...LABORATORY_HEADLINE_BUILDERS,
  'billing.payment.process': r => {
    const parts = appendText(append([], paymentRecordPhrase(r.targetId)), ' recorded');
    return appendForOrderPhrase(parts, r);
  },
  'billing.invoice.generate': r => {
    const parts = appendText(append([], invoiceRecordPhrase(r.targetId)), ' generated');
    return appendForOrderPhrase(parts, r);
  },
  'billing.invoice.void': r => {
    let parts = appendText(append([], invoiceRecordPhrase(r.targetId)), ' voided');
    parts = appendForOrderPhrase(parts, r);
    return appendClause(parts, metaString(r, 'reason') ?? '');
  },
  'billing.insurance.submit': r => {
    const parts = appendText(append([], insuranceClaimRecordPhrase(r.targetId)), ' submitted');
    return appendForOrderPhrase(parts, r);
  },
  'reporting.generate': r => {
    let parts = appendText([], 'Report generated ');
    const orderId = resolveOrderId(r);
    if (orderId) {
      parts = appendText(parts, 'for ');
      parts = append(parts, orderRecordPhrase(orderId));
    }
    return parts;
  },
  'reporting.download': (r, c) => {
    let parts = appendText([], 'Report downloaded ');
    parts = appendForTestOnOrderPhrase(parts, r, c);
    return appendFormatClause(parts, metaString(r, 'format') ?? '');
  },
  'system.user.login': () => appendText([], 'signed in'),
  'system.user.logout': () => appendText([], 'signed out'),
  'system.user.create': r =>
    appendText(append([], userAccountRecordPhrase(r.targetId)), ' created'),
  'system.user.update': r =>
    appendText(append([], userAccountRecordPhrase(r.targetId)), ' updated'),
  'system.catalog.create': (r, c) => {
    const highlight = testHighlightFromMetaKey(r, 'test_code', c);
    const parts: EventLogHeadlinePart[] = highlight
      ? [mainPart('Catalog test '), highlight]
      : [mainPart(`Catalog test ${withHashPrefix(String(r.targetId))}`)];
    return appendText(parts, ' created');
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
      return append(parts, userAccountRecordPhrase(record.targetId));
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

function auditDefinitionToSeed(def: AuditEventDefinition): CatalogSeed {
  return {
    eventType: def.wire,
    domain: def.domain as EventLogDomain,
    ...(def.laboratorySubdomain
      ? { laboratorySubdomain: def.laboratorySubdomain as EventLogLaboratorySubdomain }
      : {}),
    domainLabel: def.domainLabel,
    verbPhrase: def.verbPhrase,
    ...(def.headlineMetaKeys?.length ? { headlineMetaKeys: def.headlineMetaKeys } : {}),
    ...(def.leadingActor ? { leadingActor: def.leadingActor } : {}),
    ...(def.trailingActor ? { trailingActor: def.trailingActor } : {}),
    ...(def.treatAsSystemActor ? { treatAsSystemActor: def.treatAsSystemActor } : {}),
  };
}

const CATALOG_SEEDS: CatalogSeed[] = AUDIT_EVENT_WIRES.map(wire =>
  auditDefinitionToSeed(AUDIT_EVENT_DEFINITIONS[wire]),
);

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
    trailingActor: 'human',
    buildHeadline: (record, context) => buildFallbackHeadline(record, fallbackEntry, context),
  };
  return fallbackEntry;
}

/** Metadata keys already rendered in the headline (exclude from note cards). */
export function headlineMetaKeysFor(eventType: string): readonly string[] {
  const fromCatalog = getCatalogEntry(eventType).headlineMetaKeys;
  if (fromCatalog?.length) return fromCatalog;
  const wire = eventType as AuditEventWire;
  return AUDIT_EVENT_DEFINITIONS[wire]?.headlineMetaKeys ?? [];
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

// --- resolveItem.ts (feed resolution) ---

function formatTargetLabel(
  record: EventLogRecord,
  getTestName: TestNameLookup,
  getPatientName: PatientNameLookup
): string {
  const testCodes = collectTestCodes(record);

  switch (record.targetType) {
    case 'patient':
      return getPatientName(record.targetId);
    case 'order':
      return eventLogId.order(record.targetId);
    case 'sample':
      return eventLogId.sample(record.targetId);
    case 'order_test':
      return testCodes.length > 0
        ? formatTestNamesLabel(testCodes, getTestName)
        : eventLogId.orderTest(record.targetId);
    case 'payment':
      return eventLogId.payment(record.targetId);
    case 'invoice':
      return eventLogId.invoice(record.targetId);
    case 'insurance_claim':
      return `Claim ${withHashPrefix(String(record.targetId))}`;
    case 'user':
      return eventLogId.user(record.targetId);
    case 'test_catalog':
      return testCodes.length > 0
        ? formatTestNamesLabel(testCodes, getTestName)
        : withHashPrefix(String(record.targetId));
    default:
      return withHashPrefix(`${record.targetType}-${record.targetId}`);
  }
}

function headlineIncludesNote(parts: EventLogHeadlinePart[], note: string): boolean {
  const haystack = parts.map(part => part.text).join('');
  const trimmed = note.trim();
  if (!trimmed) return false;
  if (haystack.includes(trimmed)) return true;
  return haystack.includes(trimmed.replace(/_/g, ' '));
}

function pickNoteForCard(
  record: EventLogRecord,
  headlineParts: EventLogHeadlinePart[]
): { label: string; text: string } | null {
  const meta = record.metadata ?? {};
  const headlineKeys = new Set(headlineMetaKeysFor(record.eventType));

  const cardFirst: Array<{ label: string; value: unknown }> = [
    { label: EVENT_LOG_COPY.narrativeDefaultLabel, value: meta.notes },
    { label: EVENT_LOG_COPY.narrativeDefaultLabel, value: meta.rejection_notes },
    { label: EVENT_LOG_COPY.commentLabel, value: meta.comment },
  ];

  for (const { label, value } of cardFirst) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const text = value.trim();
    if (headlineIncludesNote(headlineParts, text)) continue;
    return { label, text };
  }

  const reasonFields: Array<{ key: string; value: unknown }> = [
    { key: 'rejection_reason', value: meta.rejection_reason },
    { key: 'reason', value: meta.reason },
  ];

  for (const { key, value } of reasonFields) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const text = value.trim();
    if (headlineKeys.has(key) || headlineIncludesNote(headlineParts, text)) continue;
    return { label: EVENT_LOG_COPY.narrativeDefaultLabel, text };
  }

  return null;
}

function readPlainRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length > 0 ? record : null;
}

function pickResultsForCard(record: EventLogRecord): Record<string, unknown> | null {
  const meta = record.metadata ?? {};
  const fromMeta = readPlainRecord(meta.results) ?? readPlainRecord(meta.proposedResults);
  if (fromMeta) return fromMeta;

  const fromChanges = readPlainRecord(record.changes?.newValues?.results);
  if (fromChanges) return fromChanges;

  return null;
}

function pickResultFlags(record: EventLogRecord): string[] | undefined {
  const flags = record.metadata?.flags;
  if (!Array.isArray(flags) || flags.length === 0) return undefined;
  if (!flags.every(entry => typeof entry === 'string')) return undefined;
  return flags;
}

export interface ResolveEventLogOptions {
  showEventTypeInMeta?: boolean;
  includeDebugPayload?: boolean;
  getTestName?: TestNameLookup;
  getPatientName?: PatientNameLookup;
}

export function resolveEventLogItem(
  record: EventLogRecord,
  options?: ResolveEventLogOptions
): ResolvedEventLogItem {
  const catalog = getCatalogEntry(record.eventType);
  const system = isSystemActorRecord(record, catalog);
  const getTestName = options?.getTestName ?? (code => code);
  const getPatientName = options?.getPatientName ?? (id => eventLogId.patient(id));
  const built = buildEventLogHeadline(record, { getTestName, getPatientName });
  const note = pickNoteForCard(record, built.parts);
  const results = pickResultsForCard(record);
  const resultFlags = results ? pickResultFlags(record) : undefined;

  const actorName = system ? EVENT_LOG_COPY.systemActorName : record.actorSnapshot.name;
  const targetLabel = formatTargetLabel(record, getTestName, getPatientName);

  return {
    record,
    domain: catalog.domain,
    laboratorySubdomain: catalog.laboratorySubdomain,
    domainLabel: catalog.domainLabel,
    headline: {
      actorName,
      verbPhrase: catalog.verbPhrase,
      targetLabel,
    },
    headlineParts: built.parts,
    metaTime: formatRelativeDateTime(record.createdAt),
    showEventTypeInMeta: options?.showEventTypeInMeta,
    narrativeLabel: note?.label,
    narrativeText: note?.text,
    results: results ?? undefined,
    resultFlags,
    debugPayload: options?.includeDebugPayload
      ? {
          eventType: record.eventType,
          eventScope: record.eventScope ?? undefined,
          targetType: record.targetType,
          targetId: record.targetId,
          metadata: record.metadata ?? undefined,
          changes: record.changes ?? undefined,
        }
      : undefined,
    isSystemActor: system,
    omitActorInHeadline: built.omitActorPrefix,
  };
}

export function resolveEventLogItems(
  records: EventLogRecord[],
  options?: ResolveEventLogOptions
): ResolvedEventLogItem[] {
  return records.map(record => resolveEventLogItem(record, options));
}
