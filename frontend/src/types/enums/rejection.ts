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

export const REJECTION_REASON_CONFIG: Record<RejectionReason, { label: string }> = {
  hemolyzed: { label: 'Hemolyzed' },
  clotted: { label: 'Clotted' },
  qns: { label: 'Quantity Not Sufficient (QNS)' },
  wrong_container: { label: 'Wrong Container' },
  labeling_error: { label: 'Labeling Error' },
  transport_delay: { label: 'Transport Delay' },
  contaminated: { label: 'Contaminated' },
  lipemic: { label: 'Lipemic' },
  icteric: { label: 'Icteric' },
  other: { label: 'Other' },
};

export const REJECTION_REASON_OPTIONS = REJECTION_REASON_VALUES.map(value => ({
  value,
  label: REJECTION_REASON_CONFIG[value].label,
}));
