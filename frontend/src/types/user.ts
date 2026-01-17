/**
 * User and Authentication Types
 */

// Import type from enum (Single Source of Truth)
export type { UserRole } from './enums/user-role';

// Re-export values for backwards compatibility
export { USER_ROLE_VALUES, USER_ROLE_CONFIG, USER_ROLE_OPTIONS, ALL_ROLES } from './enums/user-role';

// Import for local use
import type { UserRole } from './enums/user-role';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  loggedInAt: string;
}
