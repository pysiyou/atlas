/**
 * Test Status - Single Source of Truth
 * Aligned with backend enum values
 */

// 1. VALUES - The single source of truth (matches backend)
export const TEST_STATUS_VALUES = [
  'pending',
  'sample-collected',
  'in-progress',
  'completed',
  'validated',
  'rejected',
] as const;

// 2. TYPE - Derived from values
export type TestStatus = (typeof TEST_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const TEST_STATUS_CONFIG: Record<TestStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'info' },
  'sample-collected': { label: 'Sample Collected', color: 'teal' },
  'in-progress': { label: 'In Progress', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  validated: { label: 'Validated', color: 'purple' },
  rejected: { label: 'Rejected', color: 'error' },
};

// 4. CSS COLORS - For badges/styling
export const TEST_STATUS_COLORS: Record<TestStatus, string> = {
  pending: 'bg-blue-100 text-blue-800',
  'sample-collected': 'bg-teal-100 text-teal-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  validated: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
};

// 5. OPTIONS - For dropdowns/selects
export const TEST_STATUS_OPTIONS = TEST_STATUS_VALUES.map((value) => ({
  value,
  label: TEST_STATUS_CONFIG[value].label,
}));

// 6. FILTER OPTIONS - With "all" option
export const TEST_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...TEST_STATUS_OPTIONS,
];
