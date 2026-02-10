// Main component
export { Table } from './Table';

// Components
export { CardGrid } from './CardGrid';
export { TableCore } from './TableCore';

// Types
export type {
  ColumnConfig,
  ColumnWidth,
  ColumnSizePreset,
  ColumnAlign,
  StickyPosition,
  SortConfig,
  PaginationConfig,
  TableProps,
  TableVariant,
  Breakpoint,
  TableViewConfig,
  CardComponentProps,
} from './types';

// Column helpers (for building table configs with less duplication)
export { createColumn, pickColumns } from './columnHelpers';
export type { CreateColumnOptions } from './columnHelpers';

// Constants (for use in column definitions and pagination)
export {
  SIZE_PRESETS,
  SHOW_ALL_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL,
} from './constants';

// Hooks (for advanced use cases)
export { useColumnStyles, getColumnStyle } from './hooks/useColumnWidth';
export { useTableSort } from './hooks/useTableSort';
export { useTablePagination } from './hooks/useTablePagination';
