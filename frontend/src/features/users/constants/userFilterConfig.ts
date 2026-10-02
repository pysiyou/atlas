/**
 * User directory filter options and placeholders.
 */
import { SHARED_FILTER_PLACEHOLDERS } from '@/components/filters';
import { USER_ROLE_CONFIG, USER_ROLE_VALUES, type UserRole } from '@/types';
import { createFilterOptions } from '@/utils/filtering';

export const USER_FILTER_PLACEHOLDERS = {
  search: 'Search users...',
  searchLong: 'Search by name, username, email, or phone...',
  role: 'Select role',
  status: SHARED_FILTER_PLACEHOLDERS.status,
} as const;

export const USER_ACCOUNT_STATUS_OPTIONS = [
  { id: 'active', label: 'Active', color: 'success' },
  { id: 'disabled', label: 'Disabled', color: 'neutral' },
] as const;

export type UserAccountStatusFilter = (typeof USER_ACCOUNT_STATUS_OPTIONS)[number]['id'];

export const userRoleFilterOptions = createFilterOptions(USER_ROLE_VALUES, USER_ROLE_CONFIG);

export type { UserRole };
