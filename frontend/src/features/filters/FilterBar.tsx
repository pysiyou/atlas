/**
 * FilterBar Component
 * Main container for all filter controls with modern UX patterns
 */

import React, { useMemo } from 'react';
import { useFilterState } from './hooks';
import { useQuickFilters } from './hooks';
import { SearchControl, DateRangeControl, AgeRangeControl, PriceRangeControl, MultiSelectControl, SingleSelectControl } from './filter-controls';
import { ActiveFilterBadges } from './ActiveFilterBadges';
import { QuickFilters } from './QuickFilters';
import { FilterSection } from './FilterSection';
import type { FilterConfig, FilterValues, ActiveFilterBadge } from './types';

/**
 * Props for FilterBar component
 */
export interface FilterBarProps {
  /** Filter configuration */
  config: FilterConfig;
  /** Current filter values */
  value: FilterValues;
  /** Callback when filters change */
  onChange: (filters: FilterValues) => void;
  /** Custom className */
  className?: string;
}

/**
 * FilterBar Component
 * 
 * Main container component that provides:
 * - Search control (always visible)
 * - Quick filter presets
 * - Active filter badges
 * - Primary filter section
 * - Advanced filter section (collapsible)
 * 
 * @component
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  config,
  value,
  onChange,
  className,
}) => {
  // Use filter state management
  const {
    filters,
    setFilter,
    clearFilter,
    clearAll,
    isFilterActive,
  } = useFilterState({
    initialFilters: value,
    onChange,
  });

  // Quick filters
  const { applyPreset, activePresetId } = useQuickFilters({
    presets: config.quickFilters || [],
    filters,
    onApplyPreset: (preset) => {
      // Merge preset values with current filters
      const merged = { ...filters, ...preset.preset };
      Object.keys(merged).forEach((key) => {
        setFilter(key, merged[key]);
      });
    },
  });

  /**
   * Generate active filter badges
   */
  const activeBadges = useMemo<ActiveFilterBadge[]>(() => {
    const badges: ActiveFilterBadge[] = [];

    // Check primary filters
    config.primaryFilters.controls.forEach((control) => {
      const filterValue = filters[control.key];
      if (isFilterActive(control.key) && filterValue !== undefined) {
        badges.push({
          key: control.key,
          label: control.label,
          value: String(filterValue),
          rawValue: filterValue,
        });
      }
    });

    // Check advanced filters
    if (config.advancedFilters) {
      config.advancedFilters.controls.forEach((control) => {
        const filterValue = filters[control.key];
        if (isFilterActive(control.key) && filterValue !== undefined) {
          badges.push({
            key: control.key,
            label: control.label,
            value: String(filterValue),
            rawValue: filterValue,
          });
        }
      });
    }

    return badges;
  }, [filters, config, isFilterActive]);

  /**
   * Count active filters in a section
   */
  const countActiveInSection = (controls: typeof config.primaryFilters.controls) => {
    return controls.filter((control) => isFilterActive(control.key)).length;
  };

  /**
   * Render a filter control based on its type
   */
  const renderControl = (control: typeof config.primaryFilters.controls[0]) => {
    const filterValue = filters[control.key];

    switch (control.type) {
      case 'search':
        return (
          <SearchControl
            key={control.key}
            value={(filterValue as string) || ''}
            onChange={(val) => setFilter(control.key, val)}
            placeholder={control.placeholder}
            debounceMs={control.debounceMs}
            className="w-full"
          />
        );

      case 'dateRange':
        return (
          <DateRangeControl
            key={control.key}
            value={(filterValue as [Date, Date] | null) || null}
            onChange={(val) => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      case 'ageRange':
        return (
          <AgeRangeControl
            key={control.key}
            value={(filterValue as [number, number]) || [0, 150]}
            onChange={(val) => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      case 'priceRange':
        return (
          <PriceRangeControl
            key={control.key}
            value={(filterValue as [number, number]) || [control.min ?? 0, control.max ?? 10000]}
            onChange={(val) => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      case 'multiSelect':
        return (
          <MultiSelectControl
            key={control.key}
            value={(filterValue as string[]) || []}
            onChange={(val) => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      case 'singleSelect':
        return (
          <SingleSelectControl
            key={control.key}
            value={(filterValue as string | null) || null}
            onChange={(val) => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  // Get non-search controls
  const nonSearchControls = config.primaryFilters.controls.filter(
    (c) => c.type !== 'search'
  );
  const searchControl = config.primaryFilters.controls.find(
    (c) => c.type === 'search'
  );

  return (
    <div className={`bg-white border-b border-gray-200 ${className || ''}`}>
      {/* Compact filter row - search and filters in one row */}
      <div className="px-3 py-2">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {/* Search control */}
          {searchControl && (
            <div className="flex-1 w-full sm:w-auto sm:min-w-[250px] min-w-0">
              {renderControl(searchControl)}
            </div>
          )}

          {/* Quick filters */}
          {config.quickFilters && config.quickFilters.length > 0 && (
            <div className="flex-shrink-0 w-full sm:w-auto">
              <QuickFilters
                presets={config.quickFilters}
                activePresetId={activePresetId}
                onPresetClick={applyPreset}
              />
            </div>
          )}

          {/* Primary filters - inline on desktop */}
          {nonSearchControls.length > 0 && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {nonSearchControls.map((control) => (
                <div key={control.key} className="w-full sm:w-auto sm:min-w-[200px]">
                  {renderControl(control)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active filter badges - compact */}
      {activeBadges.length > 0 && (
        <ActiveFilterBadges
          badges={activeBadges}
          onRemove={clearFilter}
          onClearAll={clearAll}
        />
      )}

      {/* Advanced filters section - collapsed by default */}
      {config.advancedFilters && config.advancedFilters.controls.length > 0 && (
        <FilterSection
          title="Advanced Filters"
          collapsible={true}
          defaultCollapsed={true}
          activeCount={countActiveInSection(config.advancedFilters.controls)}
        >
          {config.advancedFilters.controls.map((control) => renderControl(control))}
        </FilterSection>
      )}
    </div>
  );
};
