/**
 * Title presets for {@link DetailPageLoadingGrid} on patient and order detail routes.
 */

export const PATIENT_DETAIL_LOADING_GRID = {
  topTitles: ['General Info', 'Medical History', 'Care Snapshot'] as const,
  bottomLeftTitle: 'Related Orders',
  bottomRightTitle: 'Reports',
};

export const ORDER_DETAIL_LOADING_GRID = {
  topTitles: ['Order Information', 'Patient Information', 'Order activity'] as const,
  bottomLeftTitle: 'Tests',
  bottomRightTitle: 'Billing Summary',
};
