/**
 * Data table layout constants and defaults.
 */

import { TABLE_CELL, TABLE_TYPE } from '@/components/theme/recipes';
import type { ColumnWidth, TableVariant } from './types';

export const SIZE_PRESETS: Record<string, ColumnWidth> = {
  xs: { base: 60, min: 50, grow: 0, shrink: 0 },
  sm: { base: 100, min: 80, grow: 0, shrink: 0 },
  id: { base: 118, min: 96, grow: 0, shrink: 0 },
  md: { base: 120, min: 100, grow: 0, shrink: 0 },
  lg: { base: 160, min: 140, grow: 0, shrink: 0 },
  xl: { base: 200, min: 160, grow: 2, shrink: 1 },
  auto: { grow: 0, shrink: 0 },
  fill: { base: 0, min: 200, grow: 1, shrink: 1 },
};

export const ROW_HEIGHTS: Record<TableVariant, number> = {
  compact: 40,
  default: 48,
  comfortable: 56,
};

export const CELL_PADDING: Record<TableVariant, string> = {
  compact: TABLE_CELL.compact,
  default: TABLE_CELL.default,
  comfortable: TABLE_CELL.comfortable,
};

export const HEADER_PADDING: Record<TableVariant, string> = {
  compact: TABLE_CELL.compact,
  default: TABLE_CELL.default,
  comfortable: TABLE_CELL.comfortable,
};

/** @deprecated Prefer TABLE_TYPE.size — kept for existing imports. */
export const TABLE_TEXT_SIZE = TABLE_TYPE.size;

/** @deprecated Prefer TABLE_TYPE.size — header/body scale per variant (same for all densities). */
export const TEXT_SIZE: Record<TableVariant, string> = {
  compact: TABLE_TYPE.size,
  default: TABLE_TYPE.size,
  comfortable: TABLE_TYPE.size,
};

export const DEFAULT_LOADING_ROWS = 5;
export const SHOW_ALL_PAGE_SIZE = -1;
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL = [
  ...DEFAULT_PAGE_SIZE_OPTIONS,
  SHOW_ALL_PAGE_SIZE,
];
