/**
 * Lab dashboard layout, surfaces, and attention feed styles.
 */
import { PANEL_SHELL, TABLE_TYPE, TYPE } from '@/components/theme/recipes';
import { CONTROL, RADIUS, SPACING } from '@/components/theme/recipes';
import { TONE } from '@/components/theme/recipes';
import type { LabLaneVisual } from '../constants/labConstants';

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
  body: 'flex min-h-0 flex-1 flex-col justify-center gap-space-2 overflow-y-auto px-space-3 py-space-2',
} as const;

export const TODAY_KPI = {
  headerRange: TYPE.caption,
  summaryMeta: TYPE.caption,
  summaryLine: `${TYPE.value} min-w-0 leading-snug`,
  summaryValue: 'tabular-nums text-text-primary',
  list: 'flex min-w-0 flex-col gap-space-2',
  row: `flex min-w-0 items-center gap-space-2 ${RADIUS.surface} border border-border-subtle/80 bg-surface px-space-2 py-space-1`,
  iconWrap: (visual: LabLaneVisual) =>
    `flex size-8 shrink-0 items-center justify-center ${RADIUS.inset} ${visual.iconWell}`,
  icon: 'size-4',
  labelBlock: 'flex min-w-0 flex-1 flex-col gap-space-1 sm:flex-row sm:items-center sm:gap-space-2',
  rowTitle: `${TYPE.value} font-medium truncate`,
  tag: `type-caption shrink-0 ${RADIUS.pill} bg-surface-hover px-space-3 py-space-1 text-text-secondary`,
  meterWrap: 'w-[7.5rem] shrink-0 sm:w-[8.75rem]',
  meterTrack: `relative flex h-5 items-center justify-end overflow-hidden ${RADIUS.inset} bg-brand-muted px-space-1.5`,
  meterFill: `absolute inset-y-0 left-0 ${RADIUS.inset} bg-brand/30 transition-[width] duration-300 ease-out`,
  meterLabel: 'relative z-[1] type-caption font-medium tabular-nums text-text-primary',
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
