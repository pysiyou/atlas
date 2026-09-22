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

export const DASHBOARD_TWO_LINE = {
  primary: 'truncate text-xs font-normal text-text-primary',
  secondary: `${TYPE.meta} truncate`,
  mrn: `${TYPE.caption} truncate uppercase tracking-wide`,
} as const;

export const DASHBOARD_ROW_INTERACTIVE = `cursor-pointer ${CONTROL.focusVisibleFlat}` as const;

export const TODAY_PANEL = {
  body: 'flex min-h-0 flex-1 flex-col gap-space-4 overflow-y-auto px-space-2 py-space-3',
  composition: 'space-y-space-1.5',
  compositionLabel: `${TYPE.caption} font-medium uppercase tracking-wide text-text-tertiary`,
  compositionTrack: `flex h-1.5 w-full overflow-hidden ${RADIUS.pill} bg-border-subtle/40`,
  compositionSegment: 'h-full min-w-[2px] transition-[flex-grow] duration-300',
  section: 'space-y-space-2.5',
  sectionLabel: `${TYPE.caption} font-medium uppercase tracking-wide text-text-tertiary`,
  rows: 'space-y-space-3',
  row: 'space-y-space-1',
  rowHead: 'flex min-w-0 items-baseline justify-between gap-space-3',
  rowTitle: 'text-xs font-medium text-text-primary',
  rowCount: 'shrink-0 text-sm font-semibold tabular-nums leading-none text-text-primary',
  rowHint: 'text-[11px] leading-snug text-text-tertiary',
  rowMeta: 'text-[11px] tabular-nums text-text-secondary',
  meterTrack: `h-1 w-full overflow-hidden ${RADIUS.pill} bg-border-subtle/45`,
  meterFill: `h-full ${RADIUS.pill} transition-[width] duration-300 ease-out`,
  emptyHint: `${TYPE.caption} text-center text-text-tertiary py-space-2`,
} as const;

export const TODAY_PANEL_COLORS = {
  newOrders: '#5BA4E8',
  pending: '#F0A855',
  collected: '#3A9488',
  resulted: '#7B6FD4',
  blocked: '#E0667A',
  validatedToday: '#58A870',
} as const;

export const TODAY_IN_LAB_KEYS = ['pending', 'collected', 'resulted', 'blocked'] as const;
