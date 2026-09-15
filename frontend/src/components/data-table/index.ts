/**
 * data-table/index.ts — Generic table component and column utilities.
 */

export { Table } from './Table';
export { DataTable } from './DataTable';
export { CardGridView } from './CardGridView';
export {
  renderPatientId,
  renderOrderId,
  renderPatientNameBlock,
  renderPatientNameWithAge,
  renderPatientNameWithId,
  renderOrderPatientName,
  renderOrderTestsBlock,
  renderOrderTotalPrice,
  renderOrderTotalPriceInline,
  renderContactBlock,
  renderDateCell,
  renderDateTimeCell,
  renderOrderDateCell,
  renderNavigableOrderId,
} from './columnRenders';
export { createOrderSharedColumns } from './columnDefinitions/orders';
export type {
  OrderColumnAccessors,
  OrderColumnRenderers,
  OrderSharedColumnOptions,
  OrderSharedColumnKey,
} from './columnDefinitions/orders';
export {
  createColumn,
  createIdColumn,
  createBadgeColumn,
  pickColumns,
  buildViews,
  resolvePaginationConfig,
  isPaginationEnabled,
} from './columnHelpers';
export {
  DEFAULT_LOADING_ROWS,
  SHOW_ALL_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL,
  SIZE_PRESETS,
  ROW_HEIGHTS,
  CELL_PADDING,
  HEADER_PADDING,
  TEXT_SIZE,
} from './constants';
export type {
  TableProps,
  TableViewConfig,
  CardComponentProps,
  ColumnConfig,
  ColumnWidth,
  ColumnSizePreset,
  ColumnViewPreset,
  ColumnAlign,
  CreateColumnOptions,
  SortConfig,
  PaginationConfig,
  TableVariant,
  Breakpoint,
  ListViewPaginationConfig,
  DataTableMode,
  TableHeaderProps,
  TableBodyProps,
  TableCellProps,
  TableSkeletonProps,
  StickyPosition,
} from './types';
