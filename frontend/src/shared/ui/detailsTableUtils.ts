/**
 * DetailsTable utilities
 * Shared helpers for filtering detail rows and computing layout.
 * Kept in a separate file so DetailsTable.tsx only exports components (react-refresh).
 */

import React from 'react';

/**
 * Row type for table data
 */
export interface DetailRow {
  /** Label displayed on the left */
  label: string;
  /** Value displayed on the right - can be string or React node */
  value: React.ReactNode;
}

/**
 * Placeholder values to filter out
 */
const PLACEHOLDER_VALUES = new Set([
  'n/a',
  '-',
  '—',
  'none',
  'null',
  'undefined',
  '',
]);

/**
 * Check if a value should be displayed
 * @param value - The value to check
 * @returns true if value should be displayed
 */
const hasValue = (value: React.ReactNode): boolean => {
  if (React.isValidElement(value)) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return !PLACEHOLDER_VALUES.has(trimmed.toLowerCase());
  }
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return value != null;
};

/**
 * Filter rows to only include those with valid values
 * @param rows - Rows to filter
 * @returns Filtered rows
 */
export const filterDetailRows = (rows: DetailRow[] | undefined | null): DetailRow[] =>
  Array.isArray(rows) ? rows.filter((r) => hasValue(r.value)) : [];

/**
 * Calculate effective height of a table (number of visible rows)
 * @param rows - Rows to calculate height for
 * @returns Number of visible rows (minimum 1)
 */
export const calculateEffectiveHeight = (rows: DetailRow[]): number => {
  return Math.max(filterDetailRows(rows).length, 1);
};
