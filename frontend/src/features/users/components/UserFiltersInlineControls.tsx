/**
 * Inline filter controls for UserFilters (tablet and desktop layouts).
 */
import React from 'react';
import { DebouncedSearchInput, MultiSelectFilter } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { CONTROL } from '@/components/theme/recipes';
import type { UserRole } from '@/types';
import {
  USER_ACCOUNT_STATUS_OPTIONS,
  USER_FILTER_PLACEHOLDERS,
  userRoleFilterOptions,
  type UserAccountStatusFilter,
} from '../constants/userFilterConfig';

export interface UserFiltersInlineControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilters: UserRole[];
  onRoleFiltersChange: (values: UserRole[]) => void;
  statusFilters: UserAccountStatusFilter[];
  onStatusFiltersChange: (values: UserAccountStatusFilter[]) => void;
}

/**
 * Search plus popover multi-selects for role and account status.
 */
export const UserFiltersInlineControls: React.FC<UserFiltersInlineControlsProps> = ({
  searchQuery,
  onSearchChange,
  roleFilters,
  onRoleFiltersChange,
  statusFilters,
  onStatusFiltersChange,
}) => (
  <>
    <div className={cn('flex', CONTROL.height, 'w-full items-center')}>
      <DebouncedSearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={USER_FILTER_PLACEHOLDERS.searchLong}
      />
    </div>

    <div className={cn('flex', CONTROL.height, 'w-full items-center')}>
      <MultiSelectFilter
        label="Role"
        options={userRoleFilterOptions}
        selectedIds={roleFilters}
        onChange={values => onRoleFiltersChange(values as UserRole[])}
        placeholder={USER_FILTER_PLACEHOLDERS.role}
        selectAllLabel="All roles"
        icon={ICONS.ui.usersGroup}
        className="w-full"
      />
    </div>

    <div className={cn('flex', CONTROL.height, 'w-full items-center')}>
      <MultiSelectFilter
        label="Status"
        options={[...USER_ACCOUNT_STATUS_OPTIONS]}
        selectedIds={statusFilters}
        onChange={values => onStatusFiltersChange(values as UserAccountStatusFilter[])}
        placeholder={USER_FILTER_PLACEHOLDERS.status}
        selectAllLabel="All statuses"
        icon={ICONS.ui.shieldCheck}
        className="w-full"
      />
    </div>
  </>
);
