/**
 * data-table/index.ts — Generic table component and column utilities.
 */

export { Table } from './Table';
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
