/** GENERATED — source: contracts/enums. UI config preserved during migration. DO NOT EDIT BY HAND. */
/**
 * Rejection Reason Enum - Aligned with backend
 * 
 * Must match backend/app/schemas/enums.py RejectionReason exactly
 */
export const REJECTION_REASON_VALUES = [
  'hemolyzed',
  'clotted',
  'qns', // Quantity Not Sufficient
  'wrong_container',
  'labeling_error',
  'transport_delay',
  'contaminated',
  'lipemic',
  'icteric',
  'other',
] as const;

export type RejectionReason = (typeof REJECTION_REASON_VALUES)[number];

export const REJECTION_REASON_CONFIG: Record<
  RejectionReason,
  { label: string; description: string }
> = {
  hemolyzed: { label: 'Hemolyzed', description: 'Red blood cell breakdown detected' },
  clotted: { label: 'Clotted', description: 'Sample clotted when anticoagulant was required' },
  qns: { label: 'Quantity Not Sufficient (QNS)', description: 'Insufficient volume for testing' },
  wrong_container: { label: 'Wrong Container', description: 'Collected in incorrect tube type' },
  labeling_error: { label: 'Labeling Error', description: 'Missing or incorrect patient identification' },
  transport_delay: { label: 'Transport Delay', description: 'Exceeded acceptable transport time' },
  contaminated: { label: 'Contaminated', description: 'Visible contamination present' },
  lipemic: { label: 'Lipemic', description: 'Lipemia detected (fatty/milky appearance)' },
  icteric: { label: 'Icteric', description: 'Icterus detected (yellowish discoloration)' },
  other: { label: 'Other', description: 'Other reason (specify in notes)' },
};

export const REJECTION_REASON_OPTIONS = REJECTION_REASON_VALUES.map(value => ({
  value,
  label: REJECTION_REASON_CONFIG[value].label,
}));
