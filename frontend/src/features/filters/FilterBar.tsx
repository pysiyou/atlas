/**
 * FilterBar Component
 * Main container for all filter controls with modern UX patterns
 * Supports responsive views: lg (full inline), md (partial inline + dropdown), sm (modal)
 */

import React, { useMemo, useState } from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useFilterState, useQuickFilters } from './hooks';
import { FilterFactory } from './FilterFactory';
import { QuickFilters } from './QuickFilters';
import { FilterSection } from './FilterSection';
import { FilterModal } from './FilterModal';
import { Button } from '@/shared/ui';
import { Badge } from '@/shared/ui';
import type { FilterConfig, FilterValues, ActiveFilterBadge } from './types';

// Style constants for consistent styling
const filterStyles = {
  controlHeight: 'h-[34px]',
  container: 'w-full bg-panel border-b border-stroke',
  dropdownLabel: 'text-xs font-medium text-fg-subtle mb-2',
  dropdownDivider: 'pt-2 border-t border-stroke',
} as const;

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
   * Render a filter control using the FilterFactory
   */
  const renderControl = (control: (typeof config.primaryFilters.controls)[0]) => {
    return (
      <FilterFactory
        key={control.key}
        control={control}
        value={filters}
        onChange={setFilter}
        className="w-full"
      />
    );
  };

  // Get non-search controls
  const nonSearchControls = config.primaryFilters.controls.filter(c => c.type !== 'search');
  const searchControl = config.primaryFilters.controls.find(c => c.type === 'search');

  /**
   * Render Large View (lg+)
   * All filters visible inline in horizontal layout with aligned controls
   * Layout: 4-column grid with search bar + 3 filters (equal width columns)
   */
  const renderLargeView = () => {
    // Get exactly 3 non-search controls for the grid (first 3 primary filters)
    const gridFilters = nonSearchControls.slice(0, 3);
    
    return (
      <div className={`${filterStyles.container} ${className || ''}`}>
        {/* Filter row - 4 column grid layout */}
        <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
          {/* 4-column grid: search bar + 3 filters */}
          <div className="grid grid-cols-4 gap-3 lg:gap-4 items-center w-full">
            {/* Column 1: Search control */}
            {searchControl && (
              <div className={`flex ${filterStyles.controlHeight} w-full items-center`}>
                {renderControl(searchControl)}
              </div>
            )}

            {/* Columns 2-4: Primary filters (exactly 3 filters) */}
            {gridFilters.map(control => (
              <div
                key={control.key}
                className={`flex ${filterStyles.controlHeight} w-full items-center`}
              >
                {renderControl(control)}
              </div>
            ))}
          </div>

          {/* Quick filters row - below the main grid if present */}
          {config.quickFilters && config.quickFilters.length > 0 && (
            <div className="mt-2 flex items-center">
              <QuickFilters
                presets={config.quickFilters}
                activePresetId={activePresetId}
                onPresetClick={applyPreset}
              />
            </div>
          )}
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
  };

  /**
   * Render Medium View (md)
   * 4-column grid: search + 3 filters (same as large view for consistency)
   */
  const renderMediumView = () => {
    // Get exactly 3 non-search controls for the grid (first 3 primary filters)
    const gridFilters = nonSearchControls.slice(0, 3);
    
    return (
      <div className={`${filterStyles.container} ${className || ''}`}>
        {/* Filter row - 4 column grid layout */}
        <div className="px-3 py-2 w-full">
          {/* 4-column grid: search bar + 3 filters */}
          <div className="grid grid-cols-4 gap-2 items-center w-full">
            {/* Column 1: Search control */}
            {searchControl && (
              <div className={`flex ${filterStyles.controlHeight} w-full items-center`}>
                {renderControl(searchControl)}
              </div>
            )}

            {/* Columns 2-4: Primary filters (exactly 3 filters) */}
            {gridFilters.map(control => (
              <div
                key={control.key}
                className={`flex ${filterStyles.controlHeight} w-full items-center`}
              >
                {renderControl(control)}
              </div>
            ))}
          </div>

          {/* Quick filters row - below the main grid if present */}
          {config.quickFilters && config.quickFilters.length > 0 && (
            <div className="mt-2 flex items-center">
              <QuickFilters
                presets={config.quickFilters}
                activePresetId={activePresetId}
                onPresetClick={applyPreset}
              />
            </div>
          )}
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
  };

  /**
   * Render Small View (sm)
   * 2-column grid: search takes most space, filters button on the right
   */
  const renderSmallView = () => (
    <div className={`${filterStyles.container} ${className || ''}`}>
      {/* Search and filter button row */}
      <div className="px-3 py-2 w-full">
        <div className="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
          {/* Search control - takes remaining space */}
          {searchControl && (
            <div className={`flex ${filterStyles.controlHeight} w-full items-center`}>
              {renderControl(searchControl)}
            </div>
          )}

          {/* Filters button - auto width */}
          {nonSearchControls.length > 0 && (
            <div className="relative flex shrink-0">
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
        filters={filters}
        setFilter={setFilter}
        activeBadges={activeBadges}
        onClearAll={clearAll}
        activePresetId={activePresetId}
        onPresetClick={applyPreset}
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
