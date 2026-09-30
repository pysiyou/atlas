/**
 * Lab dashboard layout, surfaces, and attention feed styles.
 */
import { PANEL_SHELL, TABLE_TYPE, TYPE } from '@/components/theme/recipes';
import { CONTROL, RADIUS, SPACING } from '@/components/theme/recipes';
import { TONE } from '@/components/theme/recipes';

export const MONITOR_PANEL = {
  ...PANEL_SHELL.page,
  page: 'flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-page',
} as const;

export const MONITOR_PAGE =
  `flex flex-1 h-full min-h-0 min-w-0 flex-col overflow-y-auto lg:overflow-hidden ${SPACING.gapSection}` as const;

export const MONITOR_BOTTOM_ROW =
  `grid min-h-72 shrink-0 grid-cols-1 ${SPACING.gapSection} lg:h-72 lg:grid-cols-3 lg:items-stretch` as const;

export const MONITOR_BOTTOM_PANEL = 'min-h-72 overflow-hidden lg:min-h-0 lg:h-full' as const;

export const MONITOR_TABLE_WRAP = 'flex min-h-80 flex-1 flex-col lg:min-h-0' as const;

export const MONITOR_ROW_INTERACTIVE = `cursor-pointer ${CONTROL.focusVisibleFlat}` as const;

export const TODAY_PANEL = {
  body: 'flex min-h-0 flex-1 flex-col px-space-3 py-space-3',
  main: 'flex min-h-0 flex-1 flex-col justify-center gap-space-3 overflow-y-auto',
  stack: 'flex min-w-0 flex-col gap-space-3',
  footer: 'mt-auto shrink-0 pt-space-3',
} as const;

/** One radius for Today chart segments, table meters, dots, and table frame. */
const TODAY_METER_RADIUS = RADIUS.inline;

/** Milestone labels need a stable min width; activity column stays flexible. */
const TODAY_TABLE_GRID =
  'grid-cols-[minmax(8rem,1.25fr)_minmax(4.75rem,2.15fr)_auto]' as const;

export const TODAY_KPI = {
  headerEndWrap: 'flex min-w-0 flex-col items-end gap-space-0.5 text-right sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-space-2 sm:gap-y-space-0.5',
  headerRange: TYPE.caption,
  headerInsight: `${TYPE.caption} tabular-nums font-medium`,
  headerInsightMuted: `${TYPE.caption} tabular-nums text-text-tertiary`,
  table: `w-full min-w-0 overflow-hidden border border-border-subtle ${TODAY_METER_RADIUS}`,
  tableHeadRow:
    `grid ${TODAY_TABLE_GRID} items-center gap-x-space-3 border-b border-border-subtle/80 bg-surface-hover/40 px-space-3 py-space-2`,
  tableHeadCell: `${TABLE_TYPE.columnTitle} font-medium text-text-secondary`,
  tableHeadCellRight: `${TABLE_TYPE.columnTitle} text-right font-medium text-text-secondary`,
  tableBody: 'divide-y divide-border-subtle/80',
  tableRow:
    `grid ${TODAY_TABLE_GRID} items-center gap-x-space-3 px-space-3 py-space-2`,
  rowLabelWrap: 'flex min-w-0 gap-space-2',
  pipelineRailCell:
    'relative flex w-2 shrink-0 items-center justify-center self-stretch',
  pipelineRailLine:
    'pointer-events-none absolute left-1/2 top-[calc(50%+0.25rem)] bottom-0 w-px -translate-x-1/2 bg-border-subtle/90',
  stageChip: `relative z-[1] size-2 shrink-0 ${RADIUS.inline}`,
  tableLabel: `${TABLE_TYPE.cell} min-w-0 flex-1 truncate self-center text-text-secondary`,
  tableRowMeterTrack: `relative h-1 w-full min-w-0 overflow-hidden bg-border-subtle ${TODAY_METER_RADIUS}`,
  stairGhostTrack: `pointer-events-none absolute inset-0 bg-border-default/10 ${TODAY_METER_RADIUS}`,
  tableRowMeterFill: `absolute top-0 z-[1] h-full ${TODAY_METER_RADIUS} transition-[left,width] duration-300 ease-out`,
  tableRowMeterDot: `absolute top-1/2 z-[1] size-1 -translate-y-1/2 ${TODAY_METER_RADIUS}`,
  tableValue: `${TABLE_TYPE.cell} text-right tabular-nums text-text-primary`,
  tablePercent: 'text-text-primary',
  tableCount: 'text-text-tertiary',
  tableTotal: `grid ${TODAY_TABLE_GRID} items-center gap-x-space-3`,
  tableTotalLabel: `${TABLE_TYPE.cell} font-medium text-text-primary`,
  tableTotalValue: `${TABLE_TYPE.cell} text-right font-medium tabular-nums text-text-primary`,
  footerCaption: `${TYPE.caption} mt-space-1.5 text-text-tertiary`,
} as const;

export const MONITOR_ATTENTION_ACCENT = {
  problem: TONE.danger.fill,
  neutral: TONE.warning.fill,
} as const;

export const MONITOR_FEED_STYLES = {
  groupHeader: 'sticky top-0 z-[1] flex items-center gap-space-2 bg-transparent py-space-2',
  groupDivider: 'flex-1 h-px bg-border-subtle',
  groupLabel: `${TYPE.sectionTitle} tracking-widest`,
  eventHeadline: `min-w-0 ${TABLE_TYPE.cell} font-normal text-text-primary`,
} as const;
