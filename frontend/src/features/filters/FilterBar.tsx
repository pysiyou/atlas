/**
 * FilterBar Component
 * Main container for all filter controls with modern UX patterns
 * Supports responsive views: lg (full inline), md (partial inline + dropdown), sm (modal)
 */

import React, { useMemo, useState } from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useFilterState, useQuickFilters } from './hooks';
import {
  SearchControl,
  DateRangeControl,
  AgeRangeControl,
  PriceRangeControl,
  MultiSelectControl,
  SingleSelectControl,
} from './filter-controls';
import { QuickFilters } from './QuickFilters';
import { FilterSection } from './FilterSection';
import { FilterModal } from './FilterModal';
import { brandColors } from '@/shared/design-system/tokens/colors';
import { Popover } from '@/shared/ui/Popover';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
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
 * - Primary filter section
 * - Advanced filter section (collapsible)
 * - Responsive views: lg (full inline), md (partial inline + dropdown), sm (modal)
 *
 * @component
 */
// Large component is necessary for comprehensive filter bar with multiple filter types, state management, responsive views, and UI rendering
/* eslint-disable max-lines */
// eslint-disable-next-line max-lines-per-function
export const FilterBar: React.FC<FilterBarProps> = ({ config, value, onChange, className }) => {
  // Breakpoint detection for responsive views
  const breakpoint = useBreakpoint();
  const isMedium = breakpoint === 'md';
  const isSmall = isBreakpointAtMost(breakpoint, 'sm');

  // Modal state for small screens
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use filter state management
  const { filters, setFilter, clearAll, isFilterActive } = useFilterState({
    initialFilters: value,
    onChange,
  });

  // Quick filters
  const { applyPreset, activePresetId } = useQuickFilters({
    presets: config.quickFilters || [],
    filters,
    onApplyPreset: preset => {
      // Merge preset values with current filters
      const merged = { ...filters, ...preset.preset };
      Object.keys(merged).forEach(key => {
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
    config.primaryFilters.controls.forEach(control => {
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
      config.advancedFilters.controls.forEach(control => {
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
    return controls.filter(control => isFilterActive(control.key)).length;
  };

  /**
   * Render a filter control based on its type
   */
  const renderControl = (control: (typeof config.primaryFilters.controls)[0]) => {
    const filterValue = filters[control.key];

    switch (control.type) {
      case 'search':
        return (
          <SearchControl
            key={control.key}
            value={(filterValue as string) || ''}
            onChange={val => setFilter(control.key, val)}
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
            onChange={val => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      case 'ageRange':
        return (
          <AgeRangeControl
            key={control.key}
            value={(filterValue as [number, number]) || [0, 150]}
            onChange={val => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      case 'priceRange':
        return (
          <PriceRangeControl
            key={control.key}
            value={(filterValue as [number, number]) || [control.min ?? 0, control.max ?? 10000]}
            onChange={val => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      case 'multiSelect':
        return (
          <MultiSelectControl
            key={control.key}
            value={(filterValue as string[]) || []}
            onChange={val => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      case 'singleSelect':
        return (
          <SingleSelectControl
            key={control.key}
            value={(filterValue as string | null) || null}
            onChange={val => setFilter(control.key, val)}
            config={control}
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  // Get non-search controls
  const nonSearchControls = config.primaryFilters.controls.filter(c => c.type !== 'search');
  const searchControl = config.primaryFilters.controls.find(c => c.type === 'search');

  /**
   * Determine which filters to show inline for medium view
   * Priority: dateRange, status filters (multiSelect with common keys), then others
   */
  const getMediumViewFilters = () => {
    const priorityKeys = ['dateRange', 'status', 'payment', 'method', 'sampleType'];
    const inlineControls: typeof nonSearchControls = [];
    const dropdownControls: typeof nonSearchControls = [];

    // Sort controls by priority
    const sortedControls = [...nonSearchControls].sort((a, b) => {
      const aPriority = priorityKeys.includes(a.key) ? 0 : 1;
      const bPriority = priorityKeys.includes(b.key) ? 0 : 1;
      return aPriority - bPriority;
    });

    // Show first 1-2 controls inline
    sortedControls.forEach((control, index) => {
      if (index < 2) {
        inlineControls.push(control);
      } else {
        dropdownControls.push(control);
      }
    });

    return { inlineControls, dropdownControls };
  };

  const { inlineControls: mediumInlineControls, dropdownControls: mediumDropdownControls } =
    getMediumViewFilters();

  /**
   * Render Large View (lg+)
   * All filters visible inline in horizontal layout with aligned controls
   */
  const renderLargeView = () => (
    <div className={`bg-white border-b border-gray-200 ${className || ''}`}>
      {/* Filter row - search and filters in one row, aligned for lg */}
      <div className="px-4 py-2.5 lg:px-5 lg:py-3">
        <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-2 lg:gap-x-4 lg:gap-y-2">
          {/* Search control - fixed height slot for alignment */}
          {searchControl && (
            <div className="flex h-[34px] min-h-[34px] max-h-[34px] min-w-[250px] shrink-0 items-center overflow-hidden lg:min-w-[260px]">
              {renderControl(searchControl)}
            </div>
          )}

          {/* Quick filters - match control height for vertical alignment */}
          {config.quickFilters && config.quickFilters.length > 0 && (
            <div className="flex h-[34px] min-h-[34px] max-h-[34px] shrink-0 items-center overflow-hidden">
              <QuickFilters
                presets={config.quickFilters}
                activePresetId={activePresetId}
                onPresetClick={applyPreset}
              />
            </div>
          )}

          {/* Primary filters - fixed size; height unchanged when values present */}
          {nonSearchControls.map(control => (
            <div
              key={control.key}
              className="flex h-[34px] min-h-[34px] max-h-[34px] min-w-[200px] shrink-0 items-center overflow-hidden lg:min-w-[220px]"
            >
              {renderControl(control)}
            </div>
          ))}
        </div>
      </div>

      {/* Advanced filters section - collapsed by default */}
      {config.advancedFilters && config.advancedFilters.controls.length > 0 && (
        <FilterSection
          title="Advanced Filters"
          collapsible={true}
          defaultCollapsed={true}
          activeCount={countActiveInSection(config.advancedFilters.controls)}
        >
          {config.advancedFilters.controls.map(control => renderControl(control))}
        </FilterSection>
      )}
    </div>
  );

  /**
   * Render Medium View (md)
   * Search + 1-2 key filters inline, rest in dropdown
   */
  const renderMediumView = () => (
    <div className={`bg-white border-b border-gray-200 ${className || ''}`}>
      {/* Filter row */}
      <div className="px-3 py-2">
        <div className="flex flex-row gap-2 items-center">
          {/* Search control */}
          {searchControl && (
            <div className="flex h-[34px] min-h-[34px] max-h-[34px] min-w-[200px] flex-1 items-center overflow-hidden">
              {renderControl(searchControl)}
            </div>
          )}

          {/* Inline filters (1-2 most important) – same fixed height as large view */}
          {mediumInlineControls.length > 0 && (
            <div className="flex gap-2">
              {mediumInlineControls.map(control => (
                <div
                  key={control.key}
                  className="flex h-[34px] min-h-[34px] max-h-[34px] min-w-[180px] shrink-0 items-center overflow-hidden"
                >
                  {renderControl(control)}
                </div>
              ))}
            </div>
          )}

          {/* More Filters dropdown */}
          {mediumDropdownControls.length > 0 && (
            <Popover
              placement="bottom-end"
              offsetValue={8}
              trigger={({ isOpen }) => {
                const activeCount = mediumDropdownControls.filter(c => isFilterActive(c.key)).length;
                return (
                  <div className="relative inline-flex">
                    <Button
                      variant="filter"
                      size="sm"
                      className={isOpen ? `ring-2 ${brandColors.primary.ring20}` : ''}
                    >
                      More Filters
                    </Button>
                    {activeCount > 0 && (
                      <Badge
                        variant="primary"
                        size="xs"
                        className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 flex items-center justify-center"
                      >
                        {activeCount}
                      </Badge>
                    )}
                  </div>
                );
              }}
              className="p-3 min-w-[280px] max-h-[400px] overflow-y-auto"
            >
              {({ close }) => (
                <div className="space-y-3">
                  {/* Quick filters in dropdown if present */}
                  {config.quickFilters && config.quickFilters.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-2">Quick Filters</div>
                      <QuickFilters
                        presets={config.quickFilters}
                        activePresetId={activePresetId}
                        onPresetClick={presetId => {
                          applyPreset(presetId);
                          close();
                        }}
                      />
                    </div>
                  )}

                  {/* Dropdown filters */}
                  {mediumDropdownControls.map(control => (
                    <div key={control.key} className="w-full">
                      {renderControl(control)}
                    </div>
                  ))}

                  {/* Advanced filters in dropdown */}
                  {config.advancedFilters && config.advancedFilters.controls.length > 0 && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Advanced Filters
                      </div>
                      {config.advancedFilters.controls.map(control => (
                        <div key={control.key} className="w-full mb-2 last:mb-0">
                          {renderControl(control)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Popover>
          )}
        </div>
      </div>
    </div>
  );

  /**
   * Render Small View (sm)
   * Search visible, filters button opens modal
   */
  const renderSmallView = () => (
    <div className={`bg-white border-b border-gray-200 ${className || ''}`}>
      {/* Search and filter button row */}
      <div className="px-3 py-2">
        <div className="flex gap-2 items-center">
          {/* Search control */}
          {searchControl && (
            <div className="flex-1 min-w-0">
              {renderControl(searchControl)}
            </div>
          )}

          {/* Filters button */}
          {nonSearchControls.length > 0 && (
            <div className="relative inline-flex shrink-0">
              <Button
                variant="filter"
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                Filters
              </Button>
              {activeBadges.length > 0 && (
                <Badge
                  variant="primary"
                  size="xs"
                  className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 flex items-center justify-center"
                >
                  {activeBadges.length}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={config}
        activeBadges={activeBadges}
        onClearAll={clearAll}
        activePresetId={activePresetId}
        onPresetClick={applyPreset}
        renderControl={renderControl}
        countActiveInSection={countActiveInSection}
      />
    </div>
  );

  // Render appropriate view based on breakpoint
  if (isSmall) {
    return renderSmallView();
  }

  if (isMedium) {
    return renderMediumView();
  }

  // Large view (lg+)
  return renderLargeView();
};
