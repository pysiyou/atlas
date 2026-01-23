/**
 * Affiliation Duration - Single Source of Truth
 */

// 1. VALUES - The single source of truth (in months)
export const AFFILIATION_DURATION_VALUES = [1, 3, 6, 12, 24] as const;

// 2. TYPE - Derived from values
export type AffiliationDuration = (typeof AFFILIATION_DURATION_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const AFFILIATION_DURATION_CONFIG: Record<AffiliationDuration, { label: string }> = {
  1: { label: '1 Month' },
  3: { label: '3 Months' },
  6: { label: '6 Months' },
  12: { label: '1 Year' },
  24: { label: '2 Years' },
};

// 4. OPTIONS - For dropdowns/selects
export const AFFILIATION_DURATION_OPTIONS = AFFILIATION_DURATION_VALUES.map(value => ({
  value,
  label: AFFILIATION_DURATION_CONFIG[value].label,
}));
