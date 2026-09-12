/**
 * Shared detail-chip builders for lab timeline formatters.
 */
import { displayId } from '@/utils';
import type { TimelineEvent } from '../api/commandCenter.api';

export type EventDetail =
  | { type: 'text'; value: string }
  | { type: 'id'; value: string }
  | {
      type: 'entityRef';
      entityType: 'sample' | 'order_test';
      entityId: number;
      value: string;
    }
  | { type: 'note'; value: string }
  | { type: 'testCode'; value: string }
  | { type: 'status'; value: string }
  | { type: 'sampleType'; value: string };

export interface FormattedTimelineEvent {
  action: string;
  details: EventDetail[];
  note?: string;
}

export function metaString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
}

export function formatTestCodes(meta: Record<string, unknown>): string {
  const codes = meta.testCodes;
  if (Array.isArray(codes) && codes.length > 0) {
    return codes.map(code => String(code)).join('/');
  }
  if (meta.testCode) return String(meta.testCode);
  return 'Test';
}

export function sampleRef(sampleId: unknown): EventDetail | null {
  const id = Number(sampleId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    type: 'entityRef',
    entityType: 'sample',
    entityId: id,
    value: displayId.sample(id),
  };
}

export function testRef(testId: unknown): EventDetail | null {
  const id = Number(testId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    type: 'entityRef',
    entityType: 'order_test',
    entityId: id,
    value: displayId.orderTest(id),
  };
}

export function testIdFromEvent(event: TimelineEvent): number | undefined {
  if (event.entityType === 'test' || event.entityType === 'order_test') {
    return event.entityId;
  }
  const fromMeta = Number(event.metadata.orderTestId ?? event.metadata.escalatedTestId);
  return Number.isFinite(fromMeta) && fromMeta > 0 ? fromMeta : undefined;
}

export function testTransitionDetails(
  meta: Record<string, unknown>,
  event?: TimelineEvent,
): EventDetail[] {
  const details: EventDetail[] = [];
  const sourceId =
    meta.escalatedTestId ?? meta.orderTestId ?? (event ? testIdFromEvent(event) : undefined);
  const source = testRef(sourceId);
  const target = testRef(meta.newTestId);

  if (source) details.push(source);
  if (target) {
    if (source) details.push({ type: 'text', value: '→' });
    details.push(target);
  }
  return details;
}

export function appendNote(
  event: TimelineEvent,
  formatted: FormattedTimelineEvent,
): FormattedTimelineEvent {
  const note = metaString(event.comment);
  if (!note) return formatted;
  const detailText = formatted.details
    .filter(d => d.type === 'text' || d.type === 'note')
    .map(d => d.value)
    .join(' ');
  if (detailText.includes(note)) return formatted;
  return { ...formatted, note };
}
