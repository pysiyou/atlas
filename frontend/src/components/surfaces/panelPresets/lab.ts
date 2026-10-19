import type { PanelPresetDefinition } from './types';

const LAB: Pick<PanelPresetDefinition, 'variant'> = { variant: 'lab' };

const RESULTS_CHROME: Pick<PanelPresetDefinition, 'variant' | 'scroll' | 'bodyLayout' | 'maxHeightClass'> = {
  variant: 'lab',
  scroll: 'auto',
  bodyLayout: 'minH0',
  maxHeightClass: 'max-h-[min(32rem,65vh)]',
};

export const labPanelPresets = {
  'lab.modal.requiredFor': {
    title: 'Required for',
    ...LAB,
  },
  'lab.modal.rejectionDetails': {
    title: 'Rejection Details',
    ...LAB,
  },
  'lab.modal.collectionNotes': {
    title: 'Collection Notes',
    ...LAB,
  },
  'lab.modal.collectionRequirementsInstructions': {
    title: 'Collection Requirements & Instructions',
    ...LAB,
  },
  'lab.modal.resultEntry': {
    title: 'Result Entry',
    ...LAB,
  },
  'lab.modal.resultValidation': {
    title: 'Result Validation',
    ...RESULTS_CHROME,
  },
  'lab.modal.recordedResults': {
    title: 'Recorded Results',
    ...RESULTS_CHROME,
  },
  'lab.modal.escalationSummary': {
    title: 'Escalation Summary',
    ...LAB,
  },
  'lab.modal.criticalValueNotification': {
    title: 'Critical Value Notification',
    ...LAB,
  },
  'lab.modal.relatedSamples': {
    title: 'Related samples',
    variant: 'lab',
    shellLayout: 'fullWidth',
  },
  'lab.modal.testParameters': {
    title: 'Test Parameters',
    ...LAB,
  },
  'lab.modal.testInformation': {
    title: 'Test Information',
    ...LAB,
  },
  'lab.modal.collectionDetails': {
    title: 'Collection Details',
    ...LAB,
  },
  'lab.modal.volumeTracking': {
    title: 'Volume Tracking',
    ...LAB,
  },
  'lab.modal.collectionRequirements': {
    title: 'Collection Requirements',
    ...LAB,
  },
  'lab.modal.workflow': {
    title: 'Workflow',
    ...LAB,
  },
  'lab.modal.testOverview': {
    title: 'Test overview',
    ...LAB,
  },
  'lab.modal.collectionInformation': {
    title: 'Collection Information',
    ...LAB,
  },
  'lab.modal.resultEntryInformation': {
    title: 'Result Entry Information',
    ...LAB,
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
    ...LAB,
  },
  'lab.monitor.criticalValuesPending': {
    title: 'Critical Values Pending',
    ...LAB,
  },
} as const satisfies Record<string, PanelPresetDefinition>;
