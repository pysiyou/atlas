/**
 * Layout and typography tokens for the vertical event log feed.
 */
import { RADIUS, SPACING, TYPE } from '@/components/theme/recipes';

/** Matches headline `leading-5` — dot is centered in this box at the top of each row. */
export const EVENT_LOG_HEADLINE_LINE_CLASS = 'leading-5';

export const EVENT_LOG_STYLES = {
  feed: `flex flex-col ${SPACING.stackNormal} px-space-3 py-space-3`,
  dateDivider: 'flex w-full min-w-0 justify-end py-space-1',
  dateDividerLabel: `${TYPE.caption} shrink-0 text-text-tertiary`,
  row: 'relative flex items-start gap-space-3',
  /** Stretches with row height; connectors are absolute so the dot stays on the first line. */
  spineColumn: 'relative w-3 shrink-0 self-stretch',
  /**
   * Stems stop short of the dot (h-1.5 in h-5 slot) with space-1 gap on each side.
   * top stem: row top → above dot; bottom stem: below dot → row bottom.
   */
  spineStemTop:
    'event-log-spine-stem-top pointer-events-none absolute left-1/2 top-0 w-px -translate-x-1/2 bg-border-default h-[calc(0.625rem-0.1875rem-0.25rem)]',
  spineStemBottom:
    'event-log-spine-stem-bottom pointer-events-none absolute bottom-0 left-1/2 w-px -translate-x-1/2 bg-border-default top-[calc(0.625rem+0.1875rem+0.25rem)]',
  spineDotSlot: 'relative z-[1] flex h-5 w-full shrink-0 items-center justify-center',
  spineDot: `h-1.5 w-1.5 shrink-0 ${RADIUS.pill} ring-1 ring-surface`,
  spineDotMuted: 'bg-text-tertiary',
  content: 'event-log-content min-w-0 flex-1 pb-space-2',
  headline: `${TYPE.value} ${EVENT_LOG_HEADLINE_LINE_CLASS} mb-0`,
  headlineActor: 'font-medium text-text-primary',
  /** Emphasized ids, codes, and status labels in headlines */
  headlinePrimary: 'font-medium text-text-primary',
  /** Verb phrases and connector copy (e.g. "rejected sample", "entered results for ") */
  headlineSecondary: 'text-text-secondary',
  meta: `${TYPE.meta} text-text-tertiary`,
  /** Extra detail below the headline — title + body on a muted surface */
  detailSection: `${RADIUS.inset} space-y-space-0-5 bg-surface-hover px-space-2 py-space-2`,
  /** Section label — caption scale (smaller than detail body) */
  detailTitle: `${TYPE.caption} leading-tight font-normal`,
  detailBody: `${TYPE.value} leading-relaxed font-normal m-0`,
  /** Title + at most two lines of detail content, then ellipsis */
  detailContentClamp: 'line-clamp-2 min-w-0 break-words',
  detailResults: `${TYPE.value} leading-relaxed font-normal min-w-0 line-clamp-2 break-words`,
  detailLine: 'inline whitespace-nowrap',
  detailLineLabel: 'text-text-tertiary lowercase',
  detailLineValue: 'text-text-primary',
  expandToggle: `${TYPE.caption} text-brand hover:text-brand/80 mt-space-2 cursor-pointer`,
  rowList:
    '[&>*:first-child_.event-log-spine-stem-top]:hidden [&>*:last-child_.event-log-spine-stem-bottom]:hidden [&>*:last-child_.event-log-content]:pb-0',
} as const;

export function eventLogPartClass(part: { text: string; main?: boolean }): string {
  if (part.main) return EVENT_LOG_STYLES.headlinePrimary;
  return EVENT_LOG_STYLES.headlineSecondary;
}
