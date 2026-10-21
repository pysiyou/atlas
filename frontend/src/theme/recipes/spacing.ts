/** Spacing, radius, shadow, workspace, and layout. */

export const WORKSPACE = {
  page:
    'h-full min-h-0 flex flex-col overflow-hidden min-w-0 p-workspace-page-inset gap-workspace-page-gap',
  wellGutter: 'pr-workspace-well-gutter pb-workspace-well-gutter pl-0 pt-0',
  contentInset: 'p-workspace-page-inset',
} as const;

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
  pLabPanel: 'p-lab-panel',
  pxLabPanelHeader: 'px-lab-panel-header-x',
  pyLabPanelHeader: 'py-lab-panel-header-y',
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

export const RADIUS = {
  /** Small chips embedded in sentences (event log highlights, etc.) */
  inline: 'rounded-inline',
  /** Muted inset blocks in body copy (smaller than surface / card) */
  inset: 'rounded-inset',
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

export const SHADOW = {
  subtle: 'shadow-sm',
  raised: 'shadow-md',
  overlay: 'shadow-lg',
  modal: 'shadow-xl',
  footer: 'shadow-footer',
} as const;
