/**
 * Panel layout preset registry.
 * Style spec: see config/index.ts.
 */
import { SPACING } from '@/theme/recipes';


// =============================================================================
// types
// =============================================================================
export type PanelVariant = 'page' | 'pageEmbed' | 'compact' | 'compactEmbed';
export type PanelScroll = 'default' | 'auto' | 'visible';
export type PanelSpacing = 'none' | 'compact' | 'normal' | 'relaxed';

export type PanelShellLayout =
  | 'default'
  | 'detailShrink'
  | 'detailFill'
  | 'detailMinH'
  | 'gridSpan2'
  | 'gridSpan2Min'
  | 'gridSpan2Fill'
  | 'stackMinHeight'
  | 'fullWidth'
  | 'modalShrink';

export type PanelBodyLayout =
  | 'default'
  | 'formStack'
  | 'flexColumn'
  | 'flexColumnMin'
  | 'flexColumnFill'
  | 'embedFlexFill'
  | 'minH0';

export interface PanelPresetDefinition {
  /** Static header copy. Empty when `headingSlot` or `hideHeader` is set. */
  title: string;
  variant: PanelVariant;
  scroll?: PanelScroll;
  spacing?: PanelSpacing;
  hideHeader?: boolean;
  /** Header start slot supplies the heading (e.g. per-test report preview). */
  headingSlot?: boolean;
  /** Static header caption (right side). Call-site `meta` overrides this. */
  meta?: string;
  shellLayout?: PanelShellLayout;
  bodyLayout?: PanelBodyLayout;
  maxHeightClass?: string;
}


// =============================================================================
// tokens
// =============================================================================
export const PANEL_SHELL_LAYOUT: Record<PanelShellLayout, string> = {
  default: '',
  detailShrink: 'shrink-0',
  detailFill: 'h-full min-h-0',
  detailMinH: 'min-h-0',
  gridSpan2: 'col-span-2',
  gridSpan2Min: 'col-span-2 min-h-0',
  gridSpan2Fill: 'col-span-2 h-full min-h-0',
  stackMinHeight: 'shrink-0 min-h-48',
  fullWidth: 'w-full',
  modalShrink: 'h-auto shrink-0',
};

export const PANEL_BODY_LAYOUT: Record<PanelBodyLayout, string> = {
  default: '',
  formStack: 'space-y-space-6',
  flexColumn: 'flex flex-col',
  flexColumnMin: 'flex flex-col min-h-0',
  flexColumnFill: 'flex min-h-0 flex-1 flex-col overflow-hidden',
  embedFlexFill: 'flex min-h-0 flex-1 flex-col',
  minH0: 'min-h-0',
};

export const PANEL_SPACING: Record<PanelSpacing, string> = {
  none: '',
  compact: SPACING.stackCompact,
  normal: SPACING.stackNormal,
  relaxed: SPACING.stackRelaxed,
};

export const PANEL_SCROLL = {
  auto: 'overflow-y-auto',
  visible: 'overflow-visible',
} as const;


// =============================================================================
// presets
// =============================================================================
const PAGE_VISIBLE: PanelPresetDefinition = {
  title: '',
  variant: 'page',
  scroll: 'visible',
};

const PAGE_VISIBLE_SHRINK: PanelPresetDefinition = {
  ...PAGE_VISIBLE,
  shellLayout: 'detailShrink',
};

const PAGE_AUTO_FILL: PanelPresetDefinition = {
  title: '',
  variant: 'page',
  scroll: 'auto',
  shellLayout: 'detailFill',
  bodyLayout: 'flexColumnFill',
};

const PAGE_EMBED_VISIBLE: PanelPresetDefinition = {
  title: '',
  variant: 'pageEmbed',
  scroll: 'visible',
};

const PAGE_EMBED_AUTO: PanelPresetDefinition = {
  title: '',
  variant: 'pageEmbed',
  scroll: 'auto',
};

const PAGE_FORM: PanelPresetDefinition = {
  title: '',
  variant: 'page',
  scroll: 'visible',
  spacing: 'normal',
};

const COMPACT: PanelPresetDefinition = {
  title: '',
  variant: 'compact',
};

const COMPACT_SCROLL_RESULTS: PanelPresetDefinition = {
  title: '',
  variant: 'compact',
  scroll: 'auto',
  bodyLayout: 'minH0',
  maxHeightClass: 'max-h-[min(32rem,65vh)]',
};

/** Layout-intent panel registry — pass `title` on `<Panel>` for section copy. */
export const layoutPanelPresets = {
  'panel.page.standard': { title: '', variant: 'page' },
  'panel.page.visible': PAGE_VISIBLE,
  'panel.page.visible.shrink': PAGE_VISIBLE_SHRINK,
  'panel.page.auto.fill': PAGE_AUTO_FILL,
  'panel.page.form': PAGE_FORM,
  'panel.page.formHiddenHeader': {
    title: '',
    variant: 'page',
    scroll: 'visible',
    hideHeader: true,
    spacing: 'none',
    bodyLayout: 'formStack',
  },
  'panel.pageEmbed.visible': PAGE_EMBED_VISIBLE,
  'panel.pageEmbed.visible.shrink': {
    ...PAGE_EMBED_VISIBLE,
    shellLayout: 'detailShrink',
  },
  'panel.pageEmbed.auto': PAGE_EMBED_AUTO,
  'panel.pageEmbed.auto.fill': {
    ...PAGE_EMBED_AUTO,
    shellLayout: 'detailFill',
  },
  'panel.pageEmbed.auto.fill.flexColumnMin': {
    ...PAGE_EMBED_AUTO,
    shellLayout: 'detailFill',
    bodyLayout: 'flexColumnMin',
  },
  'panel.pageEmbed.span2': {
    ...PAGE_EMBED_VISIBLE,
    shellLayout: 'gridSpan2',
  },
  'panel.pageEmbed.span2Fill': {
    ...PAGE_EMBED_AUTO,
    shellLayout: 'gridSpan2Fill',
    bodyLayout: 'flexColumn',
  },
  'panel.pageEmbed.visible.flexColumn': {
    ...PAGE_EMBED_VISIBLE,
    bodyLayout: 'flexColumn',
  },
  'panel.pageEmbed.visible.shrink.flexColumn': {
    ...PAGE_EMBED_VISIBLE,
    shellLayout: 'detailShrink',
    bodyLayout: 'flexColumn',
  },
  'panel.pageEmbed.auto.fill.flexColumn': {
    ...PAGE_EMBED_AUTO,
    shellLayout: 'detailFill',
    bodyLayout: 'flexColumn',
  },
  'panel.pageEmbed.stackMinHeight': {
    ...PAGE_EMBED_VISIBLE,
    shellLayout: 'stackMinHeight',
  },
  'panel.pageEmbed.modalShrink.flexColumn': {
    title: '',
    variant: 'pageEmbed',
    scroll: 'visible',
    shellLayout: 'modalShrink',
    bodyLayout: 'flexColumn',
  },
  'panel.pageEmbed.flexColumnFill': {
    title: '',
    variant: 'pageEmbed',
    bodyLayout: 'flexColumnFill',
  },
  'panel.pageEmbed.standard': PAGE_EMBED_AUTO,
  'panel.pageEmbed.flushHeader': {
    title: '',
    variant: 'pageEmbed',
    hideHeader: true,
    shellLayout: 'detailFill',
    bodyLayout: 'embedFlexFill',
  },
  'panel.pageEmbed.span2Min': {
    ...PAGE_EMBED_AUTO,
    shellLayout: 'gridSpan2Min',
  },
  'panel.page.detailMinH.flexColumn': {
    title: '',
    variant: 'page',
    scroll: 'auto',
    shellLayout: 'detailMinH',
    bodyLayout: 'flexColumn',
  },
  'panel.page.visible.span2': {
    ...PAGE_VISIBLE,
    shellLayout: 'gridSpan2',
  },
  'panel.page.visible.flexColumn': {
    ...PAGE_VISIBLE,
    bodyLayout: 'flexColumn',
  },
  'panel.page.visible.shrink.flexColumn': {
    ...PAGE_VISIBLE_SHRINK,
    bodyLayout: 'flexColumn',
  },
  'panel.compact.standard': COMPACT,
  'panel.compact.scrollAuto.maxH': COMPACT_SCROLL_RESULTS,
  'panel.compact.fullWidth': {
    ...COMPACT,
    shellLayout: 'fullWidth',
  },
  'panel.compact.headingSlot': {
    title: '',
    variant: 'compact',
    headingSlot: true,
  },
  'panel.compactEmbed.auto': {
    title: '',
    variant: 'compactEmbed',
    scroll: 'auto',
  },
} as const satisfies Record<string, PanelPresetDefinition>;


// =============================================================================
// registry
// =============================================================================
export const PANEL_PRESETS = layoutPanelPresets;

export type PanelPresetId = keyof typeof layoutPanelPresets;

export function getPanelPreset(preset: PanelPresetId): PanelPresetDefinition {
  return layoutPanelPresets[preset];
}

