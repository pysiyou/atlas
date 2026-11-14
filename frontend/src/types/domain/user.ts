/**
 * User and Authentication Types
 */

import type { UserRole } from '../contracts/enums/user';
export {
  USER_ROLE_VALUES,
  USER_ROLE_CONFIG,
  USER_ROLE_OPTIONS,
  ALL_ROLES,
} from '../contracts/enums/user';
export type { UserRole };

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Authenticated session user (subset of User) */
export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
}