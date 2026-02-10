/**
 * MultiSelectFilter Component
 *
 * A filter component with a popover for multi-select options with checkboxes.
 * Inspired by the cargoplan ListSelector component.
 *
 * Features:
 * - Multi-select with checkboxes
 * - Colored badges for each option
 * - "Select all" functionality
 * - Clear button to reset selection
 * - Shows count when multiple selected, badge when single selected
 */

import React, { useCallback, useMemo } from 'react';
import { Popover } from '../overlay/Popover';
import { cn, uppercaseLabel, ICONS } from '@/utils';
import { Badge } from '../display/Badge';
import { Icon, type IconName } from '../display/Icon';
import { inputTrigger, inputTriggerOpen } from './inputStyles';

/**
 * Option item for the filter
 */
export interface FilterOption {
  id: string;
  label: string;
  /** Badge color variant */
  color?: string;
}

/**
 * Props for the MultiSelectFilter component
 */
export interface MultiSelectFilterProps {
  /** Label for the filter trigger button */
  label: string;
  /** Available options to select from */
  options: FilterOption[];
  /** Currently selected option IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onChange: (selectedIds: string[]) => void;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Whether to show the select all option */
  showSelectAll?: boolean;
  /** Label for select all (default: "Tout sélectionner") */
  selectAllLabel?: string;
  /** Custom className for the trigger button */
  className?: string;
  /** Optional icon to display before the label */
  icon?: IconName;
  /** Whether to use single-select mode (circular checkboxes/radio buttons) */
  singleSelect?: boolean;
}

/**
 * ListItem - Individual option in the filter list
 */
const ListItem: React.FC<{
  option: FilterOption;
  isSelected: boolean;
  onToggle: () => void;
  singleSelect?: boolean;
}> = ({ option, isSelected, onToggle, singleSelect = false }) => {
  return (
    <label
      className={cn(
        'flex items-center gap-3 px-3 py-2 text-sm cursor-pointer',
        'hover:bg-panel-hover transition-colors',
        isSelected && 'bg-panel'
      )}
    >
      {/* Checkbox/Radio */}
      <div className="flex items-center justify-center">
        <input
          type={singleSelect ? 'radio' : 'checkbox'}
          checked={isSelected}
          onChange={onToggle}
          className="sr-only"
        />
        {singleSelect ? (
          // Same checkmark as PaymentMethodSelector: circle + check when selected
          <div
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-200',
              isSelected ? 'bg-brand' : 'bg-transparent border-2 border-stroke'
            )}
          >
            {isSelected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
          </div>
        ) : // Square checkbox style for multi-select
        isSelected ? (
          <div className="w-4 h-4 rounded border-2 border-brand bg-brand flex items-center justify-center transition-all duration-150">
            <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
          </div>
        ) : (
          <div className="w-4 h-4 rounded border-2 border-stroke bg-panel transition-all duration-150" />
        )}
      </div>

      {/* Badge */}
      <Badge variant={option.color || 'default'} size="sm">
        {uppercaseLabel(option.label)}
      </Badge>
    </label>
  );
};

/**
 * MultiSelectFilter Component
 */
// Large component is necessary for comprehensive multi-select filter with popover, checkboxes, badges, select all, and clear functionality
// eslint-disable-next-line max-lines-per-function
export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  options,
  selectedIds,
  onChange,
  placeholder,
  showSelectAll = true,
  selectAllLabel = 'Select all',
  className = '',
  icon,
  singleSelect = false,
}) => {
  // Check if all options are selected
  const allSelected = useMemo(
    () => options.length > 0 && selectedIds.length === options.length,
    [options.length, selectedIds.length]
  );

  // Handle toggling a single option
  const handleToggle = useCallback(
    (id: string) => {
      if (singleSelect) {
        // For single-select: replace selection with the clicked option
        // If clicking the same option, deselect it (allow clearing)
        const newSelected = selectedIds.includes(id) ? [] : [id];
        onChange(newSelected);
      } else {
        // For multi-select: toggle the option
        const newSelected = selectedIds.includes(id)
          ? selectedIds.filter(selectedId => selectedId !== id)
          : [...selectedIds, id];
        onChange(newSelected);
      }
    },
    [selectedIds, onChange, singleSelect]
  );

  // Handle select all / deselect all
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map(opt => opt.id));
    }
  }, [allSelected, options, onChange]);

  // Handle clearing selection
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  // Get single selected option for display
  const singleSelectedOption = useMemo(() => {
    if (selectedIds.length === 1) {
      return options.find(opt => opt.id === selectedIds[0]);
    }
    return null;
  }, [selectedIds, options]);

  // Render the trigger content
  const renderTriggerContent = () => {
    if (selectedIds.length === 0) {
      return <span className="text-fg-subtle whitespace-nowrap overflow-hidden truncate">{placeholder || `Select ${label}...`}</span>;
    }

    if (singleSelectedOption) {
      // Show badge for single selection
      return (
        <Badge variant={singleSelectedOption.color || 'default'} size="xs">
          {uppercaseLabel(singleSelectedOption.label)}
        </Badge>
      );
    }

    // Show count for multiple selections – single line so truncate works
    return (
      <span className="text-fg-muted truncate block whitespace-nowrap">
        <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-on-brand text-xxs font-normal align-middle mr-1 bg-brand">
          {selectedIds.length}
        </span>
        selected
      </span>
    );
  };

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }: { isOpen: boolean }) => (
        <div
          className={cn(
            inputTrigger,
            'text-xs',
            isOpen && inputTriggerOpen,
            className
          )}
        >
          {/* Column 1: Left Icon */}
          {icon && <Icon name={icon} className="w-4 h-4 text-fg-faint group-hover:text-brand flex-shrink-0 transition-colors" />}

          {/* Column 2: Content - flexible middle */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {renderTriggerContent()}
          </div>

          {/* Column 3: Right Icons (clear + chevron) - close icon always reserves space */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {selectedIds.length > 0 ? (
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClear(e);
                }}
                onMouseDown={e => {
                  // Prevent popover from opening when clicking clear button
                  // But don't prevent default on the button itself to allow onClick to fire
                  e.stopPropagation();
                }}
                className="p-0.5 -mr-1 hover:bg-neutral-100 rounded transition-colors flex items-center justify-center"
                aria-label="Clear selection"
              >
                <Icon name={ICONS.actions.closeCircle} className="w-3.5 h-3.5 text-fg-faint" />
              </button>
            ) : (
              <div className="w-4" />
            )}
            <Icon
              name={ICONS.actions.chevronDown}
              className={cn('w-4 h-4 text-fg-faint transition-transform', isOpen && 'rotate-180')}
            />
          </div>
        </div>
      )}
      className="min-w-[200px]"
    >
      {() => (
        <div className="bg-panel border border-stroke rounded-md shadow-lg py-2">
          {/* Options list */}
          <div className="max-h-[300px] overflow-y-auto">
            {options.map(option => (
              <ListItem
                key={option.id}
                option={option}
                isSelected={selectedIds.includes(option.id)}
                onToggle={() => handleToggle(option.id)}
                singleSelect={singleSelect}
              />
            ))}
          </div>

          {/* Footer actions - Select all / Deselect all (multi-select) */}
          {showSelectAll && !singleSelect && options.length > 0 && (
            <div className="border-t border-stroke mt-2 pt-2">
              <div className="px-3 py-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="sr-only"
                    />
                    {allSelected ? (
                      <div className="w-4 h-4 rounded border-2 border-brand bg-brand flex items-center justify-center transition-all duration-150">
                        <Icon name={ICONS.actions.cross} className="w-3 h-3 text-on-brand" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border-2 border-brand bg-brand flex items-center justify-center transition-all duration-150">
                        <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-normal text-fg">
                    {allSelected ? 'Deselect all' : selectAllLabel}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </Popover>
  );
};
