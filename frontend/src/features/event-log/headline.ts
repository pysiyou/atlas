/**
 * Natural-language event log sentences aligned with AuditEmitter metadata keys.
 */
import type { EventLogRecord } from './types';
import type { EventTypeRegistryEntry } from './registry';
import { buildHeadlinePartsForEvent } from './headlineEventBuilders';
import {
  appendEntityLineage,
  DEFAULT_HEADLINE_CONTEXT,
  type BuiltEventLogHeadline,
  type EventLogHeadlineContext,
} from './headlineHelpers';

export type { BuiltEventLogHeadline, EventLogHeadlineContext } from './headlineHelpers';

export function buildEventLogHeadline(
  record: EventLogRecord,
  registry: EventTypeRegistryEntry,
  context: EventLogHeadlineContext = DEFAULT_HEADLINE_CONTEXT
): BuiltEventLogHeadline {
  const type = record.eventType;
  let parts = buildHeadlinePartsForEvent(record, registry, context);
  parts = appendEntityLineage(parts, record);

  const filtered = parts.filter(part => part.text.length > 0);
  return {
    parts: filtered,
    omitActorPrefix: type === 'order.status',
  };
}
