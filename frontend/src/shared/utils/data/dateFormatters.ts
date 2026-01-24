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
