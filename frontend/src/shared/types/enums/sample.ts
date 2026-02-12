export const SAMPLE_STATUS_VALUES = [
  'pending',
  'collected',
  'received',
  'accessioned',
  'in-progress',
  'completed',
  'stored',
  'disposed',
  'rejected',
] as const;

export type SampleStatus = (typeof SAMPLE_STATUS_VALUES)[number];

export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, { label: string }> = {
  pending: { label: 'Pending' },
  collected: { label: 'Collected' },
  received: { label: 'Received' },
  accessioned: { label: 'Accessioned' },
  'in-progress': { label: 'In Progress' },
  completed: { label: 'Completed' },
  stored: { label: 'Stored' },
  disposed: { label: 'Disposed' },
  rejected: { label: 'Rejected' },
};

export const SAMPLE_STATUS_OPTIONS = SAMPLE_STATUS_VALUES.map(value => ({
  value,
  label: SAMPLE_STATUS_CONFIG[value].label,
}));

export const SAMPLE_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...SAMPLE_STATUS_OPTIONS,
];

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

export type SampleType = (typeof SAMPLE_TYPE_VALUES)[number];

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

export const SAMPLE_TYPE_OPTIONS = SAMPLE_TYPE_VALUES.map(value => ({
  value,
  label: SAMPLE_TYPE_CONFIG[value].label,
}));

export const SAMPLE_TYPE_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Sample Types' },
  ...SAMPLE_TYPE_OPTIONS,
];

export const BASE_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  type => !SAMPLE_TYPE_CONFIG[type].isDerived
);

export const DERIVED_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  type => SAMPLE_TYPE_CONFIG[type].isDerived
);
