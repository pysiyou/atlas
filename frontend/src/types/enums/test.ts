export const TEST_STATUS_VALUES = [
  'pending',
  'sample-collected',
  'in-progress',
  'resulted',
  'validated',
  'rejected',
  'escalated',
  'superseded',
  'removed',
] as const;

export type TestStatus = (typeof TEST_STATUS_VALUES)[number];

export const TEST_STATUS_CONFIG: Record<TestStatus, { label: string }> = {
  pending: { label: 'Pending' },
  'sample-collected': { label: 'Sample Collected' },
  'in-progress': { label: 'In Progress' },
  resulted: { label: 'Resulted' },
  validated: { label: 'Validated' },
  rejected: { label: 'Rejected' },
  escalated: { label: 'Escalated' },
  superseded: { label: 'Superseded' },
  removed: { label: 'Removed' },
};

/**
 * Simplified display status for user-facing UI
 * Maps 9 internal states to 5 user-friendly categories
 */
export const DISPLAY_STATUS_VALUES = [
  'awaiting-collection',
  'ready-for-results',
  'awaiting-validation',
  'completed',
  'attention-needed',
] as const;

export type DisplayStatus = (typeof DISPLAY_STATUS_VALUES)[number];

export const DISPLAY_STATUS_CONFIG: Record<DisplayStatus, { label: string; variant: string }> = {
  'awaiting-collection': { label: 'Awaiting Collection', variant: 'pending' },
  'ready-for-results': { label: 'Ready for Results', variant: 'info' },
  'awaiting-validation': { label: 'Awaiting Validation', variant: 'warning' },
  'completed': { label: 'Completed', variant: 'success' },
  'attention-needed': { label: 'Attention Needed', variant: 'danger' },
};

/**
 * Map internal test status to simplified display status
 */
export function getDisplayStatus(status: TestStatus): DisplayStatus {
  switch (status) {
    case 'pending':
      return 'awaiting-collection';
    case 'sample-collected':
    case 'in-progress':
      return 'ready-for-results';
    case 'resulted':
      return 'awaiting-validation';
    case 'validated':
      return 'completed';
    case 'rejected':
    case 'escalated':
    case 'superseded':
      return 'attention-needed';
    case 'removed':
      return 'attention-needed';
    default:
      return 'attention-needed';
  }
}

/**
 * Get display label for a test status (uses simplified display status)
 */
export function getTestStatusDisplayLabel(status: TestStatus): string {
  const displayStatus = getDisplayStatus(status);
  return DISPLAY_STATUS_CONFIG[displayStatus].label;
}

/**
 * Get variant for a test status badge (uses simplified display status)
 */
export function getTestStatusVariant(status: TestStatus): string {
  const displayStatus = getDisplayStatus(status);
  return DISPLAY_STATUS_CONFIG[displayStatus].variant;
}

export const TEST_STATUS_OPTIONS = TEST_STATUS_VALUES.map(value => ({
  value,
  label: TEST_STATUS_CONFIG[value].label,
}));

export const TEST_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...TEST_STATUS_OPTIONS,
];

/**
 * Simplified filter options using display statuses
 */
export const DISPLAY_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...DISPLAY_STATUS_VALUES.map(value => ({
    value,
    label: DISPLAY_STATUS_CONFIG[value].label,
  })),
];
