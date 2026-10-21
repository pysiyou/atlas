/**
 * Shared event log filter field lists (no React — safe for fast refresh).
 */
import type { EventLogFilterField } from './types';

/** Global Event Log page — simplified filter bar. */
export const GLOBAL_EVENT_LOG_FILTER_FIELDS: EventLogFilterField[] = [
  'search',
  'dateRange',
  'kind',
  'actorRole',
];
