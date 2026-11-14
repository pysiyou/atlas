/**
 * User directory filter options, placeholders, and FilterBar config.
 */
import type { FilterConfig } from '@/components/filters/types';
import { IconKeys } from '@/config/icons';
import { getSharedFilterPlaceholders } from '@/config/filterPlaceholders';

const SHARED_FILTER_PLACEHOLDERS = getSharedFilterPlaceholders();
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

export const userFilterConfig: FilterConfig = {
  footerIcon: IconKeys.modules.users,
  footerLabel: 'Users',
  primaryFilters: {
    title: 'User Filters',
    controls: [
      {
        key: 'search',
        type: 'search',
        label: 'Search Users',
        placeholder: USER_FILTER_PLACEHOLDERS.search,
      },
      {
        key: 'role',
        type: 'multiSelect',
        label: 'Role',
        options: userRoleFilterOptions,
      },
      {
        key: 'accountStatus',
        type: 'multiSelect',
        label: 'Status',
        options: [...USER_ACCOUNT_STATUS_OPTIONS],
        icon: IconKeys.domain.orderStatus,
      },
    ],
  },
};
