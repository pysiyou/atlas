/**
 * Validation Decision - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const VALIDATION_DECISION_VALUES = ['approve', 'reject'] as const;

// 2. TYPE - Derived from values
export type ValidationDecision = (typeof VALIDATION_DECISION_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const VALIDATION_DECISION_CONFIG: Record<ValidationDecision, { label: string }> = {
  approve: { label: 'Approve' },
  reject: { label: 'Reject' },
};

// 4. OPTIONS - For dropdowns/selects
export const VALIDATION_DECISION_OPTIONS = VALIDATION_DECISION_VALUES.map(value => ({
  value,
  label: VALIDATION_DECISION_CONFIG[value].label,
}));
