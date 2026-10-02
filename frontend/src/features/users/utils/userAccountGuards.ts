/**
 * Account-lifecycle helpers for the administrator user directory.
 */
import type { UserAdminRecord } from '../api/usersAdmin';

/**
 * Whether the account can sign in. Treats a missing flag as active for older payloads.
 */
export function isUserActive(user: UserAdminRecord): boolean {
  return user.isActive !== false;
}

/**
 * Count administrators that can currently sign in.
 */
export function countActiveAdministrators(users: UserAdminRecord[]): number {
  return users.filter(user => isUserActive(user) && user.role === 'administrator').length;
}

/**
 * True when this user is the last remaining active administrator.
 */
export function isLastActiveAdministrator(
  user: UserAdminRecord,
  users: UserAdminRecord[]
): boolean {
  return (
    isUserActive(user) &&
    user.role === 'administrator' &&
    countActiveAdministrators(users) <= 1
  );
}

/**
 * Disable is allowed for other active accounts except the last remaining administrator.
 */
export function canDisableUser(
  user: UserAdminRecord,
  currentUserId: number | null,
  users: UserAdminRecord[]
): boolean {
  if (!isUserActive(user)) return false;
  if (currentUserId != null && user.id === currentUserId) return false;
  if (isLastActiveAdministrator(user, users)) return false;
  return true;
}
