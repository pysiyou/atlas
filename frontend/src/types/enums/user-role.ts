/**
 * User Role - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const USER_ROLE_VALUES = [
  'receptionist',
  'lab-technician',
  'pathologist',
  'administrator',
] as const;

// 2. TYPE - Derived from values
export type UserRole = (typeof USER_ROLE_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const USER_ROLE_CONFIG: Record<
  UserRole,
  { label: string; description: string; color: string }
> = {
  receptionist: {
    label: 'Receptionist',
    description: 'Front desk and patient registration',
    color: 'blue',
  },
  'lab-technician': {
    label: 'Lab Technician',
    description: 'Sample collection and processing',
    color: 'green',
  },
  pathologist: {
    label: 'Pathologist',
    description: 'Result validation and diagnosis',
    color: 'purple',
  },
  administrator: {
    label: 'Administrator',
    description: 'Full system access',
    color: 'red',
  },
};

// 4. OPTIONS - For dropdowns/selects
export const USER_ROLE_OPTIONS = USER_ROLE_VALUES.map((value) => ({
  value,
  label: USER_ROLE_CONFIG[value].label,
}));

// 5. Helper to check if a role has access
export const ALL_ROLES = [...USER_ROLE_VALUES] as UserRole[];
