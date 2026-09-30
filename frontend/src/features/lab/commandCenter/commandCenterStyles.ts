/**
 * Lab dashboard layout, surfaces, and attention feed styles.
 */
import { PANEL_SHELL, TABLE_TYPE, TYPE } from '@/components/theme/recipes';
import { CONTROL, RADIUS, SPACING } from '@/components/theme/recipes';
import { TONE } from '@/components/theme/recipes';

export const COMMAND_CENTER_PANEL = {
  ...PANEL_SHELL.page,
  page: 'flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-page',
} as const;

export const DASHBOARD_PAGE =
  `flex flex-1 h-full min-h-0 min-w-0 flex-col overflow-y-auto lg:overflow-hidden ${SPACING.gapSection}` as const;

export const DASHBOARD_BOTTOM_ROW =
  `grid min-h-72 shrink-0 grid-cols-1 ${SPACING.gapSection} lg:h-72 lg:grid-cols-3 lg:items-stretch` as const;

export const DASHBOARD_BOTTOM_PANEL = 'min-h-72 overflow-hidden lg:min-h-0 lg:h-full' as const;

export const DASHBOARD_TABLE_WRAP = 'flex min-h-80 flex-1 flex-col lg:min-h-0' as const;

export const DASHBOARD_ROW_INTERACTIVE = `cursor-pointer ${CONTROL.focusVisibleFlat}` as const;

export const TODAY_PANEL = {
  body: 'flex min-h-0 flex-1 flex-col px-space-3 py-space-3',
  main: 'flex min-h-0 flex-1 flex-col justify-center gap-space-3 overflow-y-auto',
  stack: 'flex min-w-0 flex-col gap-space-3',
  chartBlock: 'flex min-w-0 flex-col gap-0',
  footer: 'mt-auto shrink-0 pt-space-3',
} as const;

export const TODAY_KPI = {
  headerRange: TYPE.caption,
  legendRow: 'flex min-w-0 flex-wrap items-center justify-between gap-x-space-3 gap-y-space-1.5',
  legendItem: 'inline-flex min-w-0 items-center gap-space-1.5',
  legendLabel: `${TYPE.sectionTitle} capitalize text-text-primary`,
  legendValue: `${TYPE.value} tabular-nums`,
  segmentBar: `flex h-2.5 w-full min-w-0 gap-0.5 ${RADIUS.inline}`,
  segment: `min-w-[2px] shrink-0 ${RADIUS.inline} transition-[flex-grow] duration-300 ease-out`,
  segmentBarEmpty: `h-2.5 w-full bg-border-subtle ${RADIUS.inline}`,
  table: `w-full min-w-0 overflow-hidden border border-border-subtle ${RADIUS.surface}`,
  tableBody: 'divide-y divide-border-subtle/80',
  tableRow:
    'grid grid-cols-[minmax(0,1fr)_minmax(3.5rem,5.5rem)_auto] items-center gap-x-space-3 px-space-3 py-space-2',
  tableLabel: `${TABLE_TYPE.cell} min-w-0 truncate text-text-secondary`,
  tableRowMeterTrack: `h-1 w-full min-w-0 overflow-hidden bg-border-subtle ${RADIUS.inline}`,
  tableRowMeterFill: `h-full ${RADIUS.inline} transition-[width] duration-300 ease-out`,
  tableValue: `${TABLE_TYPE.cell} text-right tabular-nums text-text-primary`,
  tablePercent: 'text-text-primary',
  tableCount: 'text-text-tertiary',
  tableTotal: 'grid grid-cols-[1fr_auto] items-baseline gap-x-space-4',
  tableTotalLabel: `${TABLE_TYPE.cell} font-medium text-text-primary`,
  tableTotalValue: `${TABLE_TYPE.cell} text-right font-medium tabular-nums text-text-primary`,
} as const;

export const COMMAND_CENTER_ATTENTION_ACCENT = {
  problem: TONE.danger.fill,
  neutral: TONE.warning.fill,
} as const;

export const COMMAND_CENTER_FEED_STYLES = {
  groupHeader: 'sticky top-0 z-[1] flex items-center gap-space-2 bg-transparent py-space-2',
  groupDivider: 'flex-1 h-px bg-border-subtle',
  groupLabel: `${TYPE.sectionTitle} tracking-widest`,
  eventHeadline: `min-w-0 ${TABLE_TYPE.cell} font-normal text-text-primary`,
} as const;
