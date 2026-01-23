/**
 * Rejection Reason - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const REJECTION_REASON_VALUES = [
  'hemolyzed',
  'clotted',
  'qns',
  'wrong_container',
  'labeling_error',
  'transport_delay',
  'contaminated',
  'lipemic',
  'icteric',
  'other',
] as const;

// 2. TYPE - Derived from values
export type RejectionReason = (typeof REJECTION_REASON_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const REJECTION_REASON_CONFIG: Record<
  RejectionReason,
  { label: string; description: string }
> = {
  hemolyzed: { label: 'Hemolyzed', description: 'Blood breakdown detected' },
  clotted: { label: 'Clotted', description: 'Sample clotted when it should not have' },
  qns: { label: 'QNS', description: 'Quantity Not Sufficient' },
  wrong_container: { label: 'Wrong Container', description: 'Incorrect tube type used' },
  labeling_error: { label: 'Labeling Error', description: 'Missing or incorrect label' },
  transport_delay: { label: 'Transport Delay', description: 'Exceeded maximum transport time' },
  contaminated: { label: 'Contaminated', description: 'Visible contamination present' },
  lipemic: { label: 'Lipemic', description: 'Lipemic serum detected' },
  icteric: { label: 'Icteric', description: 'Jaundiced sample' },
  other: { label: 'Other', description: 'Other rejection reason' },
};

// 4. OPTIONS - For dropdowns/selects
export const REJECTION_REASON_OPTIONS = REJECTION_REASON_VALUES.map(value => ({
  value,
  label: REJECTION_REASON_CONFIG[value].label,
  description: REJECTION_REASON_CONFIG[value].description,
}));
