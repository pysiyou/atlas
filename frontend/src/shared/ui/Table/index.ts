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
  ResponsiveVisibility,
  SortConfig,
  PaginationConfig,
  TableProps,
  TableVariant,
  Breakpoint,
  TableViewConfig,
  CardComponentProps,
} from './types';

// Constants (for use in column definitions)
export { SIZE_PRESETS } from './constants';

// Hooks (for advanced use cases)
export { useColumnStyles, getColumnStyle } from './hooks/useColumnWidth';
export { useTableSort } from './hooks/useTableSort';
export { useTablePagination } from './hooks/useTablePagination';
