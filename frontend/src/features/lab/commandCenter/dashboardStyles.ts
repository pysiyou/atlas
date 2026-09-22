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
  empty: `${TYPE.meta} text-text-secondary`,
  donutRow:
    'flex min-h-0 flex-1 items-center justify-center gap-space-6 py-space-2 sm:justify-start sm:gap-space-8',
  donutChartWrap: 'relative shrink-0',
  donutCenter:
    'pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-space-0.5 text-center',
  donutCenterLabel: 'text-xs font-normal text-text-tertiary',
  donutCenterValue: 'text-3xl font-semibold leading-none tracking-tight tabular-nums text-text-primary',
  donutLegend: 'grid min-w-0 flex-1 grid-cols-2 gap-x-space-6 gap-y-space-5 sm:max-w-[220px]',
  donutLegendItem: 'min-w-0',
  donutLegendHeading: 'flex items-center gap-space-2',
  donutLegendSwatch: 'h-2.5 w-2.5 shrink-0 rounded-full',
  donutLegendLabel: 'truncate text-sm font-normal text-text-secondary',
  donutLegendValue:
    'mt-space-1 flex items-baseline gap-space-2 pl-[18px] text-xl font-semibold leading-none tabular-nums text-text-primary',
  donutLegendPercent: 'text-sm font-normal tabular-nums text-text-secondary',
  footer: `mt-space-3 flex items-center justify-between gap-space-3 border-t border-border-subtle pt-space-3 ${TYPE.meta}`,
  wowUp: TONE.success.fgEmphasis,
  wowDown: TONE.danger.fgEmphasis,
} as const;

export const DASHBOARD_ROW_INTERACTIVE = `cursor-pointer ${CONTROL.focusVisibleFlat}` as const;

/** Pipeline donut palette — matches schedule chart reference (light dashboard). */
export const SCHEDULE_STATE_CHART_COLORS = {
  pending: '#F0A855',
  running: '#3A9488',
  resulted: '#5BA4E8',
  validated: '#58A870',
  blocked: '#E0667A',
} as const;
