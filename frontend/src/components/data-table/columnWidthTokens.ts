/**
 * Semantic column width tokens — maps roles to COLUMN_SIZE presets.
 */

import type { ColumnSizePreset } from './types';

/** Standard widths for recurring DataTable column roles. */
export const TABLE_COLUMN_WIDTH = {
  /** Entity / catalog codes (PAT, ORD, test code). */
  id: 'sm',
  code: 'sm',
  /** Currency / numeric amount columns. */
  amount: 'sm',
  datetime: 'md',
  badge: 'sm',
  /** Badge columns with longer labels (e.g. user role). */
  badgeWide: 'md',
  action: 'md',
  /** Two icon actions in one cell (e.g. preview + print). */
  actionDual: 'lg',
  /** Narrow numeric / fraction columns (e.g. validated count). */
  compact: 'xs',
  /** Login / account identifier columns. */
  username: 'md',
  /** Email and similar contact strings. */
  email: 'lg',
  /** Patient or person name columns (not full-width). */
  patientName: 'xl',
  /** Primary two-line identity (test name + code). */
  primary: '2xl',
  /** Secondary two-line or summary columns (doctor, orders summary). */
  supporting: 'lg',
  /** Category / department badge columns with longer labels. */
  category: 'lg',
  /** Grows to fill remaining grid space. */
  flex: 'fill',
} as const satisfies Record<string, ColumnSizePreset>;
