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
import { dropdown, dropdownContent, dropdownItem, dropdownSeparator, dropdownFooter } from '@/shared/design-system/tokens/components/dropdown';
import { neutralColors, brandColors } from '@/shared/design-system/tokens/colors';

/**
 * Option item for the filter
 */
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
        dropdownItem.base,
        dropdownItem.hover,
        isSelected && dropdownItem.selected
      )}
    >
      {/* Checkbox/Radio */}
      <div className={dropdownItem.checkbox.container}>
        <input
          type={singleSelect ? 'radio' : 'checkbox'}
          checked={isSelected}
          onChange={onToggle}
          className="sr-only"
        />
        {singleSelect ? (
          // Circular radio button style for single-select
          isSelected ? (
            <div className={cn(dropdownItem.checkbox.radio.checked)}>
              <div className={dropdownItem.checkbox.radio.inner} />
            </div>
          ) : (
            <div className={dropdownItem.checkbox.radio.unchecked} />
          )
        ) : // Square checkbox style for multi-select
        isSelected ? (
          <div className={cn(dropdownItem.checkbox.checked, 'transition-all duration-150')}>
            <Icon name={ICONS.actions.check} className={dropdownItem.checkbox.icon} />
          </div>
        ) : (
          <div className={cn(dropdownItem.checkbox.unchecked, 'transition-all duration-150')} />
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
      return <span className={neutralColors.text.muted}>{placeholder || `Select ${label}...`}</span>;
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
      <span className={cn(neutralColors.text.secondary, 'truncate block')}>
        <span className={cn('inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-white text-xxs font-medium align-middle mr-1', brandColors.primary.backgroundMedium)}>
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
            dropdown.trigger.base,
            isOpen ? dropdown.trigger.open : dropdown.trigger.default,
            className
          )}
        >
          {/* Column 1: Left Icon */}
          {icon && <Icon name={icon} className={dropdown.icon} />}

          {/* Column 2: Content - flexible middle */}
          <div className={dropdown.content}>
            {renderTriggerContent()}
          </div>

          {/* Column 3: Right Icons (clear + chevron) - close icon always reserves space */}
          <div className={dropdown.rightIcons}>
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
                className={dropdown.clearButton}
                aria-label="Clear selection"
              >
                <Icon name={ICONS.actions.closeCircle} className={dropdown.clearIcon} />
              </button>
            ) : (
              <div className={dropdown.clearButtonPlaceholder} />
            )}
            <Icon
              name={ICONS.actions.chevronDown}
              className={cn(dropdown.chevron, isOpen && 'rotate-180')}
            />
          </div>
        </div>
      )}
      className={dropdownContent.minWidth}
    >
      {() => (
        <div className={dropdownContent.container}>
          {/* Options list */}
          <div className={dropdownContent.optionsList}>
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
            <div className={dropdownSeparator.base}>
              {/* Select all - only show for multi-select */}
              {showSelectAll && !singleSelect && options.length > 0 && (
                <div className={dropdownFooter.container}>
                  <label className={dropdownFooter.selectAll.container}>
                    <div className={dropdownItem.checkbox.container}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="sr-only"
                      />
                      {allSelected || someSelected ? (
                        <div className={cn(dropdownItem.checkbox.checked, 'transition-all duration-150')}>
                          {allSelected ? (
                            <Icon name={ICONS.actions.check} className={dropdownItem.checkbox.icon} />
                          ) : (
                            <Minus className={dropdownItem.checkbox.icon} />
                          )}
                        </div>
                      ) : (
                        <div className={cn(dropdownItem.checkbox.unchecked, 'transition-all duration-150')} />
                      )}
                    </div>
                    <span className={dropdownFooter.selectAll.label}>
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
                  className={dropdownFooter.clearButton.base}
                >
                  <Icon name={ICONS.actions.closeCircle} className={dropdownFooter.clearButton.icon} />
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
