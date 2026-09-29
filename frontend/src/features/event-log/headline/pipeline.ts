import { getCatalogEntry } from '../catalog/events';
import type { EventLogRecord } from '../types';
import { appendTrailingActor } from './actors';
import type { BuiltEventLogHeadline, EventLogHeadlineContext } from './context';
import { DEFAULT_HEADLINE_CONTEXT } from './context';

export type { BuiltEventLogHeadline, EventLogHeadlineContext } from './context';
export { DEFAULT_HEADLINE_CONTEXT } from './context';

export function buildEventLogHeadline(
  record: EventLogRecord,
  context: EventLogHeadlineContext = DEFAULT_HEADLINE_CONTEXT
): BuiltEventLogHeadline {
  const catalog = getCatalogEntry(record.eventType);
  let parts = catalog.buildHeadline(record, context);
  parts = appendTrailingActor(parts, record, catalog);

  const filtered = parts.filter(part => part.text.length > 0);
  return {
    parts: filtered,
    omitActorPrefix: !catalog.leadingActor,
  };
}
