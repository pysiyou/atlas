/**
 * PatientFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon, Button, Badge, Modal, FooterInfo } from '@/shared/ui';
import { MultiSelectFilter } from '@/shared/ui';
import { CheckboxList } from '@/shared/ui';
import { ModalRangeSlider } from '@/shared/ui';
import { AgeFilter } from './AgeFilter';
import { inputWrapper, inputInner, inputText, inputContainerBase } from '@/shared/ui/inputStyles';
import { cn } from '@/utils';
import { ICONS } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';
import { PATIENT_FILTER_PLACEHOLDERS } from '@/features/filters';
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
 * SearchInput - Simple debounced search input (inline bar style)
 */
const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = PATIENT_FILTER_PLACEHOLDERS.search }) => {
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
    <div className={cn(inputWrapper)}>
      <Icon
        name={ICONS.actions.search}
        className="w-3.5 h-3.5 shrink-0 text-text-muted group-hover:text-brand transition-colors"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(inputInner, inputText, 'font-normal whitespace-nowrap overflow-hidden')}
      />
      <div className="flex items-center gap-1 shrink-0">
        {isDebouncing && (
          <div
            className={cn(
              'w-4 h-4 border-2 border-t-transparent rounded-full animate-spin',
              'border-brand'
            )}
          />
        )}
        {localValue && !isDebouncing && (
          <button
            onClick={handleClear}
            className={cn(
              'p-0.5',
              'hover:bg-surface-hover',
              'rounded',
              'transition-colors duration-200',
              'flex items-center justify-center cursor-pointer'
            )}
            aria-label="Clear search"
          >
            <Icon
              name={ICONS.actions.closeCircle}
              className={cn('w-4 h-4', 'text-text-muted', 'hover:text-text-tertiary')}
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
      <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={PATIENT_FILTER_PLACEHOLDERS.searchLong}
        />
      </div>

      {/* Age Range */}
      <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
        <AgeFilter
          value={ageRange}
          onChange={onAgeRangeChange}
          min={AGE_RANGE_MIN}
          max={AGE_RANGE_MAX}
          placeholder={PATIENT_FILTER_PLACEHOLDERS.ageRange}
          className="w-full"
        />
      </div>

      {/* Sex */}
      <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
        <MultiSelectFilter
          label="Sex"
          options={genderOptions}
          selectedIds={sexFilters}
          onChange={values => onSexFiltersChange(values as Gender[])}
          placeholder={PATIENT_FILTER_PLACEHOLDERS.sex}
          selectAllLabel="All genders"
          icon={ICONS.dataFields.userHands}
          className="w-full"
        />
      </div>

      {/* Affiliation Status */}
      <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
        <MultiSelectFilter
          label="Affiliation Status"
          options={affiliationStatusOptions}
          selectedIds={affiliationStatusFilters}
          onChange={values => onAffiliationStatusFiltersChange(values as AffiliationStatus[])}
          placeholder={PATIENT_FILTER_PLACEHOLDERS.affiliationStatus}
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
        <div className={cn('w-full bg-surface border-b', 'border-border-default')}>
          <div className="px-3 py-2 w-full">
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
              {/* Search control */}
              <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
                <SearchInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder={PATIENT_FILTER_PLACEHOLDERS.search}
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
          title="Filter"
          size="md"
        >
          <div className="flex flex-col h-full bg-surface">
            {/* Filter Controls - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Search Section */}
              <div className="mb-6">
                <div className={cn(inputContainerBase, 'flex items-center h-10 px-4')}>
                  <input
                    type="text"
                    placeholder={PATIENT_FILTER_PLACEHOLDERS.search}
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className={cn(inputInner, inputText, 'whitespace-nowrap overflow-hidden')}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="p-0.5 hover:bg-surface-hover rounded transition-colors"
                    >
                      <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-text-tertiary" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Sections */}
              <div className="space-y-5">
                {/* Age Range Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Age Range</h4>
                  <ModalRangeSlider
                    value={ageRange}
                    onChange={onAgeRangeChange}
                    min={AGE_RANGE_MIN}
                    max={AGE_RANGE_MAX}
                    hint="Move the slider to filter by age"
                    formatLabel={v => `${v} years`}
                  />
                  <div className="border-b border-border-default mt-4" />
                </div>

                {/* Sex Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Sex</h4>
                  <CheckboxList
                    options={genderOptions}
                    selectedIds={sexFilters}
                    onChange={values => onSexFiltersChange(values as Gender[])}
                    columns={genderOptions.length > 4 ? 2 : 1}
                  />
                  <div className="border-b border-border-default mt-4" />
                </div>

                {/* Affiliation Status Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Affiliation Status</h4>
                  <CheckboxList
                    options={affiliationStatusOptions}
                    selectedIds={affiliationStatusFilters}
                    onChange={values => onAffiliationStatusFiltersChange(values as AffiliationStatus[])}
                    columns={affiliationStatusOptions.length > 4 ? 2 : 1}
                  />
                </div>
              </div>
            </div>

            {/* Footer with Filter Button */}
            <div className="px-5 py-4 border-t border-border-default bg-surface shrink-0">
              <div className="flex items-center justify-between gap-3">
                <FooterInfo icon={ICONS.actions.filter} text="Filtering results" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onAgeRangeChange([AGE_RANGE_MIN, AGE_RANGE_MAX]);
                      onSexFiltersChange([]);
                      onAffiliationStatusFiltersChange([]);
                    }}
                    showIcon={false}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setIsModalOpen(false)}
                    showIcon={false}
                  >
                    Filter
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Tablet view: 2-column grid
  if (showTwoColumn) {
    return (
      <div className={cn('w-full bg-surface border-b', 'border-border-default')}>
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
    <div className={cn('w-full bg-surface border-b', 'border-border-default')}>
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        <div className="grid grid-cols-4 gap-3 lg:gap-4 items-center w-full">
          {renderFilters()}
        </div>
      </div>
    </div>
  );
};
