/** Panel shells and empty states. */

import { TYPE } from './type';
import { SPACING, RADIUS, SHADOW } from './spacing';
import { SURFACE } from './surface';

export const PANEL_LAYOUT = {
  pageHeader:
    'shrink-0 h-panel-header min-h-panel-header max-h-panel-header px-panel-header-x border-b border-border-default flex items-center gap-space-3 overflow-hidden',
  pageHeaderBetween:
    'shrink-0 h-panel-header min-h-panel-header max-h-panel-header px-panel-header-x border-b border-border-default flex items-center justify-between gap-space-3 overflow-hidden',
  pageBodyPadding: SPACING.pPanel,
  labHeader:
    `shrink-0 ${SPACING.pxLabPanelHeader} ${SPACING.pyLabPanelHeader} border-b border-border-default flex items-center gap-space-2`,
  labHeaderBetween:
    `shrink-0 ${SPACING.pxLabPanelHeader} ${SPACING.pyLabPanelHeader} border-b border-border-default flex items-center justify-between gap-space-2`,
} as const;

/** Shared panel header title — page, lab, and lab modal presets. */
const PANEL_TITLE = `m-0 min-w-0 truncate ${TYPE.panelTitle}`;

/** Right side of panel header — caption (meta) and actions share one cluster. */
const PANEL_HEADER_ASIDE = `flex shrink-0 items-center justify-end ${SPACING.gapInline} min-h-0 max-w-[55%]`;
const PANEL_HEADER_META = TYPE.caption;

const PAGE_PANEL_CHROME = {
  shell: `h-full ${SURFACE.raised} ${RADIUS.field} ${SHADOW.subtle} overflow-hidden flex flex-col`,
  header: PANEL_LAYOUT.pageHeader,
  headerBetween: PANEL_LAYOUT.pageHeaderBetween,
  title: PANEL_TITLE,
  headerLead: `flex min-w-0 flex-1 items-center ${SPACING.gapRelaxed} overflow-hidden`,
  headerAside: PANEL_HEADER_ASIDE,
  meta: PANEL_HEADER_META,
  headerActions: 'contents',
  footer: `shrink-0 border-t border-border-subtle ${SPACING.pPanel}`,
  scrollDefault: 'overflow-hidden',
} as const;

const LAB_PANEL_CHROME = {
  shell: `w-full ${SURFACE.recessed} ${RADIUS.surface} overflow-hidden`,
  header: PANEL_LAYOUT.labHeader,
  headerBetween: PANEL_LAYOUT.labHeaderBetween,
  title: PANEL_TITLE,
  headerLead: `flex min-w-0 flex-1 items-center ${SPACING.gapInline} overflow-hidden`,
  headerAside: PANEL_HEADER_ASIDE,
  meta: PANEL_HEADER_META,
  headerActions: 'contents',
  footer: `shrink-0 border-t border-border-subtle ${SPACING.pLabPanel}`,
  scrollDefault: '',
} as const;

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

export const PANEL_SHELL = {
  page: {
    ...PAGE_PANEL_CHROME,
    body: `flex-1 min-h-0 ${PANEL_LAYOUT.pageBodyPadding}`,
  },
  /** Raised page shell with flush body (embedded tables, feeds). */
  pageEmbed: {
    ...PAGE_PANEL_CHROME,
    body: 'flex-1 min-h-0',
  },
  lab: {
    ...LAB_PANEL_CHROME,
    body: SPACING.pLabPanel,
  },
  /** Lab modal shell with flush body (scoped event log, full-bleed content). */
  labEmbed: {
    ...LAB_PANEL_CHROME,
    body: 'min-w-0',
  },
} as const;

export const PANEL = {
  raised: `${SURFACE.raised} ${RADIUS.surface} overflow-hidden`,
  raisedShadowSm: `${SURFACE.raised} ${RADIUS.surface} overflow-hidden ${SHADOW.subtle}`,
} as const;
