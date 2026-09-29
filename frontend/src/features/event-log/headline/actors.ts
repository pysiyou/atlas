import { EVENT_LOG_COPY } from '../copy';
import type { EventLogHeadlinePart, EventLogRecord } from '../types';
import type { EventCatalogEntry } from '../catalog/types';
import { append, appendText, mainPart } from './parts';

export function actorDisplayName(record: EventLogRecord): string {
  const snap = record.actorSnapshot;
  if (snap.userId === 'system' || snap.role === 'system') {
    return EVENT_LOG_COPY.systemActorName;
  }
  const name = snap.name.trim();
  return name || 'Unknown';
}

export function isSystemActorRecord(
  record: EventLogRecord,
  catalog?: EventCatalogEntry
): boolean {
  if (catalog?.treatAsSystemActor) return true;
  const snap = record.actorSnapshot;
  return snap.userId === 'system' || snap.role === 'system';
}

export function appendTrailingActor(
  parts: EventLogHeadlinePart[],
  record: EventLogRecord,
  catalog: EventCatalogEntry
): EventLogHeadlinePart[] {
  if (isSystemActorRecord(record, catalog)) return parts;
  if (catalog.trailingActor === 'never') return parts;
  return append(appendText(parts, ' by '), mainPart(actorDisplayName(record)));
}
