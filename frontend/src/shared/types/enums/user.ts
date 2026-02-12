export const USER_ROLE_VALUES = [
  'administrator',
  'receptionist',
  'lab-technician',
  'lab-technician-plus',
] as const;

export type UserRole = (typeof USER_ROLE_VALUES)[number];

export const USER_ROLE_CONFIG: Record<UserRole, { label: string; description: string }> = {
  administrator: {
    label: 'Administrator',
    description: 'Full system access',
  },
  receptionist: {
    label: 'Receptionist',
    description: 'Front desk and patient registration',
  },
  'lab-technician': {
    label: 'Lab Technician',
    description: 'Sample collection and processing',
  },
  'lab-technician-plus': {
    label: 'Lab Tech Plus',
    description: 'Extended lab access including result validation',
  },
};

export const USER_ROLE_OPTIONS = USER_ROLE_VALUES.map(value => ({
  value,
  label: USER_ROLE_CONFIG[value].label,
}));

export const ALL_ROLES = [...USER_ROLE_VALUES] as UserRole[];
