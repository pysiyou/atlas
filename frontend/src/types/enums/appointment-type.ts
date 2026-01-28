/**
 * Appointment Type - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const APPOINTMENT_TYPE_VALUES = [
  'sample-collection',
  'consultation',
  'follow-up',
] as const;

// 2. TYPE - Derived from values
export type AppointmentType = (typeof APPOINTMENT_TYPE_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const APPOINTMENT_TYPE_CONFIG: Record<AppointmentType, { label: string; description: string }> = {
  'sample-collection': { label: 'Sample Collection', description: 'Appointment for sample collection' },
  consultation: { label: 'Consultation', description: 'Medical consultation appointment' },
  'follow-up': { label: 'Follow-up', description: 'Follow-up appointment' },
};

// 4. OPTIONS - For dropdowns/selects
export const APPOINTMENT_TYPE_OPTIONS = APPOINTMENT_TYPE_VALUES.map(value => ({
  value,
  label: APPOINTMENT_TYPE_CONFIG[value].label,
  description: APPOINTMENT_TYPE_CONFIG[value].description,
}));
