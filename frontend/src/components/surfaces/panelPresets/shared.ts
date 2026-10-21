import type { PanelPresetDefinition } from './types';

export const dashboardPanelPresets = {
  'dashboard.recentOrders': {
    title: 'Recent Orders',
    variant: 'page',
  },
} as const satisfies Record<string, PanelPresetDefinition>;

export const auditPanelPresets = {
  'audit.eventLog': {
    title: 'Event log',
    variant: 'pageEmbed',
    scroll: 'auto',
  },
  'audit.eventLog.compact': {
    title: 'Event log',
    variant: 'compactEmbed',
    scroll: 'auto',
  },
  'audit.eventLog.monitor': {
    title: 'Event log',
    variant: 'pageEmbed',
    scroll: 'auto',
    shellLayout: 'detailFill',
  },
} as const satisfies Record<string, PanelPresetDefinition>;

export const paymentPanelPresets = {
  'payment.modal.billing': {
    title: 'Billing Summary',
    variant: 'pageEmbed',
    scroll: 'visible',
    shellLayout: 'modalShrink',
    bodyLayout: 'flexColumn',
  },
} as const satisfies Record<string, PanelPresetDefinition>;

export const catalogPanelPresets = {
  'catalog.detail.testOverview': {
    title: 'Test Overview',
    variant: 'pageEmbed',
  },
  'catalog.detail.sampleRequirements': {
    title: 'Sample Requirements',
    variant: 'pageEmbed',
  },
  'catalog.detail.pricingStatus': {
    title: 'Pricing & Status',
    variant: 'pageEmbed',
  },
  'catalog.detail.resultParameters': {
    title: 'Result Parameters',
    variant: 'pageEmbed',
  },
  'catalog.detail.referenceRanges': {
    title: 'Reference Ranges',
    variant: 'pageEmbed',
  },
} as const satisfies Record<string, PanelPresetDefinition>;

export const reportPanelPresets = {
  'report.preview.testResults': {
    title: '',
    variant: 'compact',
    headingSlot: true,
  },
} as const satisfies Record<string, PanelPresetDefinition>;
