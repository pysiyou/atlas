/**
 * Shared Panel variant tokens.
 * `page` = dashboard/detail/command-center shells; `lab` = compact modal/grid sections.
 */

export type PanelVariant = 'page' | 'lab';
export type PanelPadding = 'default' | 'none';
export type PanelScroll = 'default' | 'auto' | 'visible';
export type PanelSpacing = 'none' | 'compact' | 'normal' | 'relaxed';

export const PANEL_SPACING: Record<PanelSpacing, string> = {
  none: '',
  compact: 'space-y-1',
  normal: 'space-y-2',
  relaxed: 'space-y-3',
};

export const PANEL_SCROLL: Record<Exclude<PanelScroll, 'default'>, string> = {
  auto: 'overflow-y-auto',
  visible: 'overflow-visible',
};

export const PANEL_VARIANTS = {
  page: {
    shell:
      'h-full bg-surface rounded border border-border-default shadow-sm overflow-hidden flex flex-col',
    header:
      'shrink-0 h-10 min-h-10 max-h-10 px-4 border-b border-border-default flex items-center gap-3 overflow-hidden',
    headerBetween:
      'shrink-0 h-10 min-h-10 max-h-10 px-4 border-b border-border-default flex items-center justify-between gap-3 overflow-hidden',
    title: 'm-0 truncate text-sm font-light leading-none text-text-primary',
    meta: 'flex h-6 shrink-0 items-center text-xxs text-text-tertiary',
    headerActions: 'flex shrink-0 items-center min-h-0',
    body: 'flex-1 min-h-0',
    padding: 'p-4',
    scrollDefault: 'overflow-hidden',
  },
  lab: {
    shell: 'w-full bg-surface-page border border-border-default rounded-md overflow-hidden',
    header:
      'shrink-0 px-2 py-2 border-b border-border-default flex items-center gap-2',
    headerBetween:
      'shrink-0 px-2 py-2 border-b border-border-default flex items-center justify-between gap-2',
    title: 'm-0 truncate text-xxs font-medium text-text-secondary uppercase tracking-wide',
    meta: 'flex shrink-0 items-center text-xxs text-text-tertiary',
    headerActions: 'flex shrink-0 items-center min-h-0',
    body: '',
    padding: 'p-2',
    scrollDefault: '',
  },
} as const;
