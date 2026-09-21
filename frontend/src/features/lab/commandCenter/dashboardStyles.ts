/**
 * Lab dashboard layout, KPI, chart, and table surface styles.
 */
import { CONTROL, RADIUS, SHADOW, SPACING, SURFACE, TONE, TYPE } from '@/components/theme/recipes';

export const DASHBOARD_PAGE =
  `flex flex-1 h-full min-h-0 min-w-0 flex-col overflow-y-auto lg:overflow-hidden ${SPACING.gapSection}` as const;

export const DASHBOARD_KPI_ROW =
  `shrink-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${SPACING.gapSection}` as const;

export const DASHBOARD_KPI_CARD = {
  shell: `${SURFACE.raised} ${RADIUS.surface} ${SHADOW.subtle} flex items-center gap-space-3 px-space-4 py-space-4`,
  icon: `flex h-10 w-10 shrink-0 items-center justify-center ${RADIUS.field}`,
  label: `${TYPE.meta} mt-space-1`,
  value: 'text-3xl font-light leading-none tabular-nums text-text-primary',
} as const;

export const DASHBOARD_KPI_ICON_TONE = {
  success: `${TONE.success.well} ${TONE.success.fgEmphasis}`,
  warning: `${TONE.warning.well} ${TONE.warning.fgEmphasis}`,
  danger: `${TONE.danger.well} ${TONE.danger.fgEmphasis}`,
  brand: `${TONE.brand.well} ${TONE.brand.fg}`,
} as const;

export const DASHBOARD_BOTTOM_ROW =
  `grid min-h-72 shrink-0 grid-cols-1 ${SPACING.gapSection} lg:h-72 lg:grid-cols-3 lg:items-stretch` as const;

export const DASHBOARD_BOTTOM_PANEL = 'min-h-72 overflow-hidden lg:min-h-0 lg:h-full' as const;

export const DASHBOARD_TABLE_WRAP = 'flex min-h-80 flex-1 flex-col lg:min-h-0' as const;

export const DASHBOARD_TWO_LINE = {
  primary: 'truncate text-xs font-normal text-text-primary',
  secondary: `${TYPE.meta} truncate`,
  mrn: `${TYPE.caption} truncate uppercase tracking-wide`,
} as const;

export const DASHBOARD_CHART = {
  plot: 'flex h-44 items-end gap-space-2 px-space-1',
  barStack: `flex w-full flex-col overflow-hidden ${RADIUS.field}`,
  barTop: 'w-full bg-brand/45',
  barBottom: 'w-full bg-brand',
  axis: `mt-space-2 flex ${SPACING.gapTight} ${TYPE.caption}`,
  axisLabel: 'min-w-0 flex-1 truncate text-center',
  footer: `mt-space-3 flex items-center justify-between gap-space-3 border-t border-border-subtle pt-space-3 ${TYPE.meta}`,
  wowUp: TONE.success.fgEmphasis,
  wowDown: TONE.danger.fgEmphasis,
} as const;

export const DASHBOARD_ROW_INTERACTIVE = `cursor-pointer ${CONTROL.focusVisibleFlat}` as const;
