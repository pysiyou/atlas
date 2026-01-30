/**
 * ReportFilters Component
 * Responsive filter controls for validated test reports
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon, Button, Badge, Modal } from '@/shared/ui';
import { DateFilter } from '@/features/order/components/DateFilter';
import { cn, ICONS } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';

/**
 * Props interface for ReportFilters component
 */
export interface ReportFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
}

// Date preset options
const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7days', label: 'Last 7 Days' },
  { id: 'last30days', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
] as const;

type DatePresetId = (typeof DATE_PRESETS)[number]['id'];

/**
 * Get date range from preset ID
 */
const getDateRangeFromPreset = (presetId: DatePresetId): [Date, Date] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (presetId) {
    case 'today':
      return [today, new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)];
    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return [yesterday, new Date(today.getTime() - 1)];
    }
    case 'last7days': {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return [weekAgo, now];
    }
    case 'last30days': {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return [monthAgo, now];
    }
    case 'thisMonth': {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return [firstDayOfMonth, now];
    }
    case 'lastMonth': {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return [firstDayLastMonth, lastDayLastMonth];
    }
    default:
      return [today, now];
  }
};

/**
 * Check if a date range matches a preset
 */
const getActivePresetId = (dateRange: [Date, Date] | null): DatePresetId | null => {
  if (!dateRange) return null;

  for (const preset of DATE_PRESETS) {
    const presetRange = getDateRangeFromPreset(preset.id);
    const startMatch = dateRange[0].toDateString() === presetRange[0].toDateString();
    const endMatch = dateRange[1].toDateString() === presetRange[1].toDateString();
    if (startMatch && endMatch) return preset.id;
  }
  return null;
};

/**
 * ModalDateBadges - Badge-style date range selector for modal
 */
const ModalDateBadges: React.FC<{
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
}> = ({ value, onChange }) => {
  const activePresetId = getActivePresetId(value);

  const handlePresetClick = (presetId: DatePresetId) => {
    if (activePresetId === presetId) {
      onChange(null);
    } else {
      onChange(getDateRangeFromPreset(presetId));
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DATE_PRESETS.map(preset => {
        const isActive = activePresetId === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors',
              isActive
                ? 'bg-action-primary border-action-primary text-text-inverse'
                : 'bg-surface-default border-border-default text-text-secondary hover:border-action-primary hover:bg-action-primary-muted-bg'
            )}
          >
            {preset.label}
          </button>
        );
      })}
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
        'group relative w-full flex items-center gap-2',
        'h-9',
        'px-3 bg-surface-default border border-border-strong rounded-md',
        'hover:bg-surface-canvas',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-action-primary/30',
        'focus-within:border-action-primary',
        'transition-colors'
      )}
    >
      <Icon
        name={ICONS.actions.search}
        className="text-text-muted group-hover:text-action-primary w-3.5 h-3.5 shrink-0 transition-colors"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className="flex-1 min-w-0 text-xs font-medium bg-transparent border-0 outline-none py-0 placeholder:font-normal placeholder:text-text-muted"
      />
      <div className="flex items-center gap-1 shrink-0">
        {isDebouncing && (
          <div className="w-4 h-4 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
        )}
        {localValue && !isDebouncing && (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-surface-canvas rounded transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Clear search"
          >
            <Icon
              name={ICONS.actions.closeCircle}
              className="w-4 h-4 text-text-muted hover:text-text-tertiary"
            />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * ReportFilters - Responsive filter layout
 * - lg+: 2-column grid (search + date)
 * - md: 2-column grid
 * - sm/xs: Search bar + Filters button (opens modal with date filter)
 */
export const ReportFilters: React.FC<ReportFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}) => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Count active filters for badge
  const activeFilterCount = dateRange ? 1 : 0;

  // Check if we should show modal view (sm and below)
  const showModalView = isBreakpointAtMost(breakpoint, 'sm');

  /**
   * Render all filter controls (used in both inline and modal views)
   */
  const renderFilters = () => (
    <>
      {/* Search */}
      <div className="flex h-9 w-full items-center">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by test ID, order ID, patient name, or test name..."
        />
      </div>

      {/* Date Range */}
      <div className="flex h-9 w-full items-center">
        <DateFilter
          value={dateRange}
          onChange={onDateRangeChange}
          placeholder="Filter by date range"
          className="w-full"
        />
      </div>
    </>
  );

  // Mobile view: Search bar + Filters button
  if (showModalView) {
    return (
      <>
        <div className="w-full bg-surface-default border-b border-border-default">
          <div className="px-3 py-2 w-full">
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
              {/* Search control */}
              <div className="flex h-9 w-full items-center">
                <SearchInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder="Search reports..."
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
          <div className="flex flex-col h-full bg-surface-default">
            {/* Filter Controls - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Search Section */}
              <div className="mb-6">
                <div className="relative w-full flex items-center h-10 px-4 bg-surface-default border border-border-default rounded-lg focus-within:border-action-primary transition-colors">
                  <input
                    type="text"
                    placeholder="Search reports..."
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
                {/* Date Range Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-text mb-3">Date Range</h4>
                  <ModalDateBadges
                    value={dateRange}
                    onChange={onDateRangeChange}
                  />
                </div>
              </div>
            </div>

            {/* Footer with Filter Button */}
            <div className="px-5 py-4 border-t border-border-default bg-surface-default shrink-0">
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    onDateRangeChange(null);
                  }}
                  className="w-full mb-3 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Clear all filters
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-3 bg-action-primary hover:opacity-90 text-text-inverse font-medium rounded-lg transition-colors"
              >
                Filter
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Desktop/Tablet view: 2-column grid
  return (
    <div className="w-full bg-surface-default border-b border-border-default">
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        <div className="grid grid-cols-2 gap-3 lg:gap-4 items-center w-full">
          {renderFilters()}
        </div>
      </div>
    </div>
  );
};
