/** GENERATED — source: contracts/enums.json. DO NOT EDIT BY HAND. */
export const VALIDATION_DECISION_VALUES = ['approved'] as const;

export type ValidationDecision = (typeof VALIDATION_DECISION_VALUES)[number];

export const VALIDATION_DECISION_CONFIG: Record<ValidationDecision, { label: string }> = {
  approved: { label: 'Approved' },
};

export const VALIDATION_DECISION_OPTIONS = VALIDATION_DECISION_VALUES.map(value => ({
  value,
  label: VALIDATION_DECISION_CONFIG[value].label,
}));
