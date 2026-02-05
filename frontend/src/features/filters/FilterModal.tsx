/**
 * FilterModal Component
 * Modal interface for filters on small screens
 *
 * Displays all filter controls in a modal dialog for small screen devices.
 * Provides a clean, scrollable interface with all filters and quick filters.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/shared/ui';
import { CheckboxList } from '@/shared/ui';
import { Icon, FooterInfo } from '@/shared/ui';
import { ICONS } from '@/utils';
import { cn } from '@/utils';
import { inputContainerBase, inputInner, inputText } from '@/shared/ui/forms/inputStyles';
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
    <div className={cn(inputContainerBase, 'flex items-center h-10 px-4')}>
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(inputInner, inputText)}
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="p-0.5 hover:bg-panel-hover rounded transition-colors flex items-center justify-center cursor-pointer"
        >
          <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-fg-subtle" />
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
      <p className="text-sm text-fg-subtle mb-4">Move the slider to change prices</p>

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

      {/* Price labels */}
      <div className="flex justify-between text-lg font-medium text-fg">
        <span>{currency}{localValue[0]}</span>
        <span>{currency}{localValue[1]}</span>
      </div>
    </div>
  );
};

import { DATE_PRESETS, getDateRangeFromPreset, getActivePresetId, type DatePreset } from '@/utils/dateHelpers';

type DatePresetId = DatePreset;

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
                  'w-5 h-5 rounded-full flex items-center justify-center transition-colors',
                  isSelected ? 'bg-brand' : 'bg-transparent border-2 border-stroke-strong group-hover:border-brand'
                )}
              >
                {isSelected && (
                  <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                )}
              </div>
            </div>
            <span className={cn(
              'text-sm transition-colors',
              isSelected ? 'text-fg' : 'text-fg-muted group-hover:text-fg'
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
          <div className="text-sm text-fg-subtle italic">
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
      <div className="flex flex-col h-full bg-panel">
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
                  <h4 className="text-sm font-semibold text-fg mb-3">
                    {control.label}
                  </h4>
                  {/* Filter Options */}
                  {renderModalControl(control)}
                  {/* Separator line (except for last item) */}
                  {index < allFilterControls.length - 1 && (
                    <div className="border-b border-stroke mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Filter Button */}
        <div className="px-5 py-4 border-t border-stroke bg-panel shrink-0">
          {activeBadges.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full mb-3 text-sm text-fg-subtle hover:text-fg-muted transition-colors"
            >
              Clear all filters
            </button>
          )}
          <div className="flex items-center justify-between gap-3">
            <FooterInfo icon={ICONS.actions.filter} text="Filtering results" />
            <button
              onClick={handleApplyFilters}
              className="px-4 py-3 bg-brand hover:opacity-90 text-fg-inverse font-medium rounded-lg transition-colors"
            >
              Filter
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
