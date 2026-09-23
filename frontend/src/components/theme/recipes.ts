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

/** Page shell inside the app workspace well — spacing from `--workspace-page-spacing`. */
export const WORKSPACE = {
  page:
    'h-full min-h-0 flex flex-col overflow-hidden min-w-0 p-workspace-page-inset gap-workspace-page-gap',
  wellGutter: 'pr-workspace-well-gutter pb-workspace-well-gutter pl-0 pt-0',
  contentInset: 'p-workspace-page-inset',
} as const;

/**
 * Spacing author rules:
 * - Change scale in primitives.css (`--space-*`, semantic aliases like `--panel-padding`).
 * - Composed shells: prefer WORKSPACE, LAYOUT, FILTER, EMPTY, DIALOG, PAGE_HEADER.
 * - One-offs in features: semantic utilities (`gap-layout-section`, `p-panel`, `gap-space-2`) or SPACING.* — not raw `gap-4`.
 * - `p-0` / `m-0` only for explicit layout resets.
 */
export const SPACING = {
  gapHairline: 'gap-space-0-5',
  gapTight: 'gap-space-1',
  gapCompact: 'gap-space-1-5',
  gapInline: 'gap-space-2',
  gapRelaxed: 'gap-space-3',
  gapSection: 'gap-layout-section',
  gapStack: 'gap-layout-stack',
  pPanel: 'p-panel',
  pxPanelHeader: 'px-panel-header-x',
  pyOverlayBody: 'py-overlay-body-y',
  pxOverlayBody: 'px-overlay-body-x',
  pyFilterBar: 'py-overlay-filter-y lg:py-overlay-filter-y-lg',
  pxFilterBar: 'px-overlay-filter-x lg:px-overlay-filter-x-lg',
  pbScrollEnd: 'pb-layout-scroll-end',
  pxTableCellCompact: 'px-table-cell-x-compact',
  pxTableCellDefault: 'px-table-cell-x-default',
  pxTableCellComfortable: 'px-table-cell-x-comfortable',
  pyTableCellCompact: 'py-table-cell-y-compact',
  pyTableCellDefault: 'py-table-cell-y-default',
  pyTableCellComfortable: 'py-table-cell-y-comfortable',
  stackCompact: 'space-y-space-1',
  stackNormal: 'space-y-space-2',
  stackRelaxed: 'space-y-space-3',
  pxSpace2: 'px-space-2',
  pxSpace3: 'px-space-3',
  pxSpace4: 'px-space-4',
  pySpace2: 'py-space-2',
  pSpace2: 'p-space-2',
  ptSpace1: 'pt-space-1',
  plSpace10: 'pl-space-10',
  plSpace12: 'pl-space-12',
  prSpace8: 'pr-space-8',
  prSpace12: 'pr-space-12',
  /** Input / option checkmark inset (shared with payment + lab popover chrome). */
  insetIconEnd: 'right-space-2',
} as const;

/** List filter bar + responsive entity filters. */
export const FILTER = {
  barInset: `w-full ${SPACING.pxFilterBar} ${SPACING.pyFilterBar}`,
  barGridDesktop: `grid grid-cols-4 ${SPACING.gapRelaxed} lg:gap-layout-section items-center w-full`,
  barGridCompact: `grid grid-cols-4 ${SPACING.gapInline} items-center w-full`,
  mobileGrid: `grid grid-cols-[1fr_auto] ${SPACING.gapInline} items-center w-full`,
  mobileTwoCol: `grid grid-cols-2 ${SPACING.gapInline} items-center w-full`,
  modalBody: 'px-space-5 py-space-4',
  barInsetCompact: 'px-space-3 py-space-2 w-full',
  chipRow: `flex flex-wrap ${SPACING.gapInline}`,
} as const;

/** Page header row spacing (inline + chrome). */
export const PAGE_HEADER = {
  barRow: `w-full flex items-center justify-between ${SPACING.gapSection} flex-nowrap min-w-0`,
  barInline: `shrink-0 h-chrome-header-band min-h-chrome-header-band max-h-chrome-header-band py-space-2 px-space-4`,
  barActions: `flex items-center ${SPACING.gapInline} shrink-0`,
  detailRow: `flex items-center justify-between shrink-0 ${SPACING.gapRelaxed} flex-nowrap w-full min-w-0`,
  detailMain: `flex items-center ${SPACING.gapRelaxed} min-w-0 flex-1 flex-wrap`,
  detailTitleRow: `flex items-center ${SPACING.gapRelaxed} flex-wrap`,
  detailBadges: `flex items-center ${SPACING.gapInline} flex-wrap`,
  detailActions: `shrink-0 flex items-center ${SPACING.gapInline}`,
} as const;

/** Shared page layout compositions (detail grids, scroll stacks). */
export const LAYOUT = {
  detailScroll:
    'flex-1 flex flex-col gap-layout-stack overflow-y-auto pb-layout-scroll-end bg-surface-page',
  detailGrid: 'grid gap-layout-section',
  detailGrid2: 'grid grid-cols-2 gap-layout-section',
  detailGrid3: 'grid grid-cols-3 gap-layout-section',
  detailGridRows2: 'grid grid-rows-[auto_auto] gap-layout-section w-full pb-layout-scroll-end',
  detailGridRowsSplit:
    'flex-1 grid grid-rows-[1fr_1fr] gap-layout-section min-h-0 h-full overflow-hidden',
  detailGrid3Rows2:
    'flex-1 grid grid-cols-3 grid-rows-[1fr_1fr] gap-layout-section min-h-0 h-full',
  balancedColumns: 'grid gap-layout-section',
  balancedColumnStack: 'flex flex-col gap-layout-section',
} as const;

/** Data table cell padding by density. */
export const TABLE_CELL = {
  compact: `${SPACING.pxTableCellCompact} ${SPACING.pyTableCellCompact}`,
  default: `${SPACING.pxTableCellDefault} ${SPACING.pyTableCellDefault}`,
  comfortable: `${SPACING.pxTableCellComfortable} ${SPACING.pyTableCellComfortable}`,
} as const;

/** In-page panel geometry (page + lab variants). */
export const PANEL_LAYOUT = {
  pageHeader:
    'shrink-0 h-panel-header min-h-panel-header max-h-panel-header px-panel-header-x border-b border-border-default flex items-center gap-space-3 overflow-hidden',
  pageHeaderBetween:
    'shrink-0 h-panel-header min-h-panel-header max-h-panel-header px-panel-header-x border-b border-border-default flex items-center justify-between gap-space-3 overflow-hidden',
  pageBodyPadding: SPACING.pPanel,
  labHeader:
    'shrink-0 px-space-2 py-space-2 border-b border-border-default flex items-center gap-space-2',
  labHeaderBetween:
    'shrink-0 px-space-2 py-space-2 border-b border-border-default flex items-center justify-between gap-space-2',
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
  none: 'rounded-none',
  button: 'rounded-button',
  buttonSquare: 'rounded-button-square',
  buttonCircle: 'rounded-button-circle',
  /** Date range / segmented row endpoints */
  rangeStart: 'rounded-l-pill rounded-r-none',
  rangeEnd: 'rounded-r-pill rounded-l-none',
  bottomSurface: 'rounded-b-surface',
} as const;

/** Empty state layout. */
export const EMPTY = {
  containerCompact: `flex flex-col items-center justify-center py-space-6 px-space-4 text-center opacity-55`,
  containerDefault:
    'flex flex-col items-center justify-center py-space-12 px-space-6 text-center opacity-55',
  /** Tighter empty for lab command center panels and dashboard table. */
  containerDense: `flex flex-col items-center justify-center py-space-3 px-space-3 text-center opacity-55`,
  iconWrapCompact: `w-10 h-10 ${RADIUS.pill} bg-surface-hover flex items-center justify-center mb-space-3`,
  iconWrapDefault: `w-16 h-16 ${RADIUS.pill} bg-surface-hover flex items-center justify-center mb-space-4`,
  iconWrapDense: `w-8 h-8 ${RADIUS.pill} bg-surface-hover flex items-center justify-center mb-space-2`,
  titleCompact: 'text-sm font-normal text-text-primary mb-space-1',
  titleDefault: 'text-base font-normal text-text-primary mb-space-2',
  titleDense: 'text-xs font-normal text-text-primary mb-space-0-5',
  description: 'text-sm text-text-tertiary mb-space-4 max-w-md',
  descriptionDense: 'text-xs text-text-tertiary mb-space-2 max-w-xs leading-snug',
  actionWrap: 'mt-space-2',
} as const;

/**
 * Elevation — values from semantic --shadow-* (see primitives + semantic-light/dark).
 * Prefer OVERLAY/PANEL composed shells; use SHADOW.* for one-off elevation.
 */
export const SHADOW = {
  subtle: 'shadow-sm',
  raised: 'shadow-md',
  overlay: 'shadow-lg',
  modal: 'shadow-xl',
  footer: 'shadow-footer',
} as const;

/** In-page panel shell tokens (page + lab). Used by Panel and command-center layouts. */
export const PANEL_SHELL = {
  page: {
    shell: `h-full ${SURFACE.raised} ${RADIUS.field} ${SHADOW.subtle} overflow-hidden flex flex-col`,
    header: PANEL_LAYOUT.pageHeader,
    headerBetween: PANEL_LAYOUT.pageHeaderBetween,
    title: `m-0 truncate leading-none ${TYPE.panelTitle}`,
    meta: `flex h-6 shrink-0 items-center ${TYPE.caption}`,
    headerActions: 'flex shrink-0 items-center min-h-0',
    body: 'flex-1 min-h-0',
    padding: PANEL_LAYOUT.pageBodyPadding,
    scrollDefault: 'overflow-hidden',
  },
  lab: {
    shell: `w-full ${SURFACE.recessed} ${RADIUS.surface} overflow-hidden`,
    header: PANEL_LAYOUT.labHeader,
    headerBetween: PANEL_LAYOUT.labHeaderBetween,
    title: `m-0 truncate ${TYPE.sectionTitle}`,
    meta: `flex shrink-0 items-center ${TYPE.caption}`,
    headerActions: 'flex shrink-0 items-center min-h-0',
    body: '',
    padding: SPACING.pSpace2,
    scrollDefault: '',
  },
} as const;

/** Native range slider thumb styles (webkit + moz pseudo-elements). */
export const RANGE_SLIDER = {
  /** Brand-ring thumbs for histogram age range slider. */
  thumbBrandRing: (radiusField: string) =>
    `[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:${radiusField} [&::-webkit-slider-thumb]:${SHADOW.raised} [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-surface [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:${radiusField} [&::-moz-range-thumb]:${SHADOW.raised} [&::-moz-range-thumb]:cursor-pointer`,
} as const;

/** Modal / dialog chrome. */
export const DIALOG = {
  modalHeader:
    'px-overlay-dialog-footer-x py-space-3-5 border-b border-border-default bg-surface flex items-center justify-between shrink-0',
  popoverHeader:
    `${SPACING.pxSpace4} py-space-3 bg-surface-page border-b border-border-subtle flex items-start justify-between shrink-0`,
  modalFooter:
    `flex items-center justify-between ${SPACING.gapRelaxed} px-overlay-dialog-footer-x py-overlay-dialog-footer-y border-t border-border-default bg-surface shrink-0 ${SHADOW.footer}`,
  popoverFooter:
    `${SPACING.pSpace2} bg-surface-page border-t border-border-subtle flex items-center justify-between ${SPACING.gapInline} shrink-0`,
  modalTitleRow: `flex items-start ${SPACING.gapRelaxed} min-w-0`,
  modalBadges: `flex items-center ${SPACING.gapInline} ${SPACING.ptSpace1}`,
  headerActions: `flex ${SPACING.gapInline} shrink-0`,
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
  topHeaderShell:
    'shrink-0 bg-surface-sidebar pl-chrome-header-gutter pr-chrome-header-trailing lg:pr-chrome-header-trailing-lg',
  topHeaderRow:
    'flex h-chrome-header-band min-h-chrome-header-band w-full items-center',
  pageHeaderChrome:
    'flex h-full w-full min-w-0 items-center pr-chrome-page-header-trailing',
  navScroll:
    'flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto py-chrome-nav-menu-gutter hide-scrollbar',
  navList: `flex flex-col ${SPACING.gapCompact}`,
  navItem:
    'group/nav relative flex min-h-chrome-nav-indicator w-full items-stretch text-left',
  navHit:
    `flex min-h-chrome-nav-indicator w-full min-w-0 flex-1 items-center overflow-hidden ${RADIUS.field} text-text-secondary transition-colors duration-200 ease-out`,
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
    `flex size-chrome-nav-indicator shrink-0 items-center justify-center ${RADIUS.field} transition-colors duration-200 ease-out`,
  navIndicatorActive: `bg-brand text-on-brand ${SHADOW.subtle}`,
  navIndicatorIdle: 'text-text-secondary',
  clipPane:
    'chrome-clip min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-opacity duration-200 ease-out',
  sectionTitle:
    `chrome-section-title shrink-0 overflow-hidden pl-chrome-rail pr-space-3 pt-0 pb-space-2 min-h-6 text-xxs font-medium uppercase tracking-wide text-text-secondary leading-none transition-opacity duration-200 ease-out`,
  navLabel:
    'chrome-clip min-w-0 flex-1 truncate pr-space-3 text-sm font-medium whitespace-nowrap transition-opacity duration-200 ease-out',
  navTooltip:
    `pointer-events-none absolute left-full z-50 ml-space-2 hidden whitespace-nowrap ${RADIUS.pill} bg-brand px-space-2-5 py-space-1 text-xs font-medium text-on-brand ${SHADOW.subtle} group-data-[collapsed=true]/chrome:group-hover/nav:block`,
  footerDivider: 'chrome-nav-split',
  footerDividerRule: 'chrome-nav-split-line',
  footerBlock: `flex shrink-0 flex-col ${SPACING.gapRelaxed} pb-chrome-nav-menu-gutter`,
} as const;

/** Floating menus (popover/modal) — single shell recipe. */
export const OVERLAY = {
  shell: `${SURFACE.raised} ${RADIUS.menu} overflow-hidden`,
  shellShadowLg: `${SURFACE.raised} ${RADIUS.menu} overflow-hidden ${SHADOW.overlay}`,
  shellShadowXl: `${SURFACE.raised} ${RADIUS.menu} overflow-hidden ${SHADOW.modal}`,
  anchoredRaised: `${SHADOW.raised} ring-1 ring-ring-subtle`,
} as const;

/** In-page raised panels (tables, lab queue, command center strip). */
export const PANEL = {
  raised: `${SURFACE.raised} ${RADIUS.surface} overflow-hidden`,
  raisedShadowSm: `${SURFACE.raised} ${RADIUS.surface} overflow-hidden ${SHADOW.subtle}`,
} as const;

/** Selectable rows/cards inside popovers and filter menus. */
export const MENU_ITEM = {
  base: `${SURFACE.raised} ${RADIUS.menuItem} border border-border-default`,
  interactive:
    'hover:border-border-strong transition-colors duration-200 cursor-pointer',
} as const;

/**
 * Control chrome — field focus (ring-1), interactive focus-visible (ring-2), heights.
 * Buttons use padding-based sizes; filter rows use CONTROL.height / heightMultiline.
 */
export const CONTROL = {
  hoverBorder: 'hover:border-border-hover',
  focus: 'focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand',
  focusWithin: 'focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20',
  error: 'border-border-error focus:border-border-error focus:ring-danger focus:ring-opacity-20',
  errorWithin: 'border-border-error focus-within:border-border-error focus-within:ring-danger focus-within:ring-opacity-20',
  open: 'border-brand ring-1 ring-brand ring-opacity-20',
  focusVisible:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
  focusVisibleBrand: 'focus-visible:ring-brand/30',
  focusVisibleTight:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
  focusVisibleDanger:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-1',
  focusSubtle: 'focus:outline-none focus:ring-1 focus:ring-brand/30',
  focusBrand: 'focus:outline-none focus:ring-2 focus:ring-brand/30',
  focusBrandSoft: 'focus:outline-none focus:ring-2 focus:ring-brand/20',
  focusVisibleFlat: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
  segmentActive: `${SHADOW.subtle} ring-1 ring-ring-subtle`,
  choiceSelected: `scale-110 ring-2 ring-offset-2 ring-brand ${SHADOW.raised}`,
  height: 'h-control',
  heightMultiline: 'min-h-control-multiline',
  minHeight: 'min-h-control',
} as const;

/** Auth login — shared geometry; colors stay on auth semantic tokens. */
export const AUTH_CONTROL = {
  focusField:
    'focus:outline-none focus:ring-2 focus:ring-auth-input-focus focus:ring-opacity-50 focus:border-auth-input-focus',
  focusSubmit:
    'focus:outline-none focus:ring-2 focus:ring-auth-input-focus focus:ring-opacity-50 focus:ring-offset-2 focus:ring-offset-auth-panel',
} as const;

export const AUTH_SHADOW = {
  card: SHADOW.modal,
  accent: SHADOW.overlay,
  logo: SHADOW.raised,
} as const;

/** Chip geometry. Font-size via CSS var (not text-*) so twMerge keeps status text-* colors. */
const BADGE_TYPE = '[font-size:var(--font-size-badge)]';

/** Chip geometry (type scale only). Color: badgeStyles + useBadgeAppearance() + semantic --badge / --*-fg. */
export const BADGE = {
  size: {
    xs: `px-space-2 py-space-1 ${BADGE_TYPE} ${SPACING.gapCompact} leading-none`,
    sm: `px-space-2 py-space-1 ${BADGE_TYPE} ${SPACING.gapCompact} leading-none`,
    md: `px-space-3 py-space-1-5 ${BADGE_TYPE} ${SPACING.gapInline} leading-none`,
  },
  icon: {
    xs: 'w-3.5 h-3.5',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  },
  filterChip: {
    xs: `px-space-3 py-space-1 ${BADGE_TYPE} ${SPACING.gapCompact} leading-none`,
    sm: `px-space-3 py-space-1-5 ${BADGE_TYPE} ${SPACING.gapCompact} leading-none`,
  },
} as const;
