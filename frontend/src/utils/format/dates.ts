/**
 * Date Formatting & Date Range Utilities
 * Consolidated date formatters and preset-range helpers.
 */

import {
  format,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  isSameDay,
} from 'date-fns';

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

/**
 * Format a date string or Date object to a human-readable format.
 * @param date - ISO date string or Date object
 * @param formatStr - date-fns format string (default: 'MMM d, yyyy')
 */
export function formatDate(
  date: string | Date | undefined | null,
  formatStr = 'MMM d, yyyy'
): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '';
    return format(d, formatStr);
  } catch {
    return '';
  }
}

/**
 * Format a date to a readable string with long or short format.
 * @param date - ISO date string or Date object
 * @param formatType - 'long' or 'short' (default: 'long')
 */
export function formatOrderDate(
  date: string | Date | undefined | null,
  formatType: 'long' | 'short' = 'long'
): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: formatType === 'long' ? 'long' : 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Format a date for detail views (consistent format across detail pages).
 */
export function formatDetailDate(date: string | Date | undefined | null): string {
  return formatDate(date, 'MMM d, yyyy');
}

/**
 * Date-only label for grouping: "Today" | "Yesterday" | "12 Jan 2022"
 */
export function formatRelativeDateLabel(date: string | Date | undefined | null): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (dateOnly.getTime() === today.getTime()) return 'Today';
    if (dateOnly.getTime() === yesterday.getTime()) return 'Yesterday';
    return format(d, 'd MMM yyyy');
  } catch {
    return '';
  }
}

/**
 * Format date with "Today", "Yesterday", or "12 Jan" / "12 Jan 2022", plus time.
 * Same-year dates omit the year. e.g. "Today, 3:45 PM" | "12 Jan, 3:45 PM"
 */
export function formatRelativeDateTime(date: string | Date | undefined | null): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let dateLabel: string;
    if (dateOnly.getTime() === today.getTime()) dateLabel = 'Today';
    else if (dateOnly.getTime() === yesterday.getTime()) dateLabel = 'Yesterday';
    else
      dateLabel =
        d.getFullYear() === now.getFullYear() ? format(d, 'd MMM') : format(d, 'd MMM yyyy');
    return `${dateLabel}, ${format(d, 'h:mm a')}`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Date Range Presets
// ---------------------------------------------------------------------------

export const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7days', label: 'Last 7 Days' },
  { id: 'last30days', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number]['id'];

export function getDateRangeFromPreset(preset: DatePreset): [Date, Date] {
  const now = new Date();
  switch (preset) {
    case 'today':
      return [startOfDay(now), endOfDay(now)];
    case 'yesterday': {
      const yesterday = subDays(now, 1);
      return [startOfDay(yesterday), endOfDay(yesterday)];
    }
    case 'last7days':
      return [startOfDay(subDays(now, 6)), endOfDay(now)];
    case 'last30days':
      return [startOfDay(subDays(now, 29)), endOfDay(now)];
    case 'thisMonth':
      return [startOfMonth(now), endOfDay(now)];
    case 'lastMonth': {
      const lastMonth = subMonths(now, 1);
      return [startOfMonth(lastMonth), endOfDay(endOfMonth(lastMonth))];
    }
    default:
      return [startOfDay(now), endOfDay(now)];
  }
}

export function getActivePresetId(dateRange: [Date, Date] | null): DatePreset | null {
  if (!dateRange) return null;
  for (const preset of DATE_PRESETS) {
    const presetRange = getDateRangeFromPreset(preset.id);
    if (isSameDay(dateRange[0], presetRange[0]) && isSameDay(dateRange[1], presetRange[1])) {
      return preset.id;
    }
  }
  return null;
}
