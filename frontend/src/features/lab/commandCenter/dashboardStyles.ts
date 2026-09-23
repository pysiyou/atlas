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
  primary: `truncate ${TYPE.value} font-normal`,
  secondary: `${TYPE.meta} truncate`,
  /** Subline codes, MRN, time — matches orders test identity subline. */
  mrn: `${TYPE.sectionTitle} text-text-secondary truncate`,
} as const;

export const DASHBOARD_ROW_INTERACTIVE = `cursor-pointer ${CONTROL.focusVisibleFlat}` as const;

export const TODAY_PANEL = {
  body: 'flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-space-3 py-space-2',
} as const;

export const TODAY_STEP_CHART = {
  bubbleMin: 58,
  bubbleMax: 96,
  bubbleText: 'text-text-inverse',
  zIndex: {
    collection: 3,
    entry: 2,
    validation: 1,
  },
  layout: 'flex h-full min-h-0 min-w-0 items-center gap-space-3',
  bubbleStage: 'relative h-[8.25rem] w-[8.5rem] shrink-0',
  bubble: `absolute flex flex-col items-center justify-center gap-space-0-5 ${RADIUS.pill} text-center ring-4 ring-[color:var(--surface)]`,
  bubbleDuration: `max-w-[90%] truncate px-space-1 ${TYPE.amount} font-semibold tabular-nums leading-none`,
  bubbleLabel: `max-w-[88%] truncate px-space-1 opacity-80 ${TYPE.caption}`,
  bubblePositions: {
    collection: 'left-1/2 top-0 -translate-x-1/2',
    entry: 'bottom-0 left-0',
    validation: 'bottom-0 right-0',
  },
  metricStack: 'flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-space-2',
  metricRow: 'flex min-w-0 flex-col gap-space-1',
  metricHead: 'flex min-w-0 items-baseline justify-between gap-space-2',
  metricLabel: `${TYPE.caption} truncate text-text-tertiary`,
  metricValue: `shrink-0 ${TYPE.amount} font-semibold tabular-nums leading-none`,
  metricBarLine: 'flex min-w-0 items-center gap-space-2',
  metricSide: `w-[3.6rem] shrink-0 truncate ${TYPE.caption} tabular-nums leading-none`,
  metricSideEnd: `w-[4.75rem] shrink-0 truncate text-right ${TYPE.caption} tabular-nums leading-none`,
  metricTrack: `h-px min-w-0 flex-1 overflow-hidden ${RADIUS.pill} bg-border-subtle/60`,
  metricFill: `h-full ${RADIUS.pill} transition-[width] duration-300`,
} as const;
