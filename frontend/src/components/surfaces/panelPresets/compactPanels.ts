import type { PanelPresetDefinition } from './types';

const COMPACT: Pick<PanelPresetDefinition, 'variant'> = { variant: 'compact' };

const RESULTS_CHROME: Pick<PanelPresetDefinition, 'variant' | 'scroll' | 'bodyLayout' | 'maxHeightClass'> = {
  variant: 'compact',
  scroll: 'auto',
  bodyLayout: 'minH0',
  maxHeightClass: 'max-h-[min(32rem,65vh)]',
};

export const compactPanelPresets = {
  'compact.modal.requiredFor': {
    title: 'Required for',
    ...COMPACT,
  },
  'compact.modal.rejectionDetails': {
    title: 'Rejection Details',
    ...COMPACT,
  },
  'compact.modal.collectionNotes': {
    title: 'Collection Notes',
    ...COMPACT,
  },
  'compact.modal.collectionRequirementsInstructions': {
    title: 'Collection Requirements & Instructions',
    ...COMPACT,
  },
  'compact.modal.resultEntry': {
    title: 'Result Entry',
    ...COMPACT,
  },
  'compact.modal.resultValidation': {
    title: 'Result Validation',
    ...RESULTS_CHROME,
  },
  'compact.modal.recordedResults': {
    title: 'Recorded Results',
    ...RESULTS_CHROME,
  },
  'compact.modal.escalationSummary': {
    title: 'Escalation Summary',
    ...COMPACT,
  },
  'compact.modal.criticalValueNotification': {
    title: 'Critical Value Notification',
    ...COMPACT,
  },
  'compact.modal.relatedSamples': {
    title: 'Related samples',
    variant: 'compact',
    shellLayout: 'fullWidth',
  },
  'compact.modal.testParameters': {
    title: 'Test Parameters',
    ...COMPACT,
  },
  'compact.modal.testInformation': {
    title: 'Test Information',
    ...COMPACT,
  },
  'compact.modal.collectionDetails': {
    title: 'Collection Details',
    ...COMPACT,
  },
  'compact.modal.volumeTracking': {
    title: 'Volume Tracking',
    ...COMPACT,
  },
  'compact.modal.collectionRequirements': {
    title: 'Collection Requirements',
    ...COMPACT,
  },
  'compact.modal.workflow': {
    title: 'Workflow',
    ...COMPACT,
  },
  'compact.modal.testOverview': {
    title: 'Test overview',
    ...COMPACT,
  },
  'compact.modal.collectionInformation': {
    title: 'Collection Information',
    ...COMPACT,
  },
  'compact.modal.resultEntryInformation': {
    title: 'Result Entry Information',
    ...COMPACT,
  },
  'lab.monitor.today': {
    title: 'Today',
    variant: 'pageEmbed',
    bodyLayout: 'flexColumnFill',
  },
  'lab.monitor.attention': {
    title: 'Attention queue',
    variant: 'pageEmbed',
  },
  'lab.monitor.ordersTable': {
    title: '',
    variant: 'pageEmbed',
    hideHeader: true,
    shellLayout: 'detailFill',
    bodyLayout: 'embedFlexFill',
  },
  'lab.monitor.criticalValues': {
    title: 'Critical Values',
    ...COMPACT,
  },
  'lab.monitor.criticalValuesPending': {
    title: 'Critical Values Pending',
    ...COMPACT,
  },
} as const satisfies Record<string, PanelPresetDefinition>;
