/**
 * FilterBar Component
 * Main container for all filter controls with modern UX patterns
 * Supports responsive views: lg (full inline), md (partial inline + dropdown), sm (modal)
 */

import React, { useMemo, useState } from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useFilterState } from './useFilterState';
import { useQuickFilters } from './useQuickFilters';
import { FilterFactory } from './FilterFactory';
import { QuickFilters } from './QuickFilters';
import { FilterModal } from './FilterModal';
import { actionButtonPreset, Button, Badge } from '@/components/primitives';
import { CONTROL, FILTER } from '@/components/theme/recipes';
import { FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import type { FilterConfig, FilterValues, ActiveFilterBadge, FilterControl } from './types';

const filterStyles = {
  controlHeight: CONTROL.height,
  container: 'w-full bg-surface border-b border-border-default',
  dropdownLabel: `${FORM_FIELD_LABEL} mb-space-2`,
  dropdownDivider: 'pt-space-2 border-t border-border-default',
} as const;

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

function collectActiveBadges(
  config: FilterConfig,
  filters: FilterValues,
  isFilterActive: (key: string) => boolean
): ActiveFilterBadge[] {
  const badges: ActiveFilterBadge[] = [];
  for (const control of config.primaryFilters.controls) {
    const filterValue = filters[control.key];
    if (isFilterActive(control.key) && filterValue !== undefined) {
      badges.push({
        key: control.key,
        label: control.label,
        value: String(filterValue),
        rawValue: filterValue,
      });
    }
  }
  return badges;
}

interface FilterBarInlineGridProps {
  config: FilterConfig;
  className?: string;
  compact: boolean;
  searchControl: FilterControl | undefined;
  gridFilters: FilterControl[];
  renderControl: (control: FilterControl) => React.ReactNode;
  activePresetId: string | null;
  applyPreset: (presetId: string) => void;
}

/**
 * Shared lg/md layout: search + up to 3 primary filters and optional quick-filter row.
 */
function FilterBarInlineGrid({
  config,
  className,
  compact,
  searchControl,
  gridFilters,
  renderControl,
  activePresetId,
  applyPreset,
}: FilterBarInlineGridProps) {
  return (
    <div className={`${filterStyles.container} ${className || ''}`}>
      <div className={compact ? FILTER.barInsetCompact : FILTER.barInset}>
        <div className={compact ? FILTER.barGridCompact : FILTER.barGridDesktop}>
          {searchControl && (
            <div className={`flex ${filterStyles.controlHeight} min-w-0 flex-1 items-center`}>
              {renderControl(searchControl)}
            </div>
          )}
          {gridFilters.map(control => (
            <div
              key={control.key}
              className={`flex ${filterStyles.controlHeight} min-w-0 flex-1 items-center`}
            >
              {renderControl(control)}
            </div>
          ))}
        </div>
        {config.quickFilters && config.quickFilters.length > 0 && (
          <div className="mt-space-2 flex items-center">
            <QuickFilters
              presets={config.quickFilters}
              activePresetId={activePresetId}
              onPresetClick={applyPreset}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Config-driven filter bar with breakpoint-specific layouts.
 */
export const FilterBar: React.FC<FilterBarProps> = ({ config, value, onChange, className }) => {
  const breakpoint = useBreakpoint();
  const isMedium = breakpoint === 'md';
  const isSmall = isBreakpointAtMost(breakpoint, 'sm');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { filters, setFilter, clearAll, isFilterActive, setFilters } = useFilterState({
    initialFilters: value,
    onChange,
  });

  React.useEffect(() => {
    setFilters(value);
  }, [value, setFilters]);

  const { applyPreset, activePresetId } = useQuickFilters({
    presets: config.quickFilters || [],
    filters,
    onApplyPreset: preset => {
      const merged = { ...filters, ...preset.preset };
      Object.keys(merged).forEach(key => {
        setFilter(key, merged[key]);
      });
    },
  });

  const activeBadges = useMemo(
    () => collectActiveBadges(config, filters, isFilterActive),
    [filters, config, isFilterActive]
  );

  const renderControl = (control: FilterControl) => (
    <FilterFactory
      key={control.key}
      control={control}
      value={filters}
      onChange={setFilter}
      className="w-full"
    />
  );

  const nonSearchControls = config.primaryFilters.controls.filter(c => c.type !== 'search');
  const searchControl = config.primaryFilters.controls.find(c => c.type === 'search');
  const gridFilters = nonSearchControls.slice(0, 3);

  if (isSmall) {
    return (
      <div className={`${filterStyles.container} ${className || ''}`}>
        <div className={FILTER.barInsetCompact}>
          <div className={FILTER.mobileGrid}>
            {searchControl && (
              <div className={`flex ${filterStyles.controlHeight} w-full items-center`}>
                {renderControl(searchControl)}
              </div>
            )}
            {nonSearchControls.length > 0 && (
              <div className="relative flex shrink-0">
                <Button {...actionButtonPreset('filter')} size="sm" onClick={() => setIsModalOpen(true)}>
                  Filters
                </Button>
                {activeBadges.length > 0 && (
                  <Badge
                    variant="primary"
                    size="xs"
                    className="absolute -top-space-1 -right-space-1 min-w-[18px] h-4 px-space-1 flex items-center justify-center"
                  >
                    {activeBadges.length}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
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
  }

  return (
    <FilterBarInlineGrid
      config={config}
      className={className}
      compact={isMedium}
      searchControl={searchControl}
      gridFilters={gridFilters}
      renderControl={renderControl}
      activePresetId={activePresetId}
      applyPreset={applyPreset}
    />
  );
};
