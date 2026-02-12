export const GENDER_VALUES = ['male', 'female'] as const;

export type Gender = (typeof GENDER_VALUES)[number];

export const GENDER_CONFIG: Record<Gender, { label: string; icon?: string }> = {
  male: { label: 'Male', icon: '♂' },
  female: { label: 'Female', icon: '♀' },
};

export const GENDER_OPTIONS = GENDER_VALUES.map(value => ({
  value,
  label: GENDER_CONFIG[value].label,
}));

export const GENDER_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Genders' },
  ...GENDER_OPTIONS,
];
