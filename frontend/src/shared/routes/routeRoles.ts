/**
 * Route Role Mapping
 * Maps routes to required user roles for authorization
 */

import { ROUTES } from '@/config';
import { ALL_ROLES } from '@/types';
import type { UserRole } from '@/types';

/**
 * Maps route paths to required roles
 * Routes not listed here default to requiring authentication only
 */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  [ROUTES.DASHBOARD]: ALL_ROLES,
  [ROUTES.PATIENTS]: ['receptionist', 'administrator'],
  [ROUTES.ORDERS]: ALL_ROLES,
  [ROUTES.LABORATORY]: ['lab-technician', 'pathologist', 'administrator'],
  [ROUTES.APPOINTMENTS]: ['receptionist', 'administrator'],
  [ROUTES.PAYMENTS]: ['receptionist', 'administrator'],
  [ROUTES.REPORTS]: ['pathologist', 'administrator'],
  [ROUTES.CATALOG]: ALL_ROLES,
  [ROUTES.ADMIN]: ['administrator'],
};

/**
 * Get required roles for a route path
 * @param path - Route path to check
 * @returns Array of allowed roles, or null if route requires only authentication
 */
export function getRequiredRoles(path: string): UserRole[] | null {
  // Check exact match first
  if (ROUTE_ROLES[path]) {
    return ROUTE_ROLES[path];
  }

  // Check if path starts with any route (for nested routes like /patients/*)
  for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
    if (path.startsWith(route)) {
      return roles;
    }
  }

  // Default: require authentication only (no specific role)
  return null;
}
