/** Split workspace layouts (monitor board, command center). */

import { PANEL_SHELL } from './panel';
import { SPACING } from './spacing';
import { CONTROL } from './control';

export const SPLIT_WORKSPACE_PANEL = {
  ...PANEL_SHELL.page,
  page: 'flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-page',
} as const;

export const SPLIT_WORKSPACE_PAGE =
  `flex flex-1 h-full min-h-0 min-w-0 flex-col overflow-y-auto lg:overflow-hidden ${SPACING.gapSection}` as const;

export const SPLIT_BOTTOM_ROW =
  `grid min-h-split-bottom-row shrink-0 grid-cols-1 ${SPACING.gapSection} lg:h-split-bottom-row lg:grid-cols-3 lg:items-stretch` as const;

export const SPLIT_BOTTOM_PANEL =
  'min-h-split-bottom-row overflow-hidden lg:min-h-0 lg:h-full' as const;

export const SPLIT_TABLE_WRAP =
  'flex min-h-split-table-wrap flex-1 flex-col lg:min-h-0' as const;

export const SPLIT_ROW_INTERACTIVE = `cursor-pointer ${CONTROL.focusVisibleFlat}` as const;

export const KPI_PANEL = {
  body: 'flex min-h-0 flex-1 flex-col px-space-3 py-space-3',
  main: 'flex min-h-0 flex-1 flex-col justify-center gap-space-3 overflow-y-auto',
  stack: 'flex min-w-0 flex-col gap-space-3',
  footer: 'mt-auto shrink-0 pt-space-3',
} as const;
