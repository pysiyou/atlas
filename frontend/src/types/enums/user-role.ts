/**
 * User Role - Single Source of Truth
 *
 * Note: Badge colors for user roles are defined in the Badge component.
 * Use the role value directly as the Badge variant (e.g., variant="receptionist").
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

// 3. CONFIG - Metadata for each value (label and description only, colors handled by Badge)
export const USER_ROLE_CONFIG: Record<UserRole, { label: string; description: string }> = {
  receptionist: {
    label: 'Receptionist',
    description: 'Front desk and patient registration',
  },
  'lab-technician': {
    label: 'Lab Technician',
    description: 'Sample collection and processing',
  },
  pathologist: {
    label: 'Pathologist',
    description: 'Result validation and diagnosis',
  },
  administrator: {
    label: 'Administrator',
    description: 'Full system access',
  },
};

// 4. OPTIONS - For dropdowns/selects
export const USER_ROLE_OPTIONS = USER_ROLE_VALUES.map(value => ({
  value,
  label: USER_ROLE_CONFIG[value].label,
}));

// 5. Helper to check if a role has access
export const ALL_ROLES = [...USER_ROLE_VALUES] as UserRole[];
