export const REJECTION_REASON_VALUES = [
  'insufficient-volume',
  'hemolyzed',
  'clotted',
  'contaminated',
  'mislabeled',
  'expired',
  'wrong-container',
  'damaged-container',
  'incorrect-storage',
  'other',
] as const;

export type RejectionReason = (typeof REJECTION_REASON_VALUES)[number];

export const REJECTION_REASON_CONFIG: Record<RejectionReason, { label: string }> = {
  'insufficient-volume': { label: 'Insufficient Volume' },
  hemolyzed: { label: 'Hemolyzed' },
  clotted: { label: 'Clotted' },
  contaminated: { label: 'Contaminated' },
  mislabeled: { label: 'Mislabeled' },
  expired: { label: 'Expired' },
  'wrong-container': { label: 'Wrong Container' },
  'damaged-container': { label: 'Damaged Container' },
  'incorrect-storage': { label: 'Incorrect Storage' },
  other: { label: 'Other' },
};

export const REJECTION_REASON_OPTIONS = REJECTION_REASON_VALUES.map(value => ({
  value,
  label: REJECTION_REASON_CONFIG[value].label,
}));
