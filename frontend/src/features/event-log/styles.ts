/**
 * Layout and typography tokens for the vertical event log feed.
 */
import { RADIUS, SPACING, TYPE } from '@/components/theme/recipes';
import { ENTITY_ID } from '@/utils/constants';

/** Matches headline `leading-5` — dot is centered in this box at the top of each row. */
export const EVENT_LOG_HEADLINE_LINE_CLASS = 'leading-5';

export const EVENT_LOG_STYLES = {
  feed: `flex flex-col ${SPACING.stackNormal} px-space-3 py-space-3`,
  dateDivider: 'flex min-w-0 items-center gap-space-3 py-space-1',
  dateDividerLine: 'min-w-0 flex-1 border-t border-dashed border-border-subtle',
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
  spineDot: 'h-1.5 w-1.5 shrink-0 rounded-full ring-1 ring-surface',
  spineDotMuted: 'bg-text-tertiary',
  content: 'event-log-content min-w-0 flex-1 pb-space-2',
  headline: `${TYPE.value} ${EVENT_LOG_HEADLINE_LINE_CLASS} mb-0`,
  headlineActor: 'font-medium text-text-primary',
  /** PAT/ORD/SAM/TST, catalog codes (#…), and other hash-prefixed refs */
  headlineRef: `${ENTITY_ID} font-semibold`,
  /** Non-ref emphasis (e.g. order status labels without #) */
  headlinePrimary: 'font-medium text-text-primary',
  /** Verb phrases and connector copy (e.g. "rejected sample", "entered results for ") */
  headlineSecondary: 'text-text-secondary',
  meta: `${TYPE.meta} text-text-tertiary`,
  noteCard: `${RADIUS.surface} mt-space-2 mb-space-1 border border-border-subtle bg-surface-hover px-space-2 py-space-2`,
  noteCardLabel: `${TYPE.caption} font-medium text-text-secondary pb-space-0-5`,
  noteCardBody: `${TYPE.value} text-text-primary whitespace-pre-wrap leading-relaxed m-0`,
  expandToggle: `${TYPE.caption} text-brand hover:text-brand/80 mt-space-2 cursor-pointer`,
  rowList:
    '[&>*:first-child_.event-log-spine-stem-top]:hidden [&>*:last-child_.event-log-spine-stem-bottom]:hidden [&>*:last-child_.event-log-content]:pb-0',
} as const;

/** Emphasized headline tokens: hash-prefixed ids/codes use brand entity-id styling. */
export function eventLogPartClass(part: { text: string; emphasis?: boolean }): string {
  if (!part.emphasis) return EVENT_LOG_STYLES.headlineSecondary;
  const trimmed = part.text.trim();
  if (trimmed.startsWith('#')) return EVENT_LOG_STYLES.headlineRef;
  return EVENT_LOG_STYLES.headlinePrimary;
}