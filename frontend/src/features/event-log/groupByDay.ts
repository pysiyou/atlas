/**
 * Groups resolved events by calendar day for date divider headers.
 */
import { format, isSameDay, startOfDay } from 'date-fns';
import { parseAppDate } from '@/utils/date';
import type { EventLogDayGroup, ResolvedEventLogItem } from './types';

function dayKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

function dayGroupLabel(date: Date, now: Date): string {
  const weekday = format(date, 'EEE d MMM yyyy');
  if (isSameDay(date, now)) return `Today · ${weekday}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return `Yesterday · ${weekday}`;
  return weekday;
}

export function groupEventLogByDay(items: ResolvedEventLogItem[]): EventLogDayGroup[] {
  const now = new Date();
  const map = new Map<string, EventLogDayGroup>();

  for (const item of items) {
    const parsed = parseAppDate(item.record.createdAt);
    if (!parsed) continue;
    const key = dayKey(parsed);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    map.set(key, {
      dayKey: key,
      label: dayGroupLabel(parsed, now),
      items: [item],
    });
  }

  return Array.from(map.values()).sort((a, b) => b.dayKey.localeCompare(a.dayKey));
}
