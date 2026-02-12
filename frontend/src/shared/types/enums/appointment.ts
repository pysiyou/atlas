export const APPOINTMENT_STATUS_VALUES = [
  'scheduled',
  'confirmed',
  'checked-in',
  'completed',
  'cancelled',
  'no-show',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS_VALUES)[number];

export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, { label: string }> = {
  scheduled: { label: 'Scheduled' },
  confirmed: { label: 'Confirmed' },
  'checked-in': { label: 'Checked In' },
  completed: { label: 'Completed' },
  cancelled: { label: 'Cancelled' },
  'no-show': { label: 'No Show' },
};

export const APPOINTMENT_STATUS_OPTIONS = APPOINTMENT_STATUS_VALUES.map(value => ({
  value,
  label: APPOINTMENT_STATUS_CONFIG[value].label,
}));

export const APPOINTMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...APPOINTMENT_STATUS_OPTIONS,
];

export const APPOINTMENT_TYPE_VALUES = [
  'walk-in',
  'scheduled',
  'follow-up',
  'urgent',
  'routine-checkup',
] as const;

export type AppointmentType = (typeof APPOINTMENT_TYPE_VALUES)[number];

export const APPOINTMENT_TYPE_CONFIG: Record<
  AppointmentType,
  { label: string; description: string }
> = {
  'walk-in': { label: 'Walk-in', description: 'Patient arrived without appointment' },
  scheduled: { label: 'Scheduled', description: 'Pre-scheduled appointment' },
  'follow-up': { label: 'Follow-up', description: 'Follow-up visit' },
  urgent: { label: 'Urgent', description: 'Urgent care needed' },
  'routine-checkup': { label: 'Routine Checkup', description: 'Regular health checkup' },
};

export const APPOINTMENT_TYPE_OPTIONS = APPOINTMENT_TYPE_VALUES.map(value => ({
  value,
  label: APPOINTMENT_TYPE_CONFIG[value].label,
}));

export const APPOINTMENT_TYPE_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Types' },
  ...APPOINTMENT_TYPE_OPTIONS,
];
