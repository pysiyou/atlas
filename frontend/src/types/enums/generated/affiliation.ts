/** GENERATED — source: contracts/enums.json. DO NOT EDIT BY HAND. */
export const AFFILIATION_DURATION_VALUES = [6, 12, 24] as const;

export type AffiliationDuration = (typeof AFFILIATION_DURATION_VALUES)[number];

export const AFFILIATION_DURATION_CONFIG: Record<AffiliationDuration, { label: string }> = {
  6: { label: "6 Months" },
  12: { label: "1 Year" },
  24: { label: "2 Years" },
};

export const AFFILIATION_DURATION_OPTIONS = AFFILIATION_DURATION_VALUES.map(value => ({
  value,
  label: AFFILIATION_DURATION_CONFIG[value].label,
}));
