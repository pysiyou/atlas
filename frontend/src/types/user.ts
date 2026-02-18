/**
 * User and Authentication Types
 */

// Import type from enum (Single Source of Truth)
export type { UserRole } from '@/types/enums';

// Re-export values for backwards compatibility
export {
  USER_ROLE_VALUES,
  USER_ROLE_CONFIG,
  USER_ROLE_OPTIONS,
  ALL_ROLES,
} from '@/types/enums';

// Import for local use
import type { UserRole } from '@/types/enums';

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  loggedInAt: string;
}
