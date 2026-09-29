import { withHashPrefix } from '../formatRef';
import { collectTestCodes } from '../testDisplay';
import type { EventLogHeadlinePart, EventLogRecord } from '../types';
import type { EventLogHeadlineContext } from '../headline/context';
import {
  append,
  appendClause,
  appendOutcomeClause,
  appendText,
  changeNew,
  formatOrderStatusLabel,
  mainPart,
  metaString,
} from '../headline/parts';
import {
  appendForOrderPhrase,
  appendUnderOrderPhrase,
  highlightedTestListPart,
  insuranceClaimEntityPhrase,
  invoiceEntityPhrase,
  orderEntityPhrase,
  orderTestEntityPhrase,
  paymentEntityPhrase,
  recollectionForSamplePhrase,
  resolveOrderId,
  resolveOrderTestId,
  resultsForTestUnderOrderPhrase,
  retestUnderOrderWithTrailing,
  targetOrder,
  targetOrderTestRef,
  targetPatient,
  targetPatientFromContext,
  targetSample,
  testCentricUnderOrderPhrase,
  testHighlightFromMetaKey,
  testUnderOrderWithTrailing,
  userAccountEntityPhrase,
} from '../headline/phrasing';

export const EVENT_HEADLINE_BUILDERS: Record<
  string,
  (record: EventLogRecord, context: EventLogHeadlineContext) => EventLogHeadlinePart[]
> = {
  'patient.create': r => {
    let parts = appendText([], 'New profile for ');
    parts = append(parts, targetPatient(r));
    return appendText(parts, ' created');
  },
  'patient.update': r => {
    let parts = appendText([], 'Details for ');
    parts = append(parts, targetPatient(r));
    return appendText(parts, ' updated');
  },
  'patient.delete': r => {
    let parts = appendText([], 'Profile for ');
    parts = append(parts, targetPatient(r));
    return appendText(parts, ' archived');
  },
  'patient.view': r => {
    let parts = append([], targetPatient(r));
    return appendText(parts, "'s profile viewed");
  },
  'order.create': r => {
    let parts = appendText([], 'New ');
    parts = append(parts, targetOrder(r));
    parts = appendText(parts, ' placed');
    const patient = targetPatientFromContext(r);
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
