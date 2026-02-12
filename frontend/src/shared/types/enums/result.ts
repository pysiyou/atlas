export const RESULT_STATUS_VALUES = [
  'normal',
  'high',
  'low',
  'critical',
  'critical-high',
  'critical-low',
] as const;

export type ResultStatus = (typeof RESULT_STATUS_VALUES)[number];

export const RESULT_STATUS_CONFIG: Record<ResultStatus, { label: string }> = {
  normal: { label: 'Normal' },
  high: { label: 'High' },
  low: { label: 'Low' },
  critical: { label: 'Critical' },
  'critical-high': { label: 'Critical High' },
  'critical-low': { label: 'Critical Low' },
};

export const RESULT_STATUS_OPTIONS = RESULT_STATUS_VALUES.map(value => ({
  value,
  label: RESULT_STATUS_CONFIG[value].label,
}));
