/**
 * Test Status - Single Source of Truth
 * Aligned with backend enum values
 * 
 * Note: Badge colors for test status are defined in the Badge component.
 * Use the status value directly as the Badge variant (e.g., variant="pending").
 */

// 1. VALUES - The single source of truth (matches backend)
export const TEST_STATUS_VALUES = [
  'pending',
  'sample-collected',
  'in-progress',
  'resulted',     // Results entered, awaiting validation
  'validated',
  'rejected',
  'superseded',   // Original test after retest is created during result validation rejection
] as const;

// 2. TYPE - Derived from values
export type TestStatus = (typeof TEST_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value (label only, colors handled by Badge)
export const TEST_STATUS_CONFIG: Record<TestStatus, { label: string }> = {
  pending: { label: 'Pending' },
  'sample-collected': { label: 'Sample Collected' },
  'in-progress': { label: 'In Progress' },
  resulted: { label: 'Resulted' },
  validated: { label: 'Validated' },
  rejected: { label: 'Rejected' },
  superseded: { label: 'Superseded' },
};

// 4. OPTIONS - For dropdowns/selects
export const TEST_STATUS_OPTIONS = TEST_STATUS_VALUES.map((value) => ({
  value,
  label: TEST_STATUS_CONFIG[value].label,
}));

// 5. FILTER OPTIONS - With "all" option
export const TEST_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...TEST_STATUS_OPTIONS,
];
