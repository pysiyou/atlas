/**
 * Event log filter field lists, kind options, and UI placeholders.
 */
import type { EventLogFilterField } from './types';
import type { EventLogKind } from '@/types/generated/auditEventTaxonomy';

export { EVENT_LOG_KIND_OPTIONS } from '@/types/generated/auditEventTaxonomy';

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
