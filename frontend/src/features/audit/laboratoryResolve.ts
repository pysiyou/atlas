/**
 * Lab-scoped event log resolution — loads a smaller catalog slice for embedded panels.
 */
import type { EventLogRecord, ResolvedEventLogItem } from './types';
import type { ResolveEventLogOptions } from './catalog';
import { resolveEventLogItem } from './catalog';

/** Resolve audit rows for `scope: 'lab'` queries (modal / sample timeline). */
export function resolveLabEventLogItems(
  records: EventLogRecord[],
  options?: ResolveEventLogOptions
): ResolvedEventLogItem[] {
  return records.map(record => resolveEventLogItem(record, options));
}
