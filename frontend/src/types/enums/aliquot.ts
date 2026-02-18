export const ALIQUOT_STATUS_VALUES = [
  'pending',
  'created',
  'in-use',
  'stored',
  'disposed',
  'depleted',
] as const;

export type AliquotStatus = (typeof ALIQUOT_STATUS_VALUES)[number];

export const ALIQUOT_STATUS_CONFIG: Record<AliquotStatus, { label: string }> = {
  pending: { label: 'Pending' },
  created: { label: 'Created' },
  'in-use': { label: 'In Use' },
  stored: { label: 'Stored' },
  disposed: { label: 'Disposed' },
  depleted: { label: 'Depleted' },
};

export const ALIQUOT_STATUS_OPTIONS = ALIQUOT_STATUS_VALUES.map(value => ({
  value,
  label: ALIQUOT_STATUS_CONFIG[value].label,
}));
