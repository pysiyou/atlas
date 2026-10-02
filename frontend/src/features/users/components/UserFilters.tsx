/**
 * Filter bar for the user management directory.
 */
import React from 'react';
import { FILTER_TYPE } from '@/components/theme/recipes';
import { CheckboxList } from '@/components';
import { ResponsiveEntityFilters } from '@/components/filters';
import { MODULE_ICONS } from '@/config/icons';
import type { UserRole } from '@/types';
import {
  USER_ACCOUNT_STATUS_OPTIONS,
  USER_FILTER_PLACEHOLDERS,
  userRoleFilterOptions,
  type UserAccountStatusFilter,
} from '../constants/userFilterConfig';
import { UserFiltersInlineControls } from './UserFiltersInlineControls';

export interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleFilters: UserRole[];
  onRoleFiltersChange: (values: UserRole[]) => void;
  statusFilters: UserAccountStatusFilter[];
  onStatusFiltersChange: (values: UserAccountStatusFilter[]) => void;
}

/**
 * Responsive filters: inline popover multi-selects on md+, modal on small screens.
 */
export const UserFilters: React.FC<UserFiltersProps> = props => {
  const activeFilterCount = props.roleFilters.length + props.statusFilters.length;

  const modalContent = (
    <>
      <div className="w-full">
        <h4 className={FILTER_TYPE.sectionTitle}>Role</h4>
        <CheckboxList
          options={userRoleFilterOptions}
          selectedIds={props.roleFilters}
          onChange={values => props.onRoleFiltersChange(values as UserRole[])}
          columns={userRoleFilterOptions.length > 4 ? 2 : 1}
        />
        <div className="border-b border-border-default mt-space-4" />
      </div>
      <div className="w-full">
        <h4 className={FILTER_TYPE.sectionTitle}>Status</h4>
        <CheckboxList
          options={[...USER_ACCOUNT_STATUS_OPTIONS]}
          selectedIds={props.statusFilters}
          onChange={values => props.onStatusFiltersChange(values as UserAccountStatusFilter[])}
          columns={2}
        />
      </div>
    </>
  );

  return (
    <ResponsiveEntityFilters
      searchQuery={props.searchQuery}
      onSearchChange={props.onSearchChange}
      searchPlaceholder={USER_FILTER_PLACEHOLDERS.search}
      activeFilterCount={activeFilterCount}
      inlineControls={<UserFiltersInlineControls {...props} />}
      modalContent={modalContent}
      footerIcon={MODULE_ICONS.users}
      footerLabel="Users"
      onReset={() => {
        props.onRoleFiltersChange([]);
        props.onStatusFiltersChange([]);
      }}
    />
  );
};
