/**
 * Maps backend dot-notation event types to domain, default presentation, and verb copy.
 */
import type { EventLogDomain, EventLogLaboratorySubdomain } from './types';

/** Metadata keys already shown in the headline (exclude from note card). */
export const HEADLINE_META_KEYS: Record<string, readonly string[]> = {
  'order.update': ['field', 'value'],
  'order.status': ['trigger'],
  'order.test.add': ['test_code'],
  'order.test.remove': ['test_code'],
  'order.test.cancel': ['test_code', 'reason'],
  'order.test.retest': ['test_code', 'reason'],
  'order.test.reflex': ['added_test_code', 'triggered_by'],
  'laboratory.sample.reject': ['rejection_reason'],
  'laboratory.sample.recollect_request': ['stage'],
  'laboratory.sample.recollect_deny': ['reason'],
  'laboratory.result.enter': ['test_code'],
  'laboratory.result.update': ['test_code'],
  'laboratory.result.critical_detect': ['test_code'],
  'laboratory.result.critical_notify': ['test_code'],
  'laboratory.result.critical_acknowledge': ['test_code'],
  'laboratory.validation.approve': ['test_code'],
  'laboratory.validation.reject': ['reason', 'test_code'],
  'laboratory.escalation.trigger': ['reason_code', 'test_code'],
  'laboratory.escalation.resolve': ['resolution', 'test_code'],
  'billing.payment.process': ['amount', 'payment_method'],
  'billing.invoice.void': ['reason'],
  'billing.insurance.submit': ['payer', 'claim_number'],
  'reporting.download': ['format'],
  'system.catalog.create': ['test_code'],
  'system.catalog.update': ['test_code'],
};

export interface EventTypeRegistryEntry {
  domain: EventLogDomain;
  laboratorySubdomain?: EventLogLaboratorySubdomain;
  verbPhrase: string;
  domainLabel: string;
}

const LAB_SAMPLE: Pick<EventTypeRegistryEntry, 'domain' | 'laboratorySubdomain' | 'domainLabel'> = {
  domain: 'laboratory',
  laboratorySubdomain: 'sample',
  domainLabel: 'Sample',
};

const LAB_RESULT: Pick<EventTypeRegistryEntry, 'domain' | 'laboratorySubdomain' | 'domainLabel'> = {
  domain: 'laboratory',
  laboratorySubdomain: 'result',
  domainLabel: 'Results',
};

const LAB_VALIDATION: Pick<EventTypeRegistryEntry, 'domain' | 'laboratorySubdomain' | 'domainLabel'> =
  {
    domain: 'laboratory',
    laboratorySubdomain: 'validation',
    domainLabel: 'Validation',
  };

const LAB_ESCALATION: Pick<EventTypeRegistryEntry, 'domain' | 'laboratorySubdomain' | 'domainLabel'> =
  {
    domain: 'laboratory',
    laboratorySubdomain: 'escalation',
    domainLabel: 'Escalation',
  };

export const EVENT_TYPE_REGISTRY: Record<string, EventTypeRegistryEntry> = {
  'patient.create': {
    domain: 'patient',
    verbPhrase: 'registered patient',
    domainLabel: 'Patient',
  },
  'patient.update': {
    domain: 'patient',
    verbPhrase: 'updated patient',
    domainLabel: 'Patient',
  },
  'patient.delete': {
    domain: 'patient',
    verbPhrase: 'archived patient',
    domainLabel: 'Patient',
  },
  'patient.view': {
    domain: 'patient',
    verbPhrase: 'viewed patient chart',
    domainLabel: 'Patient',
  },
  'order.create': {
    domain: 'order',
    verbPhrase: 'created order',
    domainLabel: 'Order',
  },
  'order.update': {
    domain: 'order',
    verbPhrase: 'updated order',
    domainLabel: 'Order',
  },
  'order.status': {
    domain: 'order',
    verbPhrase: 'order status moved',
    domainLabel: 'Order',
  },
  'order.delete': {
    domain: 'order',
    verbPhrase: 'cancelled order',
    domainLabel: 'Order',
  },
  'order.test.add': {
    domain: 'order',
    verbPhrase: 'added test to order',
    domainLabel: 'Order',
  },
  'order.test.remove': {
    domain: 'order',
    verbPhrase: 'removed test from order',
    domainLabel: 'Order',
  },
  'order.test.cancel': {
    domain: 'order',
    verbPhrase: 'cancelled test on order',
    domainLabel: 'Order',
  },
  'order.test.retest': {
    domain: 'order',
    verbPhrase: 'requested retest for',
    domainLabel: 'Order',
  },
  'order.test.reflex': {
    domain: 'order',
    verbPhrase: 'added reflex test',
    domainLabel: 'Order',
  },
  'laboratory.sample.create': {
    ...LAB_SAMPLE,
    verbPhrase: 'accessioned sample',
  },
  'laboratory.sample.collect': {
    ...LAB_SAMPLE,
    verbPhrase: 'collected sample',
  },
  'laboratory.sample.reject': {
    ...LAB_SAMPLE,
    verbPhrase: 'rejected sample',
  },
  'laboratory.sample.recollect_request': {
    ...LAB_SAMPLE,
    verbPhrase: 'requested recollection for',
  },
  'laboratory.sample.recollect_approve': {
    ...LAB_SAMPLE,
    verbPhrase: 'approved recollection for',
  },
  'laboratory.sample.recollect_deny': {
    ...LAB_SAMPLE,
    verbPhrase: 'denied recollection for',
  },
  'laboratory.result.enter': {
    ...LAB_RESULT,
    verbPhrase: 'entered results for',
  },
  'laboratory.result.update': {
    ...LAB_RESULT,
    verbPhrase: 'updated results for',
  },
  'laboratory.result.critical_detect': {
    ...LAB_RESULT,
    verbPhrase: 'flagged critical value on',
  },
  'laboratory.result.critical_notify': {
    ...LAB_RESULT,
    verbPhrase: 'notified provider about critical on',
  },
  'laboratory.result.critical_acknowledge': {
    ...LAB_RESULT,
    verbPhrase: 'acknowledged critical on',
  },
  'laboratory.validation.approve': {
    ...LAB_VALIDATION,
    verbPhrase: 'validated',
  },
  'laboratory.validation.reject': {
    ...LAB_VALIDATION,
    verbPhrase: 'sent back for correction on',
  },
  'laboratory.escalation.trigger': {
    ...LAB_ESCALATION,
    verbPhrase: 'escalated',
  },
  'laboratory.escalation.resolve': {
    ...LAB_ESCALATION,
    verbPhrase: 'resolved escalation on',
  },
  'billing.payment.process': {
    domain: 'billing',
    verbPhrase: 'recorded payment for order',
    domainLabel: 'Billing',
  },
  'billing.invoice.generate': {
    domain: 'billing',
    verbPhrase: 'generated invoice for order',
    domainLabel: 'Billing',
  },
  'billing.invoice.void': {
    domain: 'billing',
    verbPhrase: 'voided invoice for order',
    domainLabel: 'Billing',
  },
  'billing.insurance.submit': {
    domain: 'billing',
    verbPhrase: 'submitted insurance claim for order',
    domainLabel: 'Billing',
  },
  'reporting.generate': {
    domain: 'reporting',
    verbPhrase: 'generated report for order',
    domainLabel: 'Reporting',
  },
  'reporting.download': {
    domain: 'reporting',
    verbPhrase: 'downloaded report for order',
    domainLabel: 'Reporting',
  },
  'system.user.login': {
    domain: 'system',
    verbPhrase: 'signed in',
    domainLabel: 'System',
  },
  'system.user.logout': {
    domain: 'system',
    verbPhrase: 'signed out',
    domainLabel: 'System',
  },
  'system.user.create': {
    domain: 'system',
    verbPhrase: 'created user account',
    domainLabel: 'System',
  },
  'system.user.update': {
    domain: 'system',
    verbPhrase: 'updated user account',
    domainLabel: 'System',
  },
  'system.catalog.create': {
    domain: 'system',
    verbPhrase: 'added catalog entry',
    domainLabel: 'Catalog',
  },
  'system.catalog.update': {
    domain: 'system',
    verbPhrase: 'updated catalog entry',
    domainLabel: 'Catalog',
  },
};

export function getRegistryEntry(eventType: string): EventTypeRegistryEntry {
  const known = EVENT_TYPE_REGISTRY[eventType];
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

  return {
    domain,
    verbPhrase: 'updated',
    domainLabel: domain.charAt(0).toUpperCase() + domain.slice(1),
  };
}
