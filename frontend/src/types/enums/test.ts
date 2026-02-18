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

export const TEST_STATUS_OPTIONS = TEST_STATUS_VALUES.map(value => ({
  value,
  label: TEST_STATUS_CONFIG[value].label,
}));

export const TEST_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...TEST_STATUS_OPTIONS,
];
