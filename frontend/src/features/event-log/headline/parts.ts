import { EVENT_LOG_COPY } from '../copy';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/types/enums/generated/order';
import type { EventLogHeadlinePart, EventLogRecord } from '../types';

function humanizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.replace(/-/g, ' ');
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function metaString(record: EventLogRecord, key: string): string | undefined {
  const value = record.metadata?.[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

export function mainPart(text: string): EventLogHeadlinePart {
  return { text, main: true };
}

export function append(
  parts: EventLogHeadlinePart[],
  ...next: EventLogHeadlinePart[]
): EventLogHeadlinePart[] {
  return parts.concat(next);
}

export function appendText(parts: EventLogHeadlinePart[], text: string): EventLogHeadlinePart[] {
  if (!text) return parts;
  return append(parts, { text });
}

function formatReasonLabel(raw: string): string {
  return raw.trim().replace(/_/g, ' ');
}

const REASON_LEAD_IN = '. ';

export function appendClause(parts: EventLogHeadlinePart[], clause: string): EventLogHeadlinePart[] {
  if (!clause.trim()) return parts;
  const label = formatReasonLabel(clause);
  return append(
    parts,
    { text: REASON_LEAD_IN },
    {
      text: `${EVENT_LOG_COPY.reasonInlinePrefix}${label}`,
      variant: 'info',
      icon: false,
      decoration: 'underline',
    }
  );
}

export function appendOutcomeClause(
  parts: EventLogHeadlinePart[],
  outcome: string
): EventLogHeadlinePart[] {
  if (!outcome.trim()) return parts;
  const label = formatReasonLabel(outcome);
  return append(
    parts,
    { text: REASON_LEAD_IN },
    {
      text: `${EVENT_LOG_COPY.outcomeInlinePrefix}${label}`,
      variant: 'info',
      icon: false,
      decoration: 'underline',
    }
  );
}

export function changeNew(record: EventLogRecord, field: string): string | undefined {
  const raw = record.changes?.newValues?.[field];
  if (raw === undefined || raw === null) return undefined;
  return humanizeValue(raw) || undefined;
}

export function formatOrderStatusLabel(raw: string | undefined): string {
  if (!raw) return 'updated';
  const normalized = raw as OrderStatus;
  if (normalized in ORDER_STATUS_CONFIG) {
    return ORDER_STATUS_CONFIG[normalized].label;
  }
  return humanizeValue(raw);
}
