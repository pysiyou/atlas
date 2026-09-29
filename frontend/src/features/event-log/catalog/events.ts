/**
 * Event log contract (frontend).
 *
 * Dot-notation event types align with backend EventType. Each catalog entry defines
 * feed presentation (domain, headlines) and which metadata keys are consumed by the headline
 * (excluded from detail notes). Actor rules: login/logout use a leading actor; most events
 * append trailing " by {human}"; invoice generate and system sample create omit trailing actor.
 */
import type { EventLogDomain } from '../types';
import type { EventCatalogEntry } from './types';
import { EVENT_HEADLINE_BUILDERS } from './builders';
import { buildFallbackHeadline } from './fallback';

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
