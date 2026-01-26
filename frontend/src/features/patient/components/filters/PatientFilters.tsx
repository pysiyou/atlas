/**
 * PatientFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/shared/ui/Icon';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Modal } from '@/shared/ui/Modal';
import { MultiSelectFilter } from '@/shared/ui/MultiSelectFilter';
import { CheckboxList } from '@/shared/ui/CheckboxList';
import { AgeFilter } from './AgeFilter';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { brandColors, neutralColors } from '@/shared/design-system/tokens/colors';
import { filterControlSizing } from '@/shared/design-system/tokens/sizing';
import { radius } from '@/shared/design-system/tokens/borders';
import { hover, focus } from '@/shared/design-system/tokens/interactions';
import { transitions } from '@/shared/design-system/tokens/animations';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../../config/constants';
import type { Gender } from '@/types';

/**
 * Affiliation status type
 */
export type AffiliationStatus = 'active' | 'inactive';

/**
 * Props interface for PatientFilters component
 */
export interface PatientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ageRange: [number, number];
  onAgeRangeChange: (range: [number, number]) => void;
  sexFilters: Gender[];
  onSexFiltersChange: (values: Gender[]) => void;
  affiliationStatusFilters: AffiliationStatus[];
  onAffiliationStatusFiltersChange: (values: AffiliationStatus[]) => void;
}

// Prepare filter options
const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);
const affiliationStatusOptions = [
  { id: 'active', label: 'Active', color: 'success' },
  { id: 'inactive', label: 'Inactive', color: 'default' },
];

/**
 * SearchInput - Simple debounced search input
 */
const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search...' }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      onChange(localValue);
      setIsDebouncing(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsDebouncing(false);
    };
  }, [localValue, value, onChange]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div
      className={cn(
        'relative w-full flex items-center gap-2',
        filterControlSizing.height,
        'px-3 bg-surface border',
        neutralColors.border.medium,
        radius.md,
        hover.background,
        focus.outline,
        'focus-within:border-brand',
        transitions.colors
      )}
    >
      <Icon
        name={ICONS.actions.search}
        className={cn(neutralColors.text.disabled, 'w-3.5 h-3.5 shrink-0')}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(
          'flex-1 min-w-0 text-xs font-medium bg-transparent border-0 outline-none py-0',
          'placeholder:font-normal',
          `placeholder:${neutralColors.text.muted}`
        )}
      />
      <div className="flex items-center gap-1 shrink-0">
        {isDebouncing && (
          <div
            className={cn(
              'w-4 h-4 border-2 border-t-transparent rounded-full animate-spin',
              brandColors.primary.borderMedium
            )}
          />
        )}
        {localValue && !isDebouncing && (
          <button
            onClick={handleClear}
            className={cn(
              'p-0.5',
              hover.background,
              'rounded',
              transitions.colors,
              'flex items-center justify-center cursor-pointer'
            )}
            aria-label="Clear search"
          >
            <Icon
              name={ICONS.actions.closeCircle}
              className={cn('w-4 h-4', neutralColors.text.disabled, `hover:${neutralColors.text.tertiary}`)}
            />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * PatientFilters - Responsive filter layout
 * - lg+: 4-column grid (search + age + sex + affiliation)
 * - md: 2-column grid
 * - sm/xs: Search bar + Filters button (opens modal with all filters)
 */
export const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchQuery,
  onSearchChange,
  ageRange,
  onAgeRangeChange,
  sexFilters,
  onSexFiltersChange,
  affiliationStatusFilters,
  onAffiliationStatusFiltersChange,
}) => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Count active filters for badge
  const activeFilterCount =
    (ageRange[0] !== AGE_RANGE_MIN || ageRange[1] !== AGE_RANGE_MAX ? 1 : 0) +
    sexFilters.length +
    affiliationStatusFilters.length;

  // Check if we should show modal view (sm and below)
  const showModalView = isBreakpointAtMost(breakpoint, 'sm');
  const showTwoColumn = breakpoint === 'md';

  /**
   * Render all filter controls (used in both inline and modal views)
   */
  const renderFilters = () => (
    <>
      {/* Search */}
      <div className={cn('flex', filterControlSizing.height, 'w-full items-center')}>
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search patients by name, ID, phone, or email..."
        />
      </div>

      {/* Age Range */}
      <div className={cn('flex', filterControlSizing.height, 'w-full items-center')}>
        <AgeFilter
          value={ageRange}
          onChange={onAgeRangeChange}
          min={AGE_RANGE_MIN}
          max={AGE_RANGE_MAX}
          placeholder="Filter by age range"
          className="w-full"
        />
      </div>

      {/* Sex */}
      <div className={cn('flex', filterControlSizing.height, 'w-full items-center')}>
        <MultiSelectFilter
          label="Sex"
          options={genderOptions}
          selectedIds={sexFilters}
          onChange={values => onSexFiltersChange(values as Gender[])}
          placeholder="Select sex/gender"
          selectAllLabel="All genders"
          icon={ICONS.dataFields.userHands}
          className="w-full"
        />
      </div>

      {/* Affiliation Status */}
      <div className={cn('flex', filterControlSizing.height, 'w-full items-center')}>
        <MultiSelectFilter
          label="Affiliation Status"
          options={affiliationStatusOptions}
          selectedIds={affiliationStatusFilters}
          onChange={values => onAffiliationStatusFiltersChange(values as AffiliationStatus[])}
          placeholder="Select affiliation status"
          selectAllLabel="All statuses"
          icon={ICONS.actions.infoCircle}
          className="w-full"
        />
      </div>
    </>
  );

  // Mobile view: Search bar + Filters button
  if (showModalView) {
    return (
      <>
        <div className={cn('w-full bg-surface border-b', neutralColors.border.default)}>
          <div className="px-3 py-2 w-full">
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
              {/* Search control */}
              <div className={cn('flex', filterControlSizing.height, 'w-full items-center')}>
                <SearchInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder="Search patients..."
                />
              </div>

              {/* Filters button */}
              <div className="relative flex shrink-0">
                <Button
                  variant="filter"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  Filters
                </Button>
                {activeFilterCount > 0 && (
                  <Badge
                    variant="primary"
                    size="xs"
                    className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 flex items-center justify-center"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Filters"
          size="lg"
        >
          <div className="space-y-6">
            {/* Search Section */}
            <div className="space-y-3">
              <label className={cn('block text-sm font-semibold', neutralColors.text.primary)}>
                Search
              </label>
              <SearchInput
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search patients by name, ID, phone, or email..."
              />
            </div>

            {/* Age Range Section */}
            <div className="space-y-3">
              <label className={cn('block text-sm font-semibold', neutralColors.text.primary)}>
                Age Range
              </label>
              <AgeFilter
                value={ageRange}
                onChange={onAgeRangeChange}
                min={AGE_RANGE_MIN}
                max={AGE_RANGE_MAX}
                placeholder="Filter by age range"
                className="w-full"
              />
            </div>

            {/* Sex Section */}
            <div className="space-y-3">
              <label className={cn('block text-sm font-semibold', neutralColors.text.primary)}>
                Sex
              </label>
              <CheckboxList
                options={genderOptions}
                selectedIds={sexFilters}
                onChange={values => onSexFiltersChange(values as Gender[])}
              />
            </div>

            {/* Affiliation Status Section */}
            <div className="space-y-3">
              <label className={cn('block text-sm font-semibold', neutralColors.text.primary)}>
                Affiliation Status
              </label>
              <CheckboxList
                options={affiliationStatusOptions}
                selectedIds={affiliationStatusFilters}
                onChange={values => onAffiliationStatusFiltersChange(values as AffiliationStatus[])}
              />
            </div>

            {/* Action buttons */}
            <div className={cn('flex gap-3 pt-4 border-t', neutralColors.border.default)}>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    onAgeRangeChange([AGE_RANGE_MIN, AGE_RANGE_MAX]);
                    onSexFiltersChange([]);
                    onAffiliationStatusFiltersChange([]);
                  }}
                  className="flex-1"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(false)}
                className={cn('flex-1', !activeFilterCount && 'w-full')}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Tablet view: 2-column grid
  if (showTwoColumn) {
    return (
      <div className={cn('w-full bg-surface border-b', neutralColors.border.default)}>
        <div className="px-3 py-2 w-full">
          <div className="grid grid-cols-2 gap-2 items-center w-full">
            {renderFilters()}
          </div>
        </div>
      </div>
    );
  }

  // Desktop view: 4-column grid
  return (
    <div className={cn('w-full bg-surface border-b', neutralColors.border.default)}>
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        <div className="grid grid-cols-4 gap-3 lg:gap-4 items-center w-full">
          {renderFilters()}
        </div>
      </div>
    </div>
  );
};
