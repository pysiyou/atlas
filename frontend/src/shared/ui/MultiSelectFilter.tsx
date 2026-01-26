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
import { Minus } from 'lucide-react';
import { Popover } from './Popover';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';
import { Badge } from './Badge';
import { Icon, type IconName } from './Icon';

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
        'hover:bg-surface-hover transition-colors',
        isSelected && 'bg-surface'
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
          // Circular radio button style for single-select
          isSelected ? (
            <div className="w-4 h-4 rounded-full border-2 border-brand flex items-center justify-center bg-white">
              <div className="w-2 h-2 rounded-full bg-brand" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-border bg-white" />
          )
        ) : // Square checkbox style for multi-select
        isSelected ? (
          <div className="w-4 h-4 rounded border-2 border-brand bg-brand flex items-center justify-center transition-all duration-150">
            <Icon name={ICONS.actions.check} className="w-3 h-3 text-white" />
          </div>
        ) : (
          <div className="w-4 h-4 rounded border-2 border-border bg-white transition-all duration-150" />
        )}
      </div>

      {/* Badge */}
      <Badge variant={option.color || 'default'} size="sm">
        {option.label.toUpperCase()}
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

  // Check if some but not all options are selected
  const someSelected = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < options.length,
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
      return <span className="text-text-tertiary">{placeholder || `Select ${label}...`}</span>;
    }

    if (singleSelectedOption) {
      // Show badge for single selection
      return (
        <Badge variant={singleSelectedOption.color || 'default'} size="xs">
          {singleSelectedOption.label.toUpperCase()}
        </Badge>
      );
    }

    // Show count for multiple selections – single line so truncate works
    return (
      <span className="text-text-secondary truncate block">
        <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-white text-xxs font-medium align-middle mr-1 bg-brand">
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
      trigger={({ isOpen }) => (
        <div
          className={cn(
            'h-[34px] px-3 bg-surface border rounded-md flex items-center gap-2 cursor-pointer transition-colors text-xs',
            isOpen ? 'border-brand ring-2 ring-brand/20' : 'border-border-strong hover:border-border-strong',
            className
          )}
        >
          {/* Column 1: Left Icon */}
          {icon && <Icon name={icon} className="w-4 h-4 text-text-muted flex-shrink-0" />}

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
                <Icon name={ICONS.actions.closeCircle} className="w-3.5 h-3.5 text-text-disabled" />
              </button>
            ) : (
              <div className="w-4" />
            )}
            <Icon
              name={ICONS.actions.chevronDown}
              className={cn('w-4 h-4 text-text-disabled transition-transform', isOpen && 'rotate-180')}
            />
          </div>
        </div>
      )}
      className="min-w-[200px]"
    >
      {() => (
        <div className="bg-surface border border-border rounded-md shadow-lg py-2">
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

          {/* Footer actions - Select all (multi-select) and Clear */}
          {(showSelectAll && !singleSelect && options.length > 0) || selectedIds.length > 0 ? (
            <div className="border-t border-border mt-2 pt-2">
              {/* Select all - only show for multi-select */}
              {showSelectAll && !singleSelect && options.length > 0 && (
                <div className="px-3 py-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="sr-only"
                      />
                      {allSelected || someSelected ? (
                        <div className="w-4 h-4 rounded border-2 border-brand bg-brand flex items-center justify-center transition-all duration-150">
                          {allSelected ? (
                            <Icon name={ICONS.actions.check} className="w-3 h-3 text-white" />
                          ) : (
                            <Minus className="w-3 h-3 text-white" />
                          )}
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border-2 border-border bg-white transition-all duration-150" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-text-primary">
                      {selectAllLabel}
                    </span>
                  </label>
                </div>
              )}

              {/* Clear button - show when there are selections */}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleClear(e);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                  <Icon name={ICONS.actions.closeCircle} className="w-4 h-4" />
                  <span>Clear selection</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}
    </Popover>
  );
};
