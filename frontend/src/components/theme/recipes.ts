/**
 * Canonical type + surface + status-tone + chrome class recipes.
 * Author stacks here; shells and feature style modules re-export or compose them.
 */

export const TYPE = {
  pageTitle: 'type-page-title text-text-primary',
  detailTitle: 'type-detail-title text-text-primary',
  /** In-page panel header — xs scale, lighter than pageTitle. */
  panelTitle: 'type-panel-title text-text-primary',
  modalTitle: 'type-modal-title text-text-primary',
  sectionTitle: 'type-section-title text-text-secondary',
  label: 'type-label text-text-secondary',
  value: 'type-body text-text-primary',
  meta: 'type-body text-text-tertiary',
  amount: 'type-amount text-text-primary',
  caption: 'type-caption text-text-tertiary',
} as const;

/** Body cell scale for DataTable rows — change once to resize table body text. */
const TABLE_TEXT_SCALE = 'type-table-cell';

/** Data table cells, headers, and list pagination. */
export const TABLE_TYPE = {
  /** Type scale step for body cells — matches `--type-table-cell-size`. */
  size: TABLE_TEXT_SCALE,
  /** Column header label (DataTable `TableHeader` — apply on each column cell / label). */
  columnTitle: 'type-table-header text-text-tertiary',
  columnTitleActive: 'text-text-primary bg-surface-selected',
  columnTitleSortable: 'cursor-pointer hover:bg-surface-hover select-none',
  cell: `${TABLE_TEXT_SCALE} text-text-primary`,
  secondary: `${TABLE_TEXT_SCALE} text-text-secondary`,
  meta: `${TABLE_TEXT_SCALE} text-text-tertiary`,
  amount: `${TABLE_TEXT_SCALE} text-text-primary`,
  label: `${TABLE_TEXT_SCALE} text-text-secondary`,
  caption: `${TABLE_TEXT_SCALE} text-text-tertiary`,
  link: `${TABLE_TEXT_SCALE} text-brand underline`,
} as const;

/** DataTable shell layout — pairs with TABLE_TYPE + TABLE_CELL padding. */
export const TABLE_SHELL = {
  headerRow:
    'grid w-full min-w-full items-stretch border-b border-border-default bg-surface-table-header',
  headerRowSticky: 'sticky top-0 z-10',
  headerCell: 'flex min-w-0 items-center gap-space-2 whitespace-nowrap',
  bodyCell: 'min-w-0 overflow-hidden flex items-center',
  row: 'grid w-full min-w-full items-center border-b border-border-default transition-colors duration-200',
  rowClickable: 'cursor-pointer hover:bg-surface-hover',
  rowStripedEven: 'bg-surface',
  rowStripedOdd: 'bg-surface-hover/50',
} as const;

/**
 * Detail pages, panels, receipts, and key-value blocks — not forms, not data tables.
 * Prefer over TYPE for DetailField, DetailGroup, and detail sections.
 */
export const DETAIL_TYPE = {
  value: 'type-detail-value text-text-primary',
  label: 'type-detail-label text-text-secondary',
  meta: 'type-detail-meta text-text-tertiary',
  amount: 'type-detail-value text-text-primary',
  title: 'type-detail-title text-text-primary',
  subtitle: 'type-detail-subtitle text-text-tertiary',
  /** Larger section headings — use when promoting group labels to base scale. */
  sectionTitle: 'type-detail-section-title text-text-secondary',
  /** Default for DetailGroup + DetailsTable row labels until hierarchy pass picks one token. */
  sectionTitleCompact: 'type-section-title text-text-secondary',
  link: 'type-detail-value text-brand underline',
} as const;

/** Button label typography — pairs with padding in Button.tsx. */
export const BUTTON_TYPE = {
  sm: 'type-button-sm',
  md: 'type-button-md',
  lg: 'type-button-lg',
} as const;

/** Avatar circle initials + optional label stacks. */
export const AVATAR_TYPE = {
  circle: {
    xxs: 'type-micro',
    xs: 'type-micro',
    sm: 'type-body',
    md: 'type-amount',
    lg: 'type-body',
    xl: 'type-page-title',
  },
  primary: {
    xxs: 'type-caption',
    xs: 'type-body',
    sm: 'type-amount',
    md: 'type-body',
    lg: 'type-page-title',
    xl: 'type-page-title',
  },
  secondary: {
    xxs: 'type-caption',
    xs: 'type-caption',
    sm: 'type-caption',
    md: 'type-body',
    lg: 'type-amount',
    xl: 'type-body',
  },
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

/** Inline validation / field error copy (forms, selects, tag input). */
export const FIELD_ERROR = `${TYPE.value} ${TONE.danger.fg}` as const;

/** Compact validation line (captions, units). */
export const FIELD_ERROR_CAPTION = `${TYPE.caption} ${TONE.danger.fg}` as const;

/** Full-page / modal error surfaces. */
export const ERROR_SURFACE_TYPE = {
  title: `${TYPE.pageTitle} font-semibold`,
  message: `${TYPE.amount} text-center text-text-tertiary`,
  code: `${TYPE.value} font-mono`,
  codeMeta: `${TYPE.value} opacity-60 mt-space-1`,
  operation: `${TYPE.amount} opacity-80 mt-space-1`,
} as const;

/** Inline alert card typography. */
export const ALERT_SURFACE_TYPE = {
  title: `m-0 ${TYPE.amount} font-semibold leading-snug`,
  body: `mt-space-1 mb-0 ${TYPE.amount} leading-snug`,
} as const;

/** Filter section chrome (sidebar sections, not modal FILTER_TYPE). */
export const FILTER_SECTION_TYPE = {
  heading: `${TYPE.value} font-semibold text-text-tertiary uppercase tracking-wide`,
  countBadge: `${TYPE.caption} font-normal`,
} as const;

/** Theme switcher segment control. */
export const THEME_SWITCH_TYPE = {
  segment: `${TYPE.value} font-normal leading-none`,
  label: `${TYPE.caption} font-medium leading-none`,
} as const;

/** Price range slider labels. */
export const PRICE_RANGE_TYPE = {
  value: `${TYPE.amount} font-normal text-text-tertiary`,
  bound: `${TYPE.meta} text-text-disabled`,
} as const;

/** Filter modal / inline filter section headings. */
export const FILTER_TYPE = {
  sectionTitle: 'type-detail-title font-semibold text-text-primary mb-space-3',
} as const;

/** Order / payment receipt (panel, compact, detailed). */
export const RECEIPT_TYPE = {
  metaPart: 'font-normal tabular-nums type-body',
  metaRow: `flex flex-wrap items-center gap-x-space-2 gap-y-space-0-5 min-w-0 ${TYPE.meta}`,
  detailedPatientName: `${TYPE.amount} text-text-secondary`,
  detailedPatientMissing: `${TYPE.amount} text-text-tertiary italic`,
  fieldRow: TYPE.value,
  panelPatientName: `${TYPE.amount} text-text-primary`,
  compactEntityId: `${TYPE.value} min-w-0 truncate`,
  rowListCompact: 'flex justify-between items-start gap-space-2 type-body',
  rowListDetailed: 'flex justify-between items-start gap-space-2 type-amount gap-space-3',
  emptyCompact: `${TYPE.value} text-text-tertiary italic`,
  emptyDetailed: `${TYPE.amount} text-text-tertiary italic`,
  totalLabelCompact: `${TYPE.value} font-normal text-text-secondary uppercase tracking-wider`,
  totalLabelDetailed: `${TYPE.amount} font-normal text-text-secondary uppercase tracking-wider`,
  totalValueCompact: `${TYPE.amount} text-brand`,
  totalValueDetailed: `${TYPE.pageTitle} text-text-primary`,
} as const;

/** Trailing price on entity cards (catalog, orders, payments). */
export const CARD_PRICE = `${TYPE.pageTitle} leading-none` as const;

/** Patient form tab section labels. */
export const FORM_TAB_TITLE = `${TYPE.value} font-normal` as const;

/** Select / menu row text scale. */
export const MENU_ITEM_TYPE = 'type-amount' as const;

/** In-app text links (dashboard, pipeline). */
export const INLINE_LINK = `${TABLE_TYPE.link} hover:underline` as const;

/** Data table pagination controls. */
export const PAGINATION_TYPE = {
  pageButtonBase: `${TABLE_TYPE.size} font-normal`,
  ellipsis: `${TABLE_TYPE.meta}`,
  selectCompact: `${TABLE_TYPE.size} leading-5`,
} as const;

/** Date picker / date input calendar grids. */
export const CALENDAR_TYPE = {
  weekday: `${TYPE.meta} text-center py-space-1`,
  day: TYPE.value,
  month: TYPE.amount,
  applyButton: `${TYPE.value} font-normal`,
} as const;

/** Toast content (semantic toast colors). */
export const TOAST_TYPE = {
  action: 'type-amount text-toast-fg',
  title: 'type-amount font-semibold leading-snug text-toast-fg',
  subtitle: 'type-amount leading-snug text-toast-fg-muted',
} as const;

/** Auth login module — isolated palette; scale via type-* roles only here. */
export const AUTH_TYPE = {
  kicker: 'font-body text-auth-fg-light type-amount tracking-wider uppercase',
  lead: 'font-body type-page-title text-auth-fg-muted',
  featureTitle: 'font-body font-semibold text-auth-fg type-amount leading-tight',
  featureBody: 'font-body type-amount text-auth-fg-muted',
  footer: 'font-body type-amount text-auth-fg-muted',
  formSubtitle: 'font-body text-auth-fg-muted type-amount',
  formError: 'font-body type-amount text-auth-error-fg',
  fieldLabel: 'block font-body type-amount font-normal text-auth-fg-muted',
  formFooter: 'font-body text-center type-amount text-auth-fg-subtle',
  companySubtitle: 'font-body text-auth-fg-light type-body tracking-wider uppercase',
  brandingKicker:
    'font-body text-auth-fg-light type-amount tracking-widest uppercase mt-space-1',
  brandingLead: 'font-body type-page-title text-auth-fg-muted leading-relaxed max-w-md',
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
  titleCompact: 'type-empty-title text-text-primary mb-space-1',
  titleDefault: 'type-body text-text-primary mb-space-2',
  titleDense: 'type-empty-title-dense text-text-primary mb-space-0-5',
  description: 'type-empty-description text-text-tertiary mb-space-4 max-w-md',
  descriptionDense: 'type-empty-description-dense text-text-tertiary mb-space-2 max-w-xs',
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
    `chrome-section-title shrink-0 overflow-hidden pl-chrome-rail pr-space-3 pt-0 pb-space-2 min-h-6 type-chrome-section-title text-text-secondary transition-opacity duration-200 ease-out`,
  navLabel:
    'chrome-clip min-w-0 flex-1 truncate pr-space-3 type-chrome-nav-label whitespace-nowrap transition-opacity duration-200 ease-out',
  navTooltip:
    `pointer-events-none absolute left-full z-50 ml-space-2 hidden whitespace-nowrap ${RADIUS.pill} bg-brand px-space-2-5 py-space-1 type-chrome-nav-tooltip text-on-brand ${SHADOW.subtle} group-data-[collapsed=true]/chrome:group-hover/nav:block`,
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

/** Chip geometry (type-badge so twMerge keeps status text-* colors). */
const BADGE_TYPE = 'type-badge';

/** Chip geometry (type scale only). Color: badgeStyles + useBadgeAppearance() + semantic --badge / --*-fg. */
export const BADGE = {
  size: {
    xs: `px-space-2 py-space-1 ${BADGE_TYPE} ${SPACING.gapCompact}`,
    sm: `px-space-2 py-space-1 ${BADGE_TYPE} ${SPACING.gapCompact}`,
    md: `px-space-3 py-space-1-5 ${BADGE_TYPE} ${SPACING.gapInline}`,
  },
  icon: {
    xs: 'w-3.5 h-3.5',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  },
  filterChip: {
    xs: `px-space-3 py-space-1 ${BADGE_TYPE} ${SPACING.gapCompact}`,
    sm: `px-space-3 py-space-1-5 ${BADGE_TYPE} ${SPACING.gapCompact}`,
  },
} as const;
