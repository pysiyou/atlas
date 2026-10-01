import type { EventLogFilterField } from './types';

/** Canonical left-to-right / top-to-bottom order for event log filter controls. */
export const EVENT_LOG_FILTER_FIELD_ORDER: EventLogFilterField[] = [
  'entityId',
  'dateRange',
  'kind',
  'verbosity',
  'includeAccess',
];
