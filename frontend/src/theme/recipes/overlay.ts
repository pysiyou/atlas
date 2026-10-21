/** Filters, dialogs, menus, and floating shells. */

import { text } from './cva/text';
import { SPACING, RADIUS, SHADOW } from './spacing';
import { SURFACE } from './surface';

const filterBarRow = `[&>*]:min-w-0 [&>*]:flex-1`;

export const FILTER_TYPE = {
  sectionTitle: `${text({ role: 'title-section' })} font-semibold mb-space-3`,
} as const;

export const FILTER = {
  barInset: `w-full ${SPACING.pxFilterBar} ${SPACING.pyFilterBar}`,
  barGridDesktop: `flex ${SPACING.gapRelaxed} lg:gap-layout-section items-center w-full ${filterBarRow}`,
  barGridCompact: `flex ${SPACING.gapInline} items-center w-full ${filterBarRow}`,
  mobileGrid: `grid grid-cols-[1fr_auto] ${SPACING.gapInline} items-center w-full`,
  mobileTwoCol: `grid grid-cols-2 ${SPACING.gapInline} items-center w-full`,
  modalBody: 'px-space-5 py-space-4',
  barInsetCompact: 'px-space-3 py-space-2 w-full',
  chipRow: `flex flex-wrap ${SPACING.gapInline}`,
} as const;

export const DIALOG = {
  modalHeader:
    'px-overlay-dialog-footer-x py-space-3-5 border-b border-border-default bg-surface shrink-0',
  popoverHeader:
    `${SPACING.pxSpace4} py-space-3 bg-surface-page border-b border-border-subtle flex items-start justify-between shrink-0`,
  modalFooter:
    `flex items-center justify-between ${SPACING.gapRelaxed} px-overlay-dialog-footer-x py-overlay-dialog-footer-y border-t border-border-default bg-surface shrink-0 ${SHADOW.footer}`,
  popoverFooter:
    `${SPACING.pSpace2} bg-surface-page border-t border-border-subtle flex items-center justify-between ${SPACING.gapInline} shrink-0`,
  modalTitleRow: `flex items-start ${SPACING.gapRelaxed} min-w-0`,
  /** Title stack (incl. badges under title) | close column. */
  modalHeaderGrid:
    'grid w-full min-w-0 items-start gap-x-space-2 grid-cols-[minmax(0,1fr)_minmax(7rem,7rem)]',
  modalTitleStack: `col-start-1 flex min-w-0 flex-col ${SPACING.gapHairline}`,
  modalTitleFirstLine: 'min-w-0',
  modalBadgeInline:
    'inline-flex align-middle flex-wrap items-center gap-space-1 leading-none ml-space-2',
  modalCloseColumn: `col-start-2 row-start-1 flex w-full min-w-0 shrink-0 items-start justify-end ${SPACING.gapInline} self-start`,
  modalBadges: `flex items-center ${SPACING.gapInline} ${SPACING.ptSpace1}`,
  headerActions: `flex ${SPACING.gapInline} shrink-0`,
} as const;

export const OVERLAY = {
  shell: `${SURFACE.raised} ${RADIUS.menu} overflow-hidden`,
  shellShadowLg: `${SURFACE.raised} ${RADIUS.menu} overflow-hidden ${SHADOW.overlay}`,
  shellShadowXl: `${SURFACE.raised} ${RADIUS.menu} overflow-hidden ${SHADOW.modal}`,
  anchoredRaised: `${SHADOW.raised} ring-1 ring-ring-subtle`,
} as const;

export const MENU_ITEM = {
  base: `${SURFACE.raised} ${RADIUS.menuItem} border border-border-default`,
  interactive:
    'hover:border-border-strong transition-colors duration-200 cursor-pointer',
} as const;
