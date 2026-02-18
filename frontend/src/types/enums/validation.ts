export const VALIDATION_DECISION_VALUES = ['approved', 'rejected', 'repeat-required'] as const;

export type ValidationDecision = (typeof VALIDATION_DECISION_VALUES)[number];

export const VALIDATION_DECISION_CONFIG: Record<ValidationDecision, { label: string }> = {
  approved: { label: 'Approved' },
  rejected: { label: 'Rejected' },
  'repeat-required': { label: 'Repeat Required' },
};

export const VALIDATION_DECISION_OPTIONS = VALIDATION_DECISION_VALUES.map(value => ({
  value,
  label: VALIDATION_DECISION_CONFIG[value].label,
}));
