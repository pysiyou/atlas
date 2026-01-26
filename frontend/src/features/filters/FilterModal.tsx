/**
 * FilterModal Component
 * Modal interface for filters on small screens
 *
 * Displays all filter controls in a modal dialog for small screen devices.
 * Provides a clean, scrollable interface with all filters and quick filters.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { CheckboxList } from '@/shared/ui/CheckboxList';
import { Icon } from '@/shared/ui/Icon';
import { ICONS } from '@/utils/icon-mappings';
import { cn } from '@/utils';
import { QuickFilters } from './QuickFilters';
import type { FilterConfig, ActiveFilterBadge, FilterValues } from './types';

/**
 * Props for FilterModal component
 */
export interface FilterModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Filter configuration */
  config: FilterConfig;
  /** Current filter values */
  filters: FilterValues;
  /** Callback to set a filter value */
  setFilter: (key: string, value: unknown) => void;
  /** Active filter badges (used for Clear All visibility) */
  activeBadges: ActiveFilterBadge[];
  /** Callback to clear all filters */
  onClearAll: () => void;
  /** Currently active quick filter preset ID */
  activePresetId: string | null;
  /** Callback when a quick filter preset is clicked */
  onPresetClick: (presetId: string) => void;
}

/**
 * Modal Search Input Component
 * Clean search input for modal filter
 */
const ModalSearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Company, skill, tag...' }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className="relative w-full flex items-center h-10 px-4 bg-surface border border-border rounded-lg focus-within:border-brand transition-colors">
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className="flex-1 min-w-0 text-sm bg-transparent border-0 outline-none placeholder:text-text-muted"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="p-0.5 hover:bg-surface-hover rounded transition-colors flex items-center justify-center cursor-pointer"
        >
          <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-text-muted" />
        </button>
      )}
    </div>
  );
};

/**
 * Modal Price Range Slider Component
 * Dual-thumb slider for price range in modal
 */
const ModalPriceSlider: React.FC<{
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  currency?: string;
}> = ({ value, onChange, min, max, currency = '$' }) => {
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
      <p className="text-sm text-text-tertiary mb-4">Move the slider to change prices</p>

      {/* Slider Track */}
      <div className="relative h-1 mb-6">
        {/* Background track */}
        <div className="absolute inset-0 bg-border rounded-full" />

        {/* Active track */}
        <div
          className="absolute h-full bg-amber-400 rounded-full"
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
          className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: localValue[0] > max - 10 ? 5 : 3 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Price labels */}
      <div className="flex justify-between text-lg font-medium text-neutral-900">
        <span>{currency}{localValue[0]}</span>
        <span>{currency}{localValue[1]}</span>
      </div>
    </div>
  );
};

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
 * Modal Date Badges Component
 * Badge-style date range selector for modal
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
              'px-2 py-1 text-xxs font-medium rounded cursor-pointer',
              'filter-chip',
              isActive && 'filter-chip--active'
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
 * Modal Radio List Component
 * Radio button list for single-select in modal
 */
const ModalRadioList: React.FC<{
  options: { id: string; label: string }[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  columns?: 1 | 2;
}> = ({ options, selectedId, onChange, columns = 1 }) => {
  const handleSelect = (id: string) => {
    onChange(selectedId === id ? null : id);
  };

  return (
    <div className={cn(
      columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2'
    )}>
      {options.map(option => {
        const isSelected = selectedId === option.id;
        return (
          <label
            key={option.id}
            className="flex items-center gap-3 cursor-pointer group py-1 transition-colors"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="radio"
                checked={isSelected}
                onChange={() => handleSelect(option.id)}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-colors',
                  isSelected
                    ? 'border-amber-400 bg-white'
                    : 'border-neutral-300 bg-white group-hover:border-amber-300'
                )}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                )}
              </div>
            </div>
            <span className={cn(
              'text-sm transition-colors',
              isSelected ? 'text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'
            )}>
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
};

/**
 * FilterModal Component
 *
 * Provides a modal interface for filters on small screens with:
 * - Clean white card styling
 * - Bold section headers with line separators
 * - Yellow/gold Filter button
 *
 * @component
 */
export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  config,
  filters,
  setFilter,
  activeBadges,
  onClearAll,
  activePresetId,
  onPresetClick,
}) => {
  // Get search and non-search controls
  const searchControl = config.primaryFilters.controls.find(c => c.type === 'search');
  const nonSearchControls = config.primaryFilters.controls.filter(c => c.type !== 'search');
  const advancedControls = config.advancedFilters?.controls || [];
  const allFilterControls = [...nonSearchControls, ...advancedControls];

  /**
   * Handle apply filters and close
   */
  const handleApplyFilters = () => {
    onClose();
  };

  /**
   * Render a modal-specific filter control
   */
  const renderModalControl = (control: (typeof allFilterControls)[0]) => {
    const filterValue = filters[control.key];

    switch (control.type) {
      case 'multiSelect':
        return (
          <CheckboxList
            options={control.options}
            selectedIds={(filterValue as string[]) || []}
            onChange={value => setFilter(control.key, value)}
            columns={control.options.length > 4 ? 2 : 1}
          />
        );

      case 'singleSelect':
        return (
          <ModalRadioList
            options={control.options}
            selectedId={(filterValue as string | null) || null}
            onChange={value => setFilter(control.key, value)}
            columns={control.options.length > 4 ? 2 : 1}
          />
        );

      case 'priceRange': {
        const min = control.min ?? 0;
        const max = control.max ?? 10000;
        const currentValue = (filterValue as [number, number]) || [min, max];
        return (
          <ModalPriceSlider
            value={currentValue}
            onChange={value => setFilter(control.key, value)}
            min={min}
            max={max}
            currency={control.currency}
          />
        );
      }

      case 'dateRange':
        return (
          <ModalDateBadges
            value={(filterValue as [Date, Date] | null) || null}
            onChange={value => setFilter(control.key, value)}
          />
        );

      default:
        // For other control types (ageRange), fall back to label only
        return (
          <div className="text-sm text-neutral-500 italic">
            Use the main filter bar for this filter type
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter"
      size="md"
    >
      <div className="flex flex-col h-full bg-white">
        {/* Filter Controls - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Search Control */}
          {searchControl && (
            <div className="mb-6">
              <ModalSearchInput
                value={(filters[searchControl.key] as string) || ''}
                onChange={value => setFilter(searchControl.key, value)}
                placeholder={searchControl.placeholder}
              />
            </div>
          )}

          {/* Quick Filters */}
          {config.quickFilters && config.quickFilters.length > 0 && (
            <div className="mb-6">
              <QuickFilters
                presets={config.quickFilters}
                activePresetId={activePresetId}
                onPresetClick={onPresetClick}
              />
            </div>
          )}

          {/* All Filter Controls - Each with its own label */}
          {allFilterControls.length > 0 && (
            <div className="space-y-5">
              {allFilterControls.map((control, index) => (
                <div key={control.key} className="w-full">
                  {/* Filter Label */}
                  <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                    {control.label}
                  </h4>
                  {/* Filter Options */}
                  {renderModalControl(control)}
                  {/* Separator line (except for last item) */}
                  {index < allFilterControls.length - 1 && (
                    <div className="border-b border-neutral-200 mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Filter Button */}
        <div className="px-5 py-4 border-t border-neutral-100 bg-white shrink-0">
          {activeBadges.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full mb-3 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
          <button
            onClick={handleApplyFilters}
            className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
          >
            Filter
          </button>
        </div>
      </div>
    </Modal>
  );
};
