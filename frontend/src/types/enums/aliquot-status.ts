/**
 * Aliquot Status - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const ALIQUOT_STATUS_VALUES = [
  'pending',
  'prepared',
  'stored',
  'shipped',
  'discarded',
] as const;

// 2. TYPE - Derived from values
export type AliquotStatus = (typeof ALIQUOT_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const ALIQUOT_STATUS_CONFIG: Record<AliquotStatus, { label: string }> = {
  pending: { label: 'Pending' },
  prepared: { label: 'Prepared' },
  stored: { label: 'Stored' },
  shipped: { label: 'Shipped' },
  discarded: { label: 'Discarded' },
};

// 4. OPTIONS - For dropdowns/selects
export const ALIQUOT_STATUS_OPTIONS = ALIQUOT_STATUS_VALUES.map(value => ({
  value,
  label: ALIQUOT_STATUS_CONFIG[value].label,
}));
