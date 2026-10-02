import type { EventLogFilterField } from './types';

/** Canonical left-to-right / top-to-bottom order for event log filter controls. */
export const EVENT_LOG_FILTER_FIELD_ORDER: EventLogFilterField[] = [
  'search',
  'entityId',
  'dateRange',
  'kind',
  'actorRole',
  'actorSearch',
  'verbosity',
  'includeAccess',
];
