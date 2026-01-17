/**
 * Gender - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const GENDER_VALUES = ['male', 'female', 'other'] as const;

// 2. TYPE - Derived from values
export type Gender = (typeof GENDER_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const GENDER_CONFIG: Record<Gender, { label: string; color: string }> = {
  male: { label: 'Male', color: 'primary' },
  female: { label: 'Female', color: 'pink' },
  other: { label: 'Other', color: 'gray' },
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
