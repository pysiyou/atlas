/**
 * Semantic column width tokens — maps roles to COLUMN_SIZE presets.
 */

import type { ColumnSizePreset } from './types';

/** Standard widths for recurring DataTable column roles. */
export const TABLE_COLUMN_WIDTH = {
  datetime: 'md',
  badge: 'sm',
  /** Badge columns with longer labels (e.g. user role). */
  badgeWide: 'md',
  action: 'md',
  /** Two icon actions in one cell (e.g. preview + print). */
  actionDual: 'lg',
} as const satisfies Record<string, ColumnSizePreset>;
