/**
 * Demo Configuration - Single Source of Truth
 * Demo mode settings and credentials
 */

import type { UserRole } from '@/types/enums/user-role';

// ============================================
// DEMO CREDENTIALS
// ============================================

export const DEMO_PASSWORD = 'demo123';

export interface DemoUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'USR-001',
    username: 'admin',
    name: 'Dr. Robert Mukendi',
    role: 'administrator',
    email: 'robert@medlab.com',
    phone: '+243 081 234 5678',
  },
  {
    id: 'USR-002',
    username: 'pathologist',
    name: 'Dr. Sarah Kabongo',
    role: 'pathologist',
    email: 'sarah@medlab.com',
    phone: '+243 082 345 6789',
  },
  {
    id: 'USR-003',
    username: 'technician',
    name: 'Jean Tshibangu',
    role: 'lab-technician',
    email: 'jean@medlab.com',
    phone: '+243 083 456 7890',
  },
  {
    id: 'USR-004',
    username: 'technician2',
    name: 'Marie Mwamba',
    role: 'lab-technician',
    email: 'marie@medlab.com',
    phone: '+243 084 567 8901',
  },
  {
    id: 'USR-005',
    username: 'receptionist',
    name: 'Patrick Kalala',
    role: 'receptionist',
    email: 'patrick@medlab.com',
    phone: '+243 085 678 9012',
  },
];

// ============================================
// QUICK LOGIN CREDENTIALS (for login form display)
// ============================================

export const QUICK_LOGIN_OPTIONS = DEMO_USERS.map((user) => ({
  username: user.username,
  name: user.name,
  role: user.role,
}));

// ============================================
// DEMO MODE SETTINGS
// ============================================

export const DEMO_SETTINGS = {
  ENABLED: true,
  SHOW_CREDENTIALS_HINT: true,
  AUTO_SEED_DATA: true,
} as const;
