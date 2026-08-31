/**
 * Table column builders — reusable column factories for *TableConfig files.
 */

export {
  createColumn,
  createIdColumn,
  createBadgeColumn,
  pickColumns,
} from '@/utils/table';

export type { ColumnConfig, ColumnSizePreset, CreateColumnOptions } from '@/utils/table';
