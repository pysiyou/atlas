/** Test status values — aligned with contracts/enums.json */
export const TEST_STATUS_VALUES = [
  'pending',
  'sample-collected',
  'resulted',
  'validated',
  'suspended',
  'cancelled',
  'escalated',
  'superseded',
  'removed',
] as const;

export type TestStatus = (typeof TEST_STATUS_VALUES)[number];

export const TEST_STATUS_CONFIG: Record<TestStatus, { label: string }> = {
  pending: { label: 'Pending' },
  'sample-collected': { label: 'Sample Collected' },
  resulted: { label: 'Resulted' },
  validated: { label: 'Validated' },
  suspended: { label: 'Suspended' },
  cancelled: { label: 'Cancelled' },
  escalated: { label: 'Escalated' },
  superseded: { label: 'Superseded' },
  removed: { label: 'Removed' },
};

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
  completed: { label: 'Completed', variant: 'success' },
  'attention-needed': { label: 'Attention Needed', variant: 'danger' },
};

export function getDisplayStatus(status: TestStatus): DisplayStatus {
  switch (status) {
    case 'pending':
      return 'awaiting-collection';
    case 'sample-collected':
      return 'ready-for-results';
    case 'resulted':
      return 'awaiting-validation';
    case 'validated':
      return 'completed';
    case 'suspended':
    case 'cancelled':
    case 'escalated':
    case 'superseded':
    case 'removed':
      return 'attention-needed';
    default:
      return 'attention-needed';
  }
}

export function getTestStatusDisplayLabel(status: TestStatus): string {
  return DISPLAY_STATUS_CONFIG[getDisplayStatus(status)].label;
}

export function getTestStatusVariant(status: TestStatus): string {
  return DISPLAY_STATUS_CONFIG[getDisplayStatus(status)].variant;
}

export const TEST_STATUS_OPTIONS = TEST_STATUS_VALUES.map(value => ({
  value,
  label: TEST_STATUS_CONFIG[value].label,
}));

export const TEST_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...TEST_STATUS_OPTIONS,
];

export const DISPLAY_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...DISPLAY_STATUS_VALUES.map(value => ({
    value,
    label: DISPLAY_STATUS_CONFIG[value].label,
  })),
];
