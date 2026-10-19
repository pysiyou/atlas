import type { PanelPresetDefinition } from './types';

const DETAIL_PAGE: Pick<PanelPresetDefinition, 'variant' | 'scroll'> = {
  variant: 'page',
  scroll: 'visible',
};

const DETAIL_PAGE_FILL: Pick<PanelPresetDefinition, 'variant' | 'scroll' | 'shellLayout'> = {
  variant: 'page',
  scroll: 'auto',
  shellLayout: 'detailFill',
};

const EMBED: Pick<PanelPresetDefinition, 'variant' | 'scroll'> = {
  variant: 'pageEmbed',
  scroll: 'visible',
};

export const orderPanelPresets = {
  'order.detail.information': {
    title: 'Order Information',
    ...DETAIL_PAGE,
  },
  'order.detail.information.stack': {
    title: 'Order Information',
    ...DETAIL_PAGE,
    shellLayout: 'detailShrink',
  },
  'order.detail.information.fill': {
    title: 'Order Information',
    ...DETAIL_PAGE_FILL,
  },
  'order.detail.patient': {
    title: 'Patient Information',
    ...DETAIL_PAGE,
  },
  'order.detail.patient.stack': {
    title: 'Patient Information',
    ...DETAIL_PAGE,
    shellLayout: 'detailShrink',
  },
  'order.detail.patient.fill': {
    title: 'Patient Information',
    ...DETAIL_PAGE_FILL,
  },
  'order.detail.activity': {
    title: 'Order activity',
    ...EMBED,
  },
  'order.detail.activity.stack': {
    title: 'Order activity',
    ...EMBED,
    shellLayout: 'stackMinHeight',
  },
  'order.detail.activity.fill': {
    title: 'Order activity',
    variant: 'pageEmbed',
    scroll: 'auto',
    shellLayout: 'detailFill',
    bodyLayout: 'flexColumnMin',
  },
  'order.detail.tests': {
    title: 'Tests',
    ...EMBED,
  },
  'order.detail.tests.stack': {
    title: 'Tests',
    ...EMBED,
    shellLayout: 'detailShrink',
  },
  'order.detail.tests.span2': {
    title: 'Tests',
    ...EMBED,
    shellLayout: 'gridSpan2',
  },
  'order.detail.tests.span2Fill': {
    title: 'Tests',
    variant: 'pageEmbed',
    scroll: 'auto',
    shellLayout: 'gridSpan2Fill',
    bodyLayout: 'flexColumn',
  },
  'order.detail.billing': {
    title: 'Billing Summary',
    variant: 'pageEmbed',
    scroll: 'visible',
    bodyLayout: 'flexColumn',
  },
  'order.detail.billing.stack': {
    title: 'Billing Summary',
    variant: 'pageEmbed',
    scroll: 'visible',
    shellLayout: 'detailShrink',
    bodyLayout: 'flexColumn',
  },
  'order.detail.billing.fill': {
    title: 'Billing Summary',
    variant: 'pageEmbed',
    scroll: 'auto',
    shellLayout: 'detailFill',
    bodyLayout: 'flexColumn',
  },
  'order.form.upsert': {
    title: '',
    variant: 'page',
    scroll: 'visible',
    hideHeader: true,
    spacing: 'none',
    bodyLayout: 'formStack',
  },
  'order.modal.relatedTests': {
    title: 'Related tests',
    variant: 'lab',
    shellLayout: 'fullWidth',
  },
} as const satisfies Record<string, PanelPresetDefinition>;
