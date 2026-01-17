/**
 * Sample Status - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const SAMPLE_STATUS_VALUES = ['pending', 'collected', 'rejected'] as const;

// 2. TYPE - Derived from values
export type SampleStatus = (typeof SAMPLE_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'warning' },
  collected: { label: 'Collected', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
};

// 4. CSS COLORS - For badges/styling
export const SAMPLE_STATUS_COLORS: Record<SampleStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  collected: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

// 5. OPTIONS - For dropdowns/selects
export const SAMPLE_STATUS_OPTIONS = SAMPLE_STATUS_VALUES.map((value) => ({
  value,
  label: SAMPLE_STATUS_CONFIG[value].label,
}));

// 6. FILTER OPTIONS - With "all" option
export const SAMPLE_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...SAMPLE_STATUS_OPTIONS,
];
