/** Duration in months (999 = lifetime). */
export const AFFILIATION_DURATION_VALUES = [1, 3, 6, 12, 999] as const;

export type AffiliationDuration = (typeof AFFILIATION_DURATION_VALUES)[number];

export const AFFILIATION_DURATION_CONFIG: Record<
  AffiliationDuration,
  { label: string }
> = {
  1: { label: '1 Month' },
  3: { label: '3 Months' },
  6: { label: '6 Months' },
  12: { label: '1 Year' },
  999: { label: 'Lifetime' },
};

export const AFFILIATION_DURATION_OPTIONS = AFFILIATION_DURATION_VALUES.map(value => ({
  value,
  label: AFFILIATION_DURATION_CONFIG[value].label,
}));
