/**
 * User directory FilterBar configuration.
 */

import type { FilterConfig } from '@/components/filters/types';
import { MODULE_ICONS } from '@/config/icons';
import {
  USER_ACCOUNT_STATUS_OPTIONS,
  USER_FILTER_PLACEHOLDERS,
  userRoleFilterOptions,
} from './userFilterConfig';

export const userFilterConfig: FilterConfig = {
  footerIcon: MODULE_ICONS.users,
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
      },
    ],
  },
};
