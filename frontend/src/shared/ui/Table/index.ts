// Main component
export { Table } from './Table';

// Types
export type {
  ColumnConfig,
  ColumnWidth,
  ColumnSizePreset,
  ColumnAlign,
  StickyPosition,
  ResponsiveVisibility,
  SortConfig,
  PaginationConfig,
  TableProps,
  TableVariant,
  Breakpoint,
} from './types';

// Constants (for use in column definitions)
export { VISIBILITY_PRESETS, SIZE_PRESETS } from './constants';

// Hooks (for advanced use cases)
export { useColumnVisibility, useCardViewColumns } from './hooks/useColumnVisibility';
export { useColumnStyles, getColumnStyle } from './hooks/useColumnWidth';
export { useTableSort } from './hooks/useTableSort';
export { useTablePagination } from './hooks/useTablePagination';
