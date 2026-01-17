/**
 * Demo Users Seed Data
 * Staff users matching the IDs used in generated data
 */

import type { User } from '@/types';
import { DEMO_USERS, DEMO_PASSWORD } from '@/config';

/**
 * Demo Users (matching staff IDs used in generators)
 * Generated from centralized DEMO_USERS config
 */
export const demoUsers: User[] = DEMO_USERS.map((user) => ({
  ...user,
  password: DEMO_PASSWORD,
  createdAt: '2025-01-01T08:00:00Z',
}));
