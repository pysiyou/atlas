import type { PanelPresetDefinition } from './types';

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
