/**
 * Date Formatting Utilities
 * Consolidated date formatting functions from across the codebase
 */

import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date string or Date object to a human-readable format
 * @param date - ISO date string or Date object
 * @param formatStr - date-fns format string (default: 'MMM d, yyyy')
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(
  date: string | Date | undefined | null,
  formatStr = 'MMM d, yyyy'
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, formatStr);
  } catch {
    return '';
  }
}

/**
 * Format a date to a readable string with long or short format
 * @param date - ISO date string or Date object
 * @param formatType - 'long' or 'short' format (default: 'long')
 * @returns Formatted date string
 */
export function formatOrderDate(
  date: string | Date | undefined | null,
  formatType: 'long' | 'short' = 'long'
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';

    if (formatType === 'long') {
      return dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Format a date for detail views (consistent format across detail pages)
 * @param date - ISO date string or Date object
 * @returns Formatted date string
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
 * Format date with "Today", "Yesterday", or "12 Jan 2022", plus time.
 * e.g. "Today, 3:45 PM" | "Yesterday, 3:45 PM" | "12 Jan 2022, 3:45 PM"
 */
export function formatRelativeDateTime(date: string | Date | undefined | null): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '';
    const dateLabel = formatRelativeDateLabel(d);
    if (!dateLabel) return '';
    return `${dateLabel}, ${format(d, 'h:mm a')}`;
  } catch {
    return '';
  }
}
