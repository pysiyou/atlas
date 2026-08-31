/**
 * Table column builders — reusable column factories for *TableConfig files.
 * Re-exports table types and constants for consumers that previously imported from Table.tsx.
 */

export {
  createColumn,
  createIdColumn,
  createBadgeColumn,
  pickColumns,
  DEFAULT_LOADING_ROWS,
  SHOW_ALL_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL,
} from '@/utils/table';

export type {
  TableProps,
  TableViewConfig,
  CardComponentProps,
  ColumnConfig,
  ColumnSizePreset,
  CreateColumnOptions,
  SortConfig,
  TableVariant,
  Breakpoint,
} from '@/utils/table';
