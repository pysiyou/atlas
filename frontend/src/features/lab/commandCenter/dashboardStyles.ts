/**
 * Lab dashboard layout and table surface styles.
 */
import { CONTROL, RADIUS, SPACING, TYPE } from '@/components/theme/recipes';

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

const KPI_ICON_TONE = {
  brand: 'bg-brand/15 text-brand',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-info-bg text-info-fg-emphasis',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger-bg text-danger-fg-emphasis',
} as const;

export const TODAY_KPI = {
  headerRange: `${TYPE.caption} text-text-tertiary`,
  summaryMeta: `${TYPE.caption} text-text-tertiary`,
  summaryBlock:
    `grid grid-cols-2 gap-space-2 border-b border-border-subtle/60 pb-space-2`,
  summaryLine: 'flex min-w-0 flex-wrap items-baseline gap-x-space-1 gap-y-0',
  summaryValue: 'type-caption tabular-nums leading-snug text-brand',
  summaryLabel: `${TYPE.caption} leading-snug`,
  list: 'flex min-w-0 flex-col gap-space-2',
  row: `flex min-w-0 items-center gap-space-2 ${RADIUS.surface} border border-border-subtle/80 bg-surface px-space-2 py-space-1`,
  iconTone: KPI_ICON_TONE,
  iconWrap: (tone: keyof typeof KPI_ICON_TONE) =>
    `flex size-8 shrink-0 items-center justify-center ${RADIUS.inset} ${KPI_ICON_TONE[tone]}`,
  icon: 'size-4',
  labelBlock: 'flex min-w-0 flex-1 flex-col gap-space-0-5 sm:flex-row sm:items-center sm:gap-space-1.5',
  rowTitle: `${TYPE.bodySm} font-medium text-text-primary truncate`,
  tag: `${TYPE.caption} shrink-0 ${RADIUS.pill} bg-surface-hover px-space-1.5 py-px text-text-tertiary`,
  meterWrap: 'w-[7.5rem] shrink-0 sm:w-[8.75rem]',
  meterTrack: `relative flex h-5 items-center justify-end overflow-hidden ${RADIUS.inset} bg-success/10 px-space-1.5`,
  meterFill: `absolute inset-y-0 left-0 ${RADIUS.inset} bg-success/25 transition-[width] duration-300 ease-out`,
  meterLabel: `relative z-[1] ${TYPE.caption} font-medium tabular-nums text-text-secondary`,
} as const;
