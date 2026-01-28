/**
 * Result Status - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const RESULT_STATUS_VALUES = [
  'normal',
  'high',
  'low',
  'critical',
  'critical-high',
  'critical-low',
] as const;

// 2. TYPE - Derived from values
export type ResultStatus = (typeof RESULT_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const RESULT_STATUS_CONFIG: Record<ResultStatus, { label: string }> = {
  normal: { label: 'Normal' },
  high: { label: 'High' },
  low: { label: 'Low' },
  critical: { label: 'Critical' },
  'critical-high': { label: 'Critical High' },
  'critical-low': { label: 'Critical Low' },
};

// 4. OPTIONS - For dropdowns/selects
export const RESULT_STATUS_OPTIONS = RESULT_STATUS_VALUES.map(value => ({
  value,
  label: RESULT_STATUS_CONFIG[value].label,
}));
