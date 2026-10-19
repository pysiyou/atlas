import type { PanelPresetDefinition } from './types';

const DETAIL_PAGE: Pick<PanelPresetDefinition, 'variant' | 'scroll'> = {
  variant: 'page',
  scroll: 'visible',
};

const DETAIL_FILL: Pick<PanelPresetDefinition, 'variant' | 'scroll' | 'shellLayout' | 'bodyLayout'> = {
  variant: 'page',
  scroll: 'auto',
  shellLayout: 'detailFill',
  bodyLayout: 'flexColumnFill',
};

const FORM: Pick<PanelPresetDefinition, 'variant' | 'scroll' | 'spacing'> = {
  variant: 'page',
  scroll: 'visible',
  spacing: 'normal',
};

export const patientPanelPresets = {
  'patient.detail.generalInfo': {
    title: 'General Info',
    ...DETAIL_PAGE,
  },
  'patient.detail.generalInfo.stack': {
    title: 'General Info',
    ...DETAIL_PAGE,
    shellLayout: 'detailShrink',
  },
  'patient.detail.generalInfo.fill': {
    title: 'General Info',
    ...DETAIL_FILL,
  },
  'patient.detail.medicalHistory': {
    title: 'Medical History',
    ...DETAIL_PAGE,
  },
  'patient.detail.medicalHistory.stack': {
    title: 'Medical History',
    ...DETAIL_PAGE,
    shellLayout: 'detailShrink',
  },
  'patient.detail.medicalHistory.fill': {
    title: 'Medical History',
    ...DETAIL_FILL,
  },
  'patient.detail.careSnapshot': {
    title: 'Care Snapshot',
    ...DETAIL_PAGE,
  },
  'patient.detail.careSnapshot.stack': {
    title: 'Care Snapshot',
    ...DETAIL_PAGE,
    shellLayout: 'detailShrink',
  },
  'patient.detail.careSnapshot.span2': {
    title: 'Care Snapshot',
    ...DETAIL_PAGE,
    shellLayout: 'gridSpan2',
  },
  'patient.detail.careSnapshot.fill': {
    title: 'Care Snapshot',
    ...DETAIL_FILL,
  },
  'patient.detail.relatedOrders': {
    title: 'Related Orders',
    variant: 'pageEmbed',
    scroll: 'visible',
  },
  'patient.detail.relatedOrders.stack': {
    title: 'Related Orders',
    variant: 'pageEmbed',
    scroll: 'visible',
    shellLayout: 'detailShrink',
  },
  'patient.detail.relatedOrders.span2Fill': {
    title: 'Related Orders',
    variant: 'pageEmbed',
    scroll: 'auto',
    shellLayout: 'gridSpan2Min',
  },
  'patient.detail.reports': {
    title: 'Reports',
    variant: 'page',
    scroll: 'visible',
    bodyLayout: 'flexColumn',
  },
  'patient.detail.reports.stack': {
    title: 'Reports',
    variant: 'page',
    scroll: 'visible',
    shellLayout: 'detailShrink',
    bodyLayout: 'flexColumn',
  },
  'patient.detail.reports.fill': {
    title: 'Reports',
    variant: 'page',
    scroll: 'auto',
    shellLayout: 'detailMinH',
    bodyLayout: 'flexColumn',
  },
  'patient.form.identityContact': {
    title: 'Identity & Contact',
    ...FORM,
  },
  'patient.form.emergencyContact': {
    title: 'Emergency Contact',
    ...FORM,
  },
  'patient.form.medicalHistory': {
    title: 'History, Conditions & Lifestyle',
    ...FORM,
  },
  'patient.form.vitals': {
    title: 'Measurements',
    meta: 'Fill any vitals you have. Hints show typical ranges.',
    ...FORM,
  },
  'patient.form.affiliation': {
    title: 'Select Your Plan',
    meta: 'Choose a duration and pricing that works for you',
    ...FORM,
  },
} as const satisfies Record<string, PanelPresetDefinition>;
