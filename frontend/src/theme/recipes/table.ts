/** Data table typography, shell, and cell padding. */

import { SPACING } from './spacing';

const TABLE_TEXT_SCALE = 'type-table-cell';

export const TABLE_TYPE = {
  /** Type scale step for body cells — matches `--type-table-cell-size`. */
  size: TABLE_TEXT_SCALE,
  /** Column header label (DataTable `TableHeader` — apply on each column cell / label). */
  columnTitle: 'type-table-header text-text-tertiary',
  columnTitleActive: 'text-text-primary bg-surface-selected',
  columnTitleSortable: 'cursor-pointer hover:bg-surface-hover select-none',
  cell: `${TABLE_TEXT_SCALE} text-text-primary`,
  secondary: `${TABLE_TEXT_SCALE} text-text-secondary`,
  meta: `${TABLE_TEXT_SCALE} text-text-tertiary`,
  amount: `${TABLE_TEXT_SCALE} text-text-primary`,
  /** Timestamps and calendar dates in DataTable cells (primary column content). */
  datetime: `${TABLE_TEXT_SCALE} text-text-primary tabular-nums`,
  /** Same formats as datetime, smaller type and tertiary color when the date is supporting text. */
  datetimeSecondary: `type-caption text-text-tertiary tabular-nums`,
  label: `${TABLE_TEXT_SCALE} text-text-secondary`,
  caption: `${TABLE_TEXT_SCALE} text-text-tertiary`,
  link: `${TABLE_TEXT_SCALE} text-brand underline cursor-pointer`,
} as const;

export const TABLE_SHELL = {
  headerRow:
    'grid w-full min-w-full items-stretch border-b border-border-default bg-surface-table-header',
  headerRowSticky: 'sticky top-0 z-10',
  headerCell: 'flex min-w-0 items-center justify-start gap-space-2 whitespace-nowrap text-left',
  bodyCell: 'min-w-0 overflow-hidden flex items-center justify-start text-left',
  row: 'grid w-full min-w-full items-center border-b border-border-default transition-colors duration-200',
  rowClickable: 'cursor-pointer hover:bg-surface-hover',
  rowStripedEven: 'bg-surface',
  rowStripedOdd: 'bg-surface-hover/50',
} as const;

export const INLINE_LINK = `${TABLE_TYPE.link} hover:underline`

export const PAGINATION_TYPE = {
  pageButtonBase: `${TABLE_TYPE.size} font-normal`,
  ellipsis: `${TABLE_TYPE.meta}`,
  selectCompact: `${TABLE_TYPE.size} leading-5`,
} as const;

export const TABLE_CELL = {
  compact: `${SPACING.pxTableCellCompact} ${SPACING.pyTableCellCompact}`,
  default: `${SPACING.pxTableCellDefault} ${SPACING.pyTableCellDefault}`,
  comfortable: `${SPACING.pxTableCellComfortable} ${SPACING.pyTableCellComfortable}`,
} as const;
