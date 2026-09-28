/**
 * Maps audit rows to fully resolved feed items.
 */
import { formatRelativeDateTime } from '@/utils/date';
import { displayId, withHashPrefix } from '@/utils/id';
import { EVENT_LOG_COPY } from './copy';
import { buildEventLogHeadline } from './headline';
import { getRegistryEntry, HEADLINE_META_KEYS } from './registry';
import type { EventLogHeadlinePart, EventLogRecord, ResolvedEventLogItem } from './types';

function isSystemActor(record: EventLogRecord): boolean {
  const snap = record.actorSnapshot;
  return snap.userId === 'system' || snap.role === 'system';
}

function formatTargetLabel(record: EventLogRecord): string {
  const meta = record.metadata ?? {};
  const testCode = typeof meta.test_code === 'string' ? meta.test_code : undefined;

  switch (record.targetType) {
    case 'patient':
      return displayId.patient(record.targetId);
    case 'order':
      return displayId.order(record.targetId);
    case 'sample':
      return displayId.sample(record.targetId);
    case 'order_test':
      return testCode
        ? `${withHashPrefix(testCode)} (${displayId.orderTest(record.targetId)})`
        : displayId.orderTest(record.targetId);
    case 'payment':
      return displayId.payment(record.targetId);
    case 'invoice':
      return displayId.invoice(record.targetId);
    case 'insurance_claim':
      return `Claim ${withHashPrefix(String(record.targetId))}`;
    case 'user':
      return displayId.user(record.targetId);
    case 'test_catalog':
      return typeof meta.test_code === 'string'
        ? withHashPrefix(meta.test_code)
        : withHashPrefix(String(record.targetId));
    default:
      return withHashPrefix(`${record.targetType}-${record.targetId}`);
  }
}

function headlineIncludesNote(parts: EventLogHeadlinePart[], note: string): boolean {
  const haystack = parts.map(part => part.text).join('');
  const trimmed = note.trim();
  if (!trimmed) return false;
  if (haystack.includes(trimmed)) return true;
  return haystack.includes(trimmed.replace(/_/g, ' '));
}

function pickNoteForCard(
  record: EventLogRecord,
  headlineParts: EventLogHeadlinePart[],
): { label: string; text: string } | null {
  const meta = record.metadata ?? {};
  const headlineKeys = new Set(HEADLINE_META_KEYS[record.eventType] ?? []);

  const cardFirst: Array<{ label: string; value: unknown }> = [
    { label: EVENT_LOG_COPY.narrativeDefaultLabel, value: meta.notes },
    { label: EVENT_LOG_COPY.narrativeDefaultLabel, value: meta.rejection_notes },
    { label: EVENT_LOG_COPY.commentLabel, value: meta.comment },
  ];

  for (const { label, value } of cardFirst) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const text = value.trim();
    if (headlineIncludesNote(headlineParts, text)) continue;
    return { label, text };
  }

  const reasonFields: Array<{ key: string; value: unknown }> = [
    { key: 'rejection_reason', value: meta.rejection_reason },
    { key: 'reason', value: meta.reason },
  ];

  for (const { key, value } of reasonFields) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const text = value.trim();
    if (headlineKeys.has(key) || headlineIncludesNote(headlineParts, text)) continue;
    return { label: EVENT_LOG_COPY.narrativeDefaultLabel, text };
  }

  return null;
}

function readPlainRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length > 0 ? record : null;
}

function pickResultsForCard(record: EventLogRecord): Record<string, unknown> | null {
  const meta = record.metadata ?? {};
  const fromMeta =
    readPlainRecord(meta.results) ?? readPlainRecord(meta.proposedResults);
  if (fromMeta) return fromMeta;

  const fromChanges = readPlainRecord(record.changes?.newValues?.results);
  if (fromChanges) return fromChanges;

  return null;
}

function pickResultFlags(record: EventLogRecord): string[] | undefined {
  const flags = record.metadata?.flags;
  if (!Array.isArray(flags) || flags.length === 0) return undefined;
  if (!flags.every(entry => typeof entry === 'string')) return undefined;
  return flags;
}

export interface ResolveEventLogOptions {
  showEventTypeInMeta?: boolean;
}

export function resolveEventLogItem(
  record: EventLogRecord,
  options?: ResolveEventLogOptions,
): ResolvedEventLogItem {
  const registry = getRegistryEntry(record.eventType);
  const system = isSystemActor(record);
  const built = buildEventLogHeadline(record, registry);
  const note = pickNoteForCard(record, built.parts);
  const results = pickResultsForCard(record);
  const resultFlags = results ? pickResultFlags(record) : undefined;

  const actorName = system ? EVENT_LOG_COPY.systemActorName : record.actorSnapshot.name;
  const targetLabel = formatTargetLabel(record);

  return {
    record,
    domain: registry.domain,
    laboratorySubdomain: registry.laboratorySubdomain,
    domainLabel: registry.domainLabel,
    headline: {
      actorName,
      verbPhrase: registry.verbPhrase,
      targetLabel,
    },
    headlineParts: built.parts,
    metaTime: formatRelativeDateTime(record.createdAt),
    showEventTypeInMeta: options?.showEventTypeInMeta,
    narrativeLabel: note?.label,
    narrativeText: note?.text,
    results: results ?? undefined,
    resultFlags,
    isSystemActor: system,
    omitActorInHeadline: built.omitActorPrefix,
  };
}

export function resolveEventLogItems(
  records: EventLogRecord[],
  options?: ResolveEventLogOptions,
): ResolvedEventLogItem[] {
  return records.map(record => resolveEventLogItem(record, options));
}
