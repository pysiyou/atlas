/**
 * Lab dashboard layout and table surface styles.
 */
import { CONTROL, RADIUS, SPACING, TYPE } from '@/components/theme/recipes';
import type { LabLaneVisual } from '../constants/labConstants';

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
  summaryLine: `${TYPE.value} min-w-0 leading-snug border-b border-border-subtle/60 pb-space-2`,
  summaryValue: 'tabular-nums text-text-primary',
  list: 'flex min-w-0 flex-col gap-space-2',
  row: `flex min-w-0 items-center gap-space-2 ${RADIUS.surface} border border-border-subtle/80 bg-surface px-space-2 py-space-1`,
  iconWrap: (visual: LabLaneVisual) =>
    `flex size-8 shrink-0 items-center justify-center ${RADIUS.inset} ${visual.iconWell}`,
  icon: 'size-4',
  labelBlock: 'flex min-w-0 flex-1 flex-col gap-space-1 sm:flex-row sm:items-center sm:gap-space-2',
  rowTitle: `${TYPE.value} font-medium truncate`,
  tag: `type-caption shrink-0 ${RADIUS.pill} bg-surface-hover px-space-1.5 py-px text-text-primary`,
  meterWrap: 'w-[7.5rem] shrink-0 sm:w-[8.75rem]',
  meterTrack: (_visual: LabLaneVisual) =>
    `relative flex h-5 items-center justify-end overflow-hidden ${RADIUS.inset} bg-surface-hover px-space-1.5`,
  meterFill: (visual: LabLaneVisual) =>
    `absolute inset-y-0 left-0 ${RADIUS.inset} ${visual.meterFill} transition-[width] duration-300 ease-out`,
  meterLabel: 'relative z-[1] type-caption font-medium tabular-nums text-text-primary',
} as const;
