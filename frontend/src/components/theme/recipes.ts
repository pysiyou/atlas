/**
 * Canonical type + surface + status-tone + chrome class recipes.
 * Author stacks here; shells and feature style modules re-export or compose them.
 */

export const TYPE = {
  pageTitle: 'text-lg font-light text-text-primary',
  detailTitle: 'text-sm font-medium text-text-primary',
  /** 40px page-panel header — sm + light, not the list pageTitle. */
  panelTitle: 'text-sm font-light text-text-primary',
  modalTitle: 'text-base font-medium text-text-primary',
  sectionTitle: 'text-xxs font-medium uppercase tracking-wide text-text-secondary',
  label: 'text-xs text-text-secondary',
  value: 'text-xs text-text-primary',
  meta: 'text-xs text-text-tertiary',
  amount: 'text-sm text-text-primary',
  caption: 'text-xxs text-text-tertiary',
} as const;

/** Status roles: fg/fill/well from semantic --{role}-* tokens. Workflow stage tokens stay separate. */
export const TONE = {
  neutral: {
    fg: 'text-text-secondary',
    fgEmphasis: 'text-text-secondary',
    fill: 'bg-text-tertiary',
    well: 'bg-surface-hover border border-border-default',
  },
  brand: {
    fg: 'text-brand',
    fgEmphasis: 'text-brand',
    fill: 'bg-brand',
    well: 'bg-brand-muted border border-brand',
  },
  info: {
    fg: 'text-info-fg',
    fgEmphasis: 'text-info-fg-emphasis',
    fill: 'bg-info-fg-emphasis',
    well: 'bg-info-bg border border-info-stroke',
  },
  success: {
    fg: 'text-success-fg',
    fgEmphasis: 'text-success-fg-emphasis',
    fill: 'bg-success-fg-emphasis',
    well: 'bg-success-bg border border-success-stroke',
  },
  warning: {
    fg: 'text-warning-fg',
    fgEmphasis: 'text-warning-fg-emphasis',
    fill: 'bg-warning-fg-emphasis',
    well: 'bg-warning-bg border border-warning-stroke',
  },
  danger: {
    fg: 'text-danger-fg',
    fgEmphasis: 'text-danger-fg-emphasis',
    fill: 'bg-danger-fg-emphasis',
    well: 'bg-danger-bg border border-danger-stroke',
  },
} as const;

export const SURFACE = {
  raised: 'bg-surface border border-border-default',
  recessed: 'bg-surface-page border border-border-default',
  dangerWell: TONE.danger.well,
  successWell: TONE.success.well,
  warningWell: TONE.warning.well,
  infoWell: TONE.info.well,
} as const;

/**
 * Semantic geometry — Tailwind classes map to CSS vars in semantic-light.css.
 * Themes override --radius-field | menu | menu-item | surface | workspace (not primitives directly).
 */
export const RADIUS = {
  field: 'rounded-field',
  menu: 'rounded-menu',
  menuItem: 'rounded-menu-item',
  surface: 'rounded-surface',
  workspace: 'rounded-workspace',
  notice: 'rounded-notice',
  pill: 'rounded-pill',
  /** @deprecated use field */
  control: 'rounded-field',
  /** @deprecated use surface */
  card: 'rounded-surface',
  /** @deprecated use menu */
  overlay: 'rounded-menu',
  /** @deprecated use workspace */
  shell: 'rounded-workspace',
} as const;

/** Primitive token references — lengths live only in primitives.css. */
export const CHROME_RAIL_VAR = 'var(--chrome-rail)' as const;
export const CHROME_SIDEBAR_EXPANDED_VAR = 'var(--chrome-sidebar-expanded)' as const;
export const CHROME_HEADER_BAND_VAR = 'var(--chrome-header-band)' as const;

/** App shell — collapsed width (--chrome-rail); header band height (--chrome-header-band). */
export const CHROME = {
  railWidth: 'w-chrome-rail',
  railHeight: 'h-chrome-header-band',
  railMinHeight: 'min-h-chrome-header-band',
  railVar: CHROME_RAIL_VAR,
  sidebarExpandedVar: CHROME_SIDEBAR_EXPANDED_VAR,
  aside:
    'group/chrome relative flex h-full flex-col overflow-x-hidden overflow-y-hidden bg-surface-sidebar',
  headerBand:
    'flex h-chrome-header-band min-h-chrome-header-band w-full shrink-0 items-center',
  topHeaderRow:
    'flex min-h-chrome-header-band shrink-0 items-stretch bg-surface-sidebar pl-chrome-header-gutter pr-3 lg:pr-5',
  pageHeaderChrome:
    'h-full min-h-chrome-header-band h-chrome-header-band flex items-center pr-2',
  navScroll: 'flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto py-3 hide-scrollbar',
  navList: 'flex flex-col gap-1.5',
  navItem:
    'group/nav relative flex min-h-chrome-nav-indicator w-full items-stretch text-left',
  navHit:
    'flex min-h-chrome-nav-indicator w-full min-w-0 flex-1 items-center overflow-hidden rounded-field text-text-secondary transition-colors duration-200 ease-out',
  navHitHover: 'group-hover/nav:bg-surface-hover',
  navIconActive: 'text-brand group-hover/nav:text-brand',
  navIconHover: 'group-hover/nav:text-text-primary',
  navLabelActive: 'text-brand group-hover/nav:text-brand',
  navLabelHover: 'group-hover/nav:text-text-primary',
  navIconColumn:
    'chrome-rail-slot flex w-chrome-rail shrink-0 items-center justify-center',
  navIcon:
    'flex size-chrome-nav-indicator shrink-0 items-center justify-center',
  navIndicator:
    'flex size-chrome-nav-indicator shrink-0 items-center justify-center rounded-field transition-colors duration-200 ease-out',
  navIndicatorActive: 'bg-brand text-on-brand shadow-sm',
  navIndicatorIdle: 'text-text-secondary',
  clipPane:
    'chrome-clip min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-opacity duration-200 ease-out',
  sectionTitle:
    'chrome-section-title shrink-0 overflow-hidden pl-chrome-rail pr-3 pt-0 pb-2 min-h-6 text-xxs font-medium uppercase tracking-wide text-text-secondary leading-none transition-opacity duration-200 ease-out',
  navLabel:
    'chrome-clip min-w-0 flex-1 truncate pr-3 text-sm font-medium whitespace-nowrap transition-opacity duration-200 ease-out',
  navTooltip:
    'pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-pill bg-brand px-2.5 py-1 text-xs font-medium text-on-brand shadow-sm group-data-[collapsed=true]/chrome:group-hover/nav:block',
  footerDivider: 'chrome-nav-split',
  footerDividerRule: 'chrome-nav-split-line',
  footerBlock: 'shrink-0 pb-3',
} as const;

/** Floating menus (popover/modal) — single shell recipe. */
export const OVERLAY = {
  shell: `${SURFACE.raised} ${RADIUS.menu} overflow-hidden`,
  shellShadowLg: `${SURFACE.raised} ${RADIUS.menu} overflow-hidden shadow-lg`,
  shellShadowXl: `${SURFACE.raised} ${RADIUS.menu} overflow-hidden shadow-xl`,
} as const;

/** In-page raised panels (tables, lab queue, command center strip). */
export const PANEL = {
  raised: `${SURFACE.raised} ${RADIUS.surface} overflow-hidden`,
  raisedShadowSm: `${SURFACE.raised} ${RADIUS.surface} overflow-hidden shadow-sm`,
} as const;

/** Selectable rows/cards inside popovers and filter menus. */
export const MENU_ITEM = {
  base: `${SURFACE.raised} ${RADIUS.menuItem} border border-border-default`,
  interactive:
    'hover:border-border-strong transition-colors duration-200 cursor-pointer',
} as const;

export const CONTROL = {
  hoverBorder: 'hover:border-border-hover',
  focus: 'focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand',
  focusWithin: 'focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20',
  error: 'border-border-error focus:border-border-error focus:ring-danger focus:ring-opacity-20',
  errorWithin: 'border-border-error focus-within:border-border-error focus-within:ring-danger focus-within:ring-opacity-20',
  height: 'h-control',
} as const;

/** Chip geometry. Font-size via CSS var (not text-*) so twMerge keeps status text-* colors. */
const BADGE_TYPE = '[font-size:var(--font-size-badge)]';

/** Chip geometry (type scale only). Color: badgeStyles + useBadgeAppearance() + semantic --badge / --*-fg. */
export const BADGE = {
  size: {
    xs: `px-2 py-1 ${BADGE_TYPE} gap-1.5 leading-none`,
    sm: `px-2 py-1 ${BADGE_TYPE} gap-1.5 leading-none`,
    md: `px-3 py-1.5 ${BADGE_TYPE} gap-2 leading-none`,
  },
  icon: {
    xs: 'w-3.5 h-3.5',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  },
  filterChip: {
    xs: `px-3 py-1 ${BADGE_TYPE} gap-1.5 leading-none`,
    sm: `px-3 py-1.5 ${BADGE_TYPE} gap-1.5 leading-none`,
  },
} as const;
