/**
 * Shared page panel shell — command center, order detail, and other dashboard sections.
 */

export const PAGE_PANEL = {
  shell: 'h-full bg-surface rounded border border-border-default shadow-sm overflow-hidden flex flex-col',
  header:
    'shrink-0 h-10 min-h-10 max-h-10 px-4 border-b border-border-default flex items-center gap-3 overflow-hidden',
  headerBetween:
    'shrink-0 h-10 min-h-10 max-h-10 px-4 border-b border-border-default flex items-center justify-between gap-3 overflow-hidden',
  title: 'm-0 truncate text-sm font-light leading-none text-text-primary',
  meta: 'flex h-6 shrink-0 items-center text-xxs text-text-tertiary',
  body: 'flex-1 min-h-0 overflow-hidden',
  headerActions: 'flex shrink-0 items-center min-h-0',
} as const;
