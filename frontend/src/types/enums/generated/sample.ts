/** GENERATED — source: contracts/enums. UI config preserved during migration. DO NOT EDIT BY HAND. */
/**
 * Sample Status Enum - Simplified
 * 
 * Only includes actively used states in the lab workflow:
 * - PENDING: Awaiting collection from patient
 * - COLLECTED: Sample collected and ready for testing
 * - REJECTED: Sample failed quality checks (terminal - recollection creates new sample)
 */
export const SAMPLE_STATUS_VALUES = [
  'pending',
  'collected',
  'rejected',
] as const;

export type SampleStatus = (typeof SAMPLE_STATUS_VALUES)[number];

export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, { label: string }> = {
  pending: { label: 'Pending' },
  collected: { label: 'Collected' },
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

/**
 * Sample Type Enum - Aligned with backend
 * 
 * Must match backend/app/schemas/enums.py SampleType exactly
 */
export const SAMPLE_TYPE_VALUES = [
  'blood',
  'urine',
  'stool',
  'saliva',
  'swab',
  'tissue',
  'sputum',
  'csf',
  'pleural_fluid',
  'serum',
  'plasma',
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
  saliva: { label: 'Saliva', isDerived: false },
  swab: { label: 'Swab', isDerived: false },
  tissue: { label: 'Tissue', isDerived: false },
  sputum: { label: 'Sputum', isDerived: false },
  csf: { label: 'CSF', isDerived: false },
  pleural_fluid: { label: 'Pleural Fluid', isDerived: false },
  serum: { label: 'Serum', isDerived: true, collectionSource: 'blood' },
  plasma: { label: 'Plasma', isDerived: true, collectionSource: 'blood' },
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
