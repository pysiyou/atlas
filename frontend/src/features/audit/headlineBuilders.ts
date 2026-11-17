/**
 * Event-log headline builder map keyed by audit wire.
 * Helpers live in `catalogParts`; registry resolution lives in `catalog`.
 */
import type { EventLogHeadlinePart, EventLogRecord } from './types';
import type { EventLogHeadlineContext } from './catalogParts';
import {
  append,
  appendBracketReasonLiteral,
  appendClause,
  appendForOrderPhrase,
  appendForTestNameRef,
  appendForTestOnOrderPhrase,
  appendFormatClause,
  appendInfoHighlight,
  appendOnOrderPhrase,
  appendText,
  appendTriggeredByClause,
  buildLabOrderTestHeadline,
  buildLabSampleHeadline,
  buildValidationRejectHeadline,
  changeNew,
  escalationResolveTrailingAction,
  formatOrderStatusLabel,
  formatReasonLabel,
  insuranceClaimRecordPhrase,
  invoiceRecordPhrase,
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
  testHighlightFromMetaKey,
  userAccountRecordPhrase,
  withHashPrefix,
} from './catalogParts';

export type EventHeadlineBuilder = (
  record: EventLogRecord,
  context: EventLogHeadlineContext,
) => EventLogHeadlinePart[];

const PATIENT_HEADLINE_BUILDERS: Record<string, EventHeadlineBuilder> = {
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
};

const ORDER_HEADLINE_BUILDERS: Record<string, EventHeadlineBuilder> = {
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
    if (orderId) parts = append(parts, orderRecordPhrase(orderId, 'order '));
    return parts;
  },
  'order.test.remove': (r, c) => {
    let parts = append([], ...targetOrderTestRef(r, c));
    parts = appendText(parts, ' removed from ');
    const orderId = resolveOrderId(r);
    if (orderId) parts = append(parts, orderRecordPhrase(orderId, 'order '));
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
    if (orderId) parts = append(parts, orderRecordPhrase(orderId, 'order '));
    return appendTriggeredByClause(parts, r, c);
  },
};

/** Laboratory wires — also used by embedded lab timeline (see laboratoryResolve). */
export const LABORATORY_HEADLINE_BUILDERS: Record<string, EventHeadlineBuilder> = {
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

const BILLING_HEADLINE_BUILDERS: Record<string, EventHeadlineBuilder> = {
  'billing.payment.process': r => {
    const parts = appendText(append([], paymentRecordPhrase()), ' recorded');
    return appendForOrderPhrase(parts, r);
  },
  'billing.invoice.generate': r => {
    const parts = appendText(append([], invoiceRecordPhrase()), ' generated');
    return appendForOrderPhrase(parts, r);
  },
  'billing.invoice.void': r => {
    let parts = appendText(append([], invoiceRecordPhrase()), ' voided');
    parts = appendForOrderPhrase(parts, r);
    return appendClause(parts, metaString(r, 'reason') ?? '');
  },
  'billing.insurance.submit': r => {
    const parts = appendText(append([], insuranceClaimRecordPhrase(r.targetId)), ' submitted');
    return appendForOrderPhrase(parts, r);
  },
};

const SYSTEM_HEADLINE_BUILDERS: Record<string, EventHeadlineBuilder> = {
  'reporting.generate': r => {
    let parts = appendText([], 'Report generated ');
    const orderId = resolveOrderId(r);
    if (orderId) {
      parts = appendText(parts, 'for ');
      parts = append(parts, orderRecordPhrase(orderId, 'order '));
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
  'system.user.create': () =>
    appendText(append([], userAccountRecordPhrase()), ' created'),
  'system.user.update': () =>
    appendText(append([], userAccountRecordPhrase()), ' updated'),
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

export const EVENT_HEADLINE_BUILDERS: Record<string, EventHeadlineBuilder> = {
  ...PATIENT_HEADLINE_BUILDERS,
  ...ORDER_HEADLINE_BUILDERS,
  ...LABORATORY_HEADLINE_BUILDERS,
  ...BILLING_HEADLINE_BUILDERS,
  ...SYSTEM_HEADLINE_BUILDERS,
};
