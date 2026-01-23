import type { ColumnWidth, TableVariant } from './types';

/**
 * Tailwind breakpoint values in pixels
 */
export const BREAKPOINT_VALUES = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Size presets for common column types
 */
export const SIZE_PRESETS: Record<string, ColumnWidth> = {
  /** Extra small - icons, checkboxes, actions (60px fixed) */
  xs: { base: 60, min: 50, grow: 0, shrink: 0 },
  /** Small - codes, dates, short values (100px fixed) */
  sm: { base: 100, min: 80, grow: 0, shrink: 0 },
  /** Medium - names, statuses, labels (150px fixed) */
  md: { base: 150, min: 120, grow: 0, shrink: 0 },
  /** Large - descriptions, longer text (200px fixed) */
  lg: { base: 200, min: 160, grow: 0, shrink: 0 },
  /** Extra large - long text, comments (300px, grows more) */
  xl: { base: 300, min: 200, grow: 2, shrink: 1 },
  /** Auto - content-sized, no flex */
  auto: { grow: 0, shrink: 0 },
  /** Fill - fills 100% of remaining table width */
  fill: { base: 0, min: 100, grow: 1, shrink: 1 },
};

/**
 * Row heights for different variants
 */
export const ROW_HEIGHTS: Record<TableVariant, number> = {
  compact: 44,
  default: 56,
  comfortable: 68,
};

/**
 * Padding classes for different variants
 */
export const CELL_PADDING: Record<TableVariant, string> = {
  compact: 'px-3 py-2',
  default: 'px-4 py-3',
  comfortable: 'px-6 py-4',
};

/**
 * Header padding classes for different variants
 */
export const HEADER_PADDING: Record<TableVariant, string> = {
  compact: 'px-3 py-2',
  default: 'px-4 py-3',
  comfortable: 'px-6 py-4',
};

/**
 * Text size classes for different variants
 */
export const TEXT_SIZE: Record<TableVariant, string> = {
  compact: 'text-xs',
  default: 'text-sm',
  comfortable: 'text-sm',
};

/**
 * Default number of skeleton rows to show while loading
 */
export const DEFAULT_LOADING_ROWS = 5;

/**
 * Default pagination options
 */
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
