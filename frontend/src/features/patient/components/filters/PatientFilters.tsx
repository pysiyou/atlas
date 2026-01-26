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
 * ModalAgeSlider - Dual-thumb slider for age range in modal
 */
const ModalAgeSlider: React.FC<{
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
}> = ({ value, onChange, min, max }) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1] - 1);
    const newValue: [number, number] = [newMin, localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0] + 1);
    const newValue: [number, number] = [localValue[0], newMax];
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Calculate percentages for visual track
  const minPercent = ((localValue[0] - min) / (max - min)) * 100;
  const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <p className="text-sm text-text-tertiary mb-4">Move the slider to filter by age</p>

      {/* Slider Track */}
      <div className="relative h-1 mb-6">
        {/* Background track */}
        <div className="absolute inset-0 bg-border rounded-full" />

        {/* Active track */}
        <div
          className="absolute h-full bg-brand rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[0]}
          onChange={handleMinChange}
          className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: localValue[0] > max - 10 ? 5 : 3 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Age labels */}
      <div className="flex justify-between text-lg font-medium text-text">
        <span>{localValue[0]} years</span>
        <span>{localValue[1]} years</span>
      </div>
    </div>
  );
};

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
        'h-[34px]',
        'px-3 bg-surface border',
        'border-border-strong',
        'rounded-md',
        'hover:bg-surface-hover',
        'focus-within:outline-none',
        'focus-within:border-brand',
        'transition-colors duration-200'
      )}
    >
      <Icon
        name={ICONS.actions.search}
        className={cn('text-text-disabled', 'w-3.5 h-3.5 shrink-0')}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(
          'flex-1 min-w-0 text-xs font-medium bg-transparent border-0 outline-none py-0',
          'placeholder:font-normal',
          'placeholder:text-text-muted'
        )}
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
              className={cn('w-4 h-4', 'text-text-disabled', 'hover:text-text-tertiary')}
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
          placeholder="Search patients by name, ID, phone, or email..."
        />
      </div>

      {/* Age Range */}
      <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
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
      <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
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
      <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
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
        <div className={cn('w-full bg-surface border-b', 'border-border')}>
          <div className="px-3 py-2 w-full">
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
              {/* Search control */}
              <div className={cn('flex', 'h-[34px]', 'w-full items-center')}>
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
          title="Filter"
          size="md"
        >
          <div className="flex flex-col h-full bg-surface">
            {/* Filter Controls - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Search Section */}
              <div className="mb-6">
                <div className="relative w-full flex items-center h-10 px-4 bg-surface border border-border rounded-lg focus-within:border-brand transition-colors">
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="flex-1 min-w-0 text-sm bg-transparent border-0 outline-none placeholder:text-text-muted"
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
                  <h4 className="text-sm font-semibold text-text mb-3">Age Range</h4>
                  <ModalAgeSlider
                    value={ageRange}
                    onChange={onAgeRangeChange}
                    min={AGE_RANGE_MIN}
                    max={AGE_RANGE_MAX}
                  />
                  <div className="border-b border-border mt-4" />
                </div>

                {/* Sex Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-text mb-3">Sex</h4>
                  <CheckboxList
                    options={genderOptions}
                    selectedIds={sexFilters}
                    onChange={values => onSexFiltersChange(values as Gender[])}
                    columns={genderOptions.length > 4 ? 2 : 1}
                  />
                  <div className="border-b border-border mt-4" />
                </div>

                {/* Affiliation Status Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-text mb-3">Affiliation Status</h4>
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
            <div className="px-5 py-4 border-t border-border bg-surface shrink-0">
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    onAgeRangeChange([AGE_RANGE_MIN, AGE_RANGE_MAX]);
                    onSexFiltersChange([]);
                    onAffiliationStatusFiltersChange([]);
                  }}
                  className="w-full mb-3 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Clear all filters
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 bg-brand hover:opacity-90 text-text-inverse font-medium rounded-lg transition-colors"
              >
                Filter
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Tablet view: 2-column grid
  if (showTwoColumn) {
    return (
      <div className={cn('w-full bg-surface border-b', 'border-border')}>
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
    <div className={cn('w-full bg-surface border-b', 'border-border')}>
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        <div className="grid grid-cols-4 gap-3 lg:gap-4 items-center w-full">
          {renderFilters()}
        </div>
      </div>
    </div>
  );
};
