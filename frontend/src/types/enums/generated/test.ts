/** Test status values — aligned with contracts/enums.json */
export const TEST_STATUS_VALUES = [
  'pending',
  'sample-collected',
  'resulted',
  'validated',
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
  cancelled: { label: 'Cancelled' },
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
