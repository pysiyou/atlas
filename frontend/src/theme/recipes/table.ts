/** Data table typography, shell, and cell padding. */

import { text } from './cva/text';
import { SPACING } from './spacing';

const tableBody = text({ role: 'body', density: 'table' });
const tableBodyMuted = text({ role: 'body', intent: 'muted', density: 'table' });
const tableBodySecondary = text({ role: 'label', density: 'table' });
const tableSectionTitle = text({ role: 'section-title', intent: 'muted' });
const tableCaption = text({ role: 'caption', density: 'compact' });

export const TABLE_TYPE = {
  size: 'type-ui-sm',
  columnTitle: tableSectionTitle,
  columnTitleActive: 'text-text-primary bg-surface-selected',
  columnTitleSortable: 'cursor-pointer hover:bg-surface-hover select-none',
  cell: `${tableBody} tabular-nums`,
  secondary: tableBodySecondary,
  meta: tableBodyMuted,
  amount: `${tableBody} tabular-nums`,
  datetime: `${tableBody} tabular-nums`,
  datetimeSecondary: `${tableCaption} tabular-nums`,
  label: tableBodySecondary,
  caption: tableBodyMuted,
  link: text({ role: 'link', density: 'table' }),
} as const;

export const TABLE_SHELL = {
  headerRow:
    'grid w-full min-w-full items-stretch border-b border-border-default bg-surface-table-header',
  headerRowSticky: 'sticky top-0 z-10',
  headerCell: 'flex min-w-0 items-center justify-start gap-space-2 whitespace-nowrap text-left',
  bodyCell: 'min-w-0 overflow-hidden flex items-start justify-start text-left',
  row: 'grid w-full min-w-full items-center border-b border-border-default transition-colors duration-200',
  rowClickable: 'cursor-pointer hover:bg-surface-hover',
  rowStripedEven: 'bg-surface',
  rowStripedOdd: 'bg-surface-hover/50',
} as const;

export const INLINE_LINK = `${TABLE_TYPE.link} hover:opacity-90`;

/** Reset `<button>` chrome for inline text links (e.g. “View”). */
export const INLINE_LINK_BUTTON = `${INLINE_LINK} inline-flex shrink-0 cursor-pointer border-0 bg-transparent p-0 m-0 font-normal`;

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
