/**
 * Date Formatting & Date Range Utilities
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
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  eachYearOfInterval,
  addYears,
  subYears,
  isBefore,
  isAfter,
} from 'date-fns';

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

export function formatDetailDate(date: string | Date | undefined | null): string {
  return formatDate(date, 'MMM d, yyyy');
}

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
 * Relative time for recent events; absolute short format for older timestamps.
 * Used by order timeline and similar activity feeds.
 */
export function formatRelativeTime(
  dateString: string | undefined | null,
  options?: { absoluteFormat?: string }
): string {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(date)) return '';
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      }
      return `${Math.floor(diffInHours)}h ago`;
    }

    if (options?.absoluteFormat) {
      return format(date, options.absoluteFormat);
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/** PDF/report timestamp format. */
export function formatReportTime(dateString?: string | null, emptyLabel = 'N/A'): string {
  if (!dateString) return emptyLabel;
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return emptyLabel;
    return format(date, 'yyyy-MM-dd hh:mm a');
  } catch {
    return emptyLabel;
  }
}

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

/** Calendar grid helpers for date pickers */
export const generateCalendarDays = (currentMonth: Date): Date[] => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const generateCalendarMonths = (currentMonth: Date): Date[] => {
  const yearStart = startOfYear(currentMonth);
  const yearEnd = endOfYear(currentMonth);
  return eachMonthOfInterval({ start: yearStart, end: yearEnd });
};

export const generateCalendarYears = (currentMonth: Date): Date[] => {
  const start = subYears(currentMonth, 6);
  const end = addYears(currentMonth, 5);
  return eachYearOfInterval({ start, end });
};

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function isDateDisabledForPicker(date: Date, min: Date, max: Date): boolean {
  return isBefore(date, min) || isAfter(date, max);
}

export function isSelectedDateForPicker(
  date: Date,
  tempStart: Date | null,
  tempEnd: Date | null
): boolean {
  if (!tempStart) return false;
  if (tempEnd) return isSameDay(date, tempStart) || isSameDay(date, tempEnd);
  return isSameDay(date, tempStart);
}

export function isDateInRangeForPicker(
  date: Date,
  tempStart: Date | null,
  tempEnd: Date | null
): boolean {
  if (!tempStart || !tempEnd) return false;
  const dateStart = startOfDay(date);
  return (
    (isAfter(dateStart, tempStart) || isSameDay(dateStart, tempStart)) &&
    (isBefore(dateStart, tempEnd) || isSameDay(dateStart, tempEnd)) &&
    !isSameDay(dateStart, tempStart) &&
    !isSameDay(dateStart, tempEnd)
  );
}

