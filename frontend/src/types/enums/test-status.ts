/**
 * Test Status - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const TEST_STATUS_VALUES = [
  'ordered',
  'collected',
  'in-progress',
  'completed',
  'validated',
  'reported',
] as const;

// 2. TYPE - Derived from values
export type TestStatus = (typeof TEST_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const TEST_STATUS_CONFIG: Record<TestStatus, { label: string; color: string }> = {
  ordered: { label: 'Ordered', color: 'info' },
  collected: { label: 'Collected', color: 'teal' },
  'in-progress': { label: 'In Progress', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  validated: { label: 'Validated', color: 'purple' },
  reported: { label: 'Reported', color: 'gray' },
};

// 4. CSS COLORS - For badges/styling
export const TEST_STATUS_COLORS: Record<TestStatus, string> = {
  ordered: 'bg-blue-100 text-blue-800',
  collected: 'bg-teal-100 text-teal-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  validated: 'bg-purple-100 text-purple-800',
  reported: 'bg-gray-100 text-gray-800',
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
