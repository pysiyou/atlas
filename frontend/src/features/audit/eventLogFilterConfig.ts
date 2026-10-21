/**
 * Event log filter field lists, kind options, and UI placeholders.
 */
import type { EventLogFilterField, EventLogKind } from './types';

export const GLOBAL_EVENT_LOG_FILTER_FIELDS: EventLogFilterField[] = [
  'search',
  'dateRange',
  'kind',
  'actorRole',
];

export const EVENT_LOG_FILTER_FIELD_ORDER: EventLogFilterField[] = [
  'search',
  'recordId',
  'dateRange',
  'kind',
  'actorRole',
  'actorSearch',
  'verbosity',
  'includeAccess',
];

export interface EventLogKindOption {
  id: EventLogKind;
  label: string;
}

export const EVENT_LOG_KIND_OPTIONS: EventLogKindOption[] = [
  { id: 'patient', label: 'Patient' },
  { id: 'order', label: 'Order' },
  { id: 'laboratory', label: 'Laboratory' },
  { id: 'laboratory:sample', label: 'Laboratory · Sample' },
  { id: 'laboratory:result', label: 'Laboratory · Results' },
  { id: 'laboratory:validation', label: 'Laboratory · Validation' },
  { id: 'laboratory:escalation', label: 'Laboratory · Escalation' },
  { id: 'laboratory:quality', label: 'Laboratory · Quality' },
  { id: 'laboratory:analyzer', label: 'Laboratory · Analyzer' },
  { id: 'billing', label: 'Billing' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'system', label: 'System' },
];

export const EVENT_LOG_FILTER_PLACEHOLDERS = {
  dateRange: 'Filter by date range',
  kind: 'Event domain',
  recordId: 'ORD… / TST… / SAM… / PAT…',
  includeAccess: 'Include views & downloads',
  verbosity: 'Detail level',
  actorRole: 'Actor role',
  actorSearch: 'Username or name…',
  search: 'ORD, PAT, TST, SAM, name…',
} as const;
