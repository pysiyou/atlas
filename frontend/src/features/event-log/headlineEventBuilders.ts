/**
 * Per-event-type headline part builders.
 */
import { eventLogId, withHashPrefix } from './formatRef';
import type { EventLogHeadlinePart, EventLogRecord } from './types';
import type { EventTypeRegistryEntry } from './registry';
import {
  append,
  appendClause,
  appendText,
  buildFromRegistryFallback,
  changeNew,
  formatOrderStatusLabel,
  metaString,
  statusToPhrase,
  targetOrder,
  targetOrderTestRef,
  targetPatient,
  targetSample,
  testHighlightFromMetaKey,
  type EventLogHeadlineContext,
} from './headlineHelpers';

type HeadlineBuilder = (
  record: EventLogRecord,
  registry: EventTypeRegistryEntry,
  context: EventLogHeadlineContext
) => EventLogHeadlinePart[];

function simplePhrase(
  phrase: string,
  target: (record: EventLogRecord) => EventLogHeadlinePart,
  record: EventLogRecord
): EventLogHeadlinePart[] {
  return append(appendText([], phrase), target(record));
}

function orderTestPhrase(
  phrase: string,
  record: EventLogRecord,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  return append(appendText([], phrase), ...targetOrderTestRef(record, context));
}

const HEADLINE_BUILDERS: Record<string, HeadlineBuilder> = {
  'patient.create': r => simplePhrase('registered patient ', targetPatient, r),
  'patient.update': r => simplePhrase('updated patient ', targetPatient, r),
  'patient.delete': r => simplePhrase('archived patient ', targetPatient, r),
  'patient.view': r => simplePhrase('viewed chart for patient ', targetPatient, r),
  'order.create': r => simplePhrase('created order ', targetOrder, r),
  'order.update': r => simplePhrase('updated order ', targetOrder, r),
  'order.delete': r => simplePhrase('cancelled order ', targetOrder, r),
  'order.status': r => {
    const statusLabel = formatOrderStatusLabel(changeNew(r, 'status'));
    let parts = appendText([], 'Order ');
    parts = append(parts, targetOrder(r));
    parts = appendText(parts, ' status moved to ');
    return append(parts, { text: statusLabel, emphasis: true });
  },
  'order.test.add': (r, _, c) => orderTestPhrase('added ', r, c),
  'order.test.remove': (r, _, c) => {
    const parts = orderTestPhrase('removed ', r, c);
    return append(parts, ...statusToPhrase(changeNew(r, 'status')));
  },
  'order.test.cancel': (r, _, c) =>
    appendClause(orderTestPhrase('cancelled ', r, c), metaString(r, 'reason') ?? ''),
  'order.test.retest': (r, _, c) =>
    appendClause(orderTestPhrase('ordered retest for ', r, c), metaString(r, 'reason') ?? ''),
  'order.test.reflex': (r, _, c) => {
    let parts = appendText([], 'added reflex test ');
    parts = append(
      parts,
      testHighlightFromMetaKey(r, 'added_test_code', c) ?? { text: '—', emphasis: true }
    );
    parts = appendText(parts, ' triggered by ');
    return append(
      parts,
      testHighlightFromMetaKey(r, 'triggered_by', c) ?? { text: '—', emphasis: true }
    );
  },
  'laboratory.sample.create': r => simplePhrase('accessioned sample ', targetSample, r),
  'laboratory.sample.collect': r => simplePhrase('collected sample ', targetSample, r),
  'laboratory.sample.reject': r =>
    appendClause(
      simplePhrase('rejected sample ', targetSample, r),
      metaString(r, 'rejection_reason') ?? ''
    ),
  'laboratory.sample.recollect_request': r =>
    simplePhrase('requested recollection for sample ', targetSample, r),
  'laboratory.sample.recollect_approve': r =>
    simplePhrase('approved recollection for sample ', targetSample, r),
  'laboratory.sample.recollect_deny': r =>
    appendClause(
      simplePhrase('denied recollection for sample ', targetSample, r),
      metaString(r, 'reason') ?? ''
    ),
  'laboratory.result.enter': (r, _, c) => orderTestPhrase('entered results for ', r, c),
  'laboratory.result.update': (r, _, c) => {
    const parts = orderTestPhrase('updated results for ', r, c);
    return append(parts, ...statusToPhrase(changeNew(r, 'status')));
  },
  'laboratory.result.critical_detect': (r, _, c) =>
    orderTestPhrase('detected critical result on ', r, c),
  'laboratory.result.critical_notify': (r, _, c) =>
    orderTestPhrase('sent critical notification for ', r, c),
  'laboratory.result.critical_acknowledge': (r, _, c) =>
    orderTestPhrase('acknowledged critical result on ', r, c),
  'laboratory.validation.approve': (r, _, c) => orderTestPhrase('validated results for ', r, c),
  'laboratory.validation.reject': (r, _, c) => {
    let parts = orderTestPhrase('returned ', r, c);
    parts = appendText(parts, ' for correction');
    return appendClause(parts, metaString(r, 'reason') ?? '');
  },
  'laboratory.escalation.trigger': (r, _, c) => {
    let parts = orderTestPhrase('escalated ', r, c);
    if (metaString(r, 'reason_code')) {
      parts = appendText(parts, ` (${metaString(r, 'reason_code')})`);
    }
    return parts;
  },
  'laboratory.escalation.resolve': (r, _, c) => {
    let parts = orderTestPhrase('resolved escalation on ', r, c);
    if (metaString(r, 'resolution')) {
      parts = appendText(parts, ` (${metaString(r, 'resolution')})`);
    }
    return parts;
  },
  'billing.payment.process': r =>
    append(appendText([], 'recorded payment '), {
      text: eventLogId.payment(r.targetId),
      emphasis: true,
    }),
  'billing.invoice.generate': r =>
    append(appendText([], 'generated invoice '), {
      text: eventLogId.invoice(r.targetId),
      emphasis: true,
    }),
  'billing.invoice.void': r => {
    let parts = append(appendText([], 'voided invoice '), {
      text: eventLogId.invoice(r.targetId),
      emphasis: true,
    });
    parts = append(parts, ...statusToPhrase(changeNew(r, 'status')));
    return appendClause(parts, metaString(r, 'reason') ?? '');
  },
  'billing.insurance.submit': r =>
    append(appendText([], 'submitted insurance claim '), {
      text: withHashPrefix(String(r.targetId)),
      emphasis: true,
    }),
  'reporting.generate': r => simplePhrase('generated report for ', targetOrder, r),
  'reporting.download': (r, _, c) => {
    let parts = orderTestPhrase('downloaded report for ', r, c);
    if (metaString(r, 'format')) {
      parts = appendText(parts, ` as ${metaString(r, 'format')}`);
    }
    return parts;
  },
  'system.user.login': () => appendText([], 'signed in'),
  'system.user.logout': () => appendText([], 'signed out'),
  'system.user.create': r =>
    append(appendText([], 'created user '), { text: eventLogId.user(r.targetId), emphasis: true }),
  'system.user.update': r =>
    append(appendText([], 'updated user '), { text: eventLogId.user(r.targetId), emphasis: true }),
  'system.catalog.create': (r, _, c) => {
    const parts = appendText([], 'added catalog test ');
    return append(
      parts,
      testHighlightFromMetaKey(r, 'test_code', c) ?? {
        text: withHashPrefix(String(r.targetId)),
        emphasis: true,
      }
    );
  },
  'system.catalog.update': (r, _, c) => {
    const parts = appendText([], 'updated catalog test ');
    return append(
      parts,
      testHighlightFromMetaKey(r, 'test_code', c) ?? {
        text: withHashPrefix(String(r.targetId)),
        emphasis: true,
      }
    );
  },
};

export function buildHeadlinePartsForEvent(
  record: EventLogRecord,
  registry: EventTypeRegistryEntry,
  context: EventLogHeadlineContext
): EventLogHeadlinePart[] {
  const builder = HEADLINE_BUILDERS[record.eventType];
  if (builder) {
    return builder(record, registry, context);
  }
  const parts = buildFromRegistryFallback(record, registry, context);
  return append(parts, ...statusToPhrase(changeNew(record, 'status')));
}
