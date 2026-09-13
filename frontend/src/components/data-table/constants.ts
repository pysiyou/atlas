/**
 * Data table layout constants and defaults.
 */

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
  compact: 'px-4 py-2',
  default: 'px-6 py-3',
  comfortable: 'px-6 py-4',
};

export const HEADER_PADDING: Record<TableVariant, string> = {
  compact: 'px-4 py-2',
  default: 'px-6 py-3',
  comfortable: 'px-6 py-4',
};

export const TEXT_SIZE: Record<TableVariant, string> = {
  compact: 'text-xs',
  default: 'text-sm',
  comfortable: 'text-sm',
};

export const DEFAULT_LOADING_ROWS = 5;
export const SHOW_ALL_PAGE_SIZE = -1;
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL = [
  ...DEFAULT_PAGE_SIZE_OPTIONS,
  SHOW_ALL_PAGE_SIZE,
];
