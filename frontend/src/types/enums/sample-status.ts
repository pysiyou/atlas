/**
 * Sample Status - Single Source of Truth
 * 
 * Note: Badge colors for sample status are defined in the Badge component.
 * Use the status value directly as the Badge variant (e.g., variant="pending").
 */

// 1. VALUES - The single source of truth
export const SAMPLE_STATUS_VALUES = [
  'pending', 
  'collected', 
  'received', 
  'accessioned', 
  'in-progress', 
  'completed', 
  'stored', 
  'disposed', 
  'rejected'
] as const;

// 2. TYPE - Derived from values
export type SampleStatus = (typeof SAMPLE_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value (label only, colors handled by Badge)
export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, { label: string }> = {
  pending: { label: 'Pending' },
  collected: { label: 'Collected' },
  received: { label: 'Received' },
  accessioned: { label: 'Accessioned' },
  'in-progress': { label: 'In Progress' },
  completed: { label: 'Completed' },
  stored: { label: 'Stored' },
  disposed: { label: 'Disposed' },
  rejected: { label: 'Rejected' },
};

// 4. OPTIONS - For dropdowns/selects
export const SAMPLE_STATUS_OPTIONS = SAMPLE_STATUS_VALUES.map((value) => ({
  value,
  label: SAMPLE_STATUS_CONFIG[value].label,
}));

// 5. FILTER OPTIONS - With "all" option
export const SAMPLE_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...SAMPLE_STATUS_OPTIONS,
];
