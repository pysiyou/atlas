/**
 * Appointment Status - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const APPOINTMENT_STATUS_VALUES = [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no-show',
] as const;

// 2. TYPE - Derived from values
export type AppointmentStatus = (typeof APPOINTMENT_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, { label: string }> = {
  scheduled: { label: 'Scheduled' },
  confirmed: { label: 'Confirmed' },
  completed: { label: 'Completed' },
  cancelled: { label: 'Cancelled' },
  'no-show': { label: 'No Show' },
};

// 4. OPTIONS - For dropdowns/selects
export const APPOINTMENT_STATUS_OPTIONS = APPOINTMENT_STATUS_VALUES.map(value => ({
  value,
  label: APPOINTMENT_STATUS_CONFIG[value].label,
}));
