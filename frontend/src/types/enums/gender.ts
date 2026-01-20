/**
 * Gender - Single Source of Truth
 * 
 * Note: Badge colors for gender are defined in the Badge component.
 * Use the gender value directly as the Badge variant (e.g., variant="male").
 */

// 1. VALUES - The single source of truth
export const GENDER_VALUES = ['male', 'female', 'other'] as const;

// 2. TYPE - Derived from values
export type Gender = (typeof GENDER_VALUES)[number];

// 3. CONFIG - Metadata for each value (label only, colors handled by Badge)
export const GENDER_CONFIG: Record<Gender, { label: string }> = {
  male: { label: 'Male' },
  female: { label: 'Female' },
  other: { label: 'Other' },
};

// 4. OPTIONS - For dropdowns/selects
export const GENDER_OPTIONS = GENDER_VALUES.map((value) => ({
  value,
  label: GENDER_CONFIG[value].label,
}));

// 5. FILTER OPTIONS - With "all" option
export const GENDER_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Sex' },
  ...GENDER_OPTIONS,
];
