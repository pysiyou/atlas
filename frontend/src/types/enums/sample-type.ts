/**
 * Sample Type - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const SAMPLE_TYPE_VALUES = [
  'blood',
  'urine',
  'stool',
  'swab',
  'tissue',
  'csf',
  'sputum',
  'plasma',
  'serum',
  'other',
] as const;

// 2. TYPE - Derived from values
export type SampleType = (typeof SAMPLE_TYPE_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const SAMPLE_TYPE_CONFIG: Record<
  SampleType,
  { label: string; isDerived: boolean; collectionSource?: SampleType }
> = {
  blood: { label: 'Blood', isDerived: false },
  urine: { label: 'Urine', isDerived: false },
  stool: { label: 'Stool', isDerived: false },
  swab: { label: 'Swab', isDerived: false },
  tissue: { label: 'Tissue', isDerived: false },
  csf: { label: 'CSF', isDerived: false },
  sputum: { label: 'Sputum', isDerived: false },
  plasma: { label: 'Plasma', isDerived: true, collectionSource: 'blood' },
  serum: { label: 'Serum', isDerived: true, collectionSource: 'blood' },
  other: { label: 'Other', isDerived: false },
};

// 4. OPTIONS - For dropdowns/selects
export const SAMPLE_TYPE_OPTIONS = SAMPLE_TYPE_VALUES.map((value) => ({
  value,
  label: SAMPLE_TYPE_CONFIG[value].label,
}));

// 5. FILTER OPTIONS - With "all" option
export const SAMPLE_TYPE_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Sample Types' },
  ...SAMPLE_TYPE_OPTIONS,
];

// 6. Helper to get base sample types (non-derived)
export const BASE_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  (type) => !SAMPLE_TYPE_CONFIG[type].isDerived
);

// 7. Helper to get derived sample types
export const DERIVED_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  (type) => SAMPLE_TYPE_CONFIG[type].isDerived
);
