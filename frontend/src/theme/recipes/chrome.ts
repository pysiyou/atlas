/** App chrome / sidebar. */

import { SPACING, RADIUS, SHADOW } from './spacing';

export const CHROME_RAIL_VAR = 'var(--chrome-rail)' as const;

export const CHROME_SIDEBAR_EXPANDED_VAR = 'var(--chrome-sidebar-expanded)' as const;

export const CHROME_HEADER_BAND_VAR = 'var(--chrome-header-band)' as const;

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
    'group/nav relative flex min-h-chrome-nav-indicator w-full items-stretch text-left cursor-pointer',
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
