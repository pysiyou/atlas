/**
 * SingleSelectControl Component
 * Single-select dropdown for filters
 */

import React from 'react';
import { brandColors, neutralColors } from '@/shared/design-system/tokens/colors';
import { Popover } from '@/shared/ui/Popover';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/utils';
import type { SingleSelectFilterControl } from '../types';
import { ICONS } from '@/utils/icon-mappings';
import { dropdown, dropdownContent, dropdownItem } from '@/shared/design-system/tokens/components/dropdown';

/**
 * Props for SingleSelectControl component
 */
export interface SingleSelectControlProps {
  /** Currently selected option ID */
  value: string | null;
  /** Callback when selection changes */
  onChange: (value: string | null) => void;
  /** Filter control configuration */
  config: SingleSelectFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * SingleSelectControl Component
 *
 * Provides a single-select dropdown similar to MultiSelectFilter but for single selection.
 *
 * @component
 */
export const SingleSelectControl: React.FC<SingleSelectControlProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  const selectedOption = config.options.find(opt => opt.id === value);

  /**
   * Handle option selection
   */
  const handleSelect = (optionId: string) => {
    if (value === optionId) {
      // Deselect if already selected
      onChange(null);
    } else {
      onChange(optionId);
    }
  };

  /**
   * Handle clear
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  /**
   * Render trigger content
   */
  const renderTriggerContent = () => {
    if (!selectedOption) {
      return (
        <span className={neutralColors.text.muted}>
          {config.placeholder || `Select ${config.label.toLowerCase()}...`}
        </span>
      );
    }

    return (
      <Badge variant={selectedOption.color || 'default'} size="xs">
        {selectedOption.label.toUpperCase()}
      </Badge>
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
          {/* Icon */}
          {config.icon && (
            <Icon name={config.icon as IconName} className={dropdown.icon} />
          )}

          {/* Content */}
          <div className={dropdown.content}>{renderTriggerContent()}</div>

          {/* Chevron */}
          <Icon
            name={ICONS.actions.chevronDown}
            className={cn(dropdown.chevron, isOpen && 'rotate-180')}
          />

          {/* Clear button */}
          {value && (
            <button
              onClick={handleClear}
              className={dropdown.clearButton}
            >
              <Icon name={ICONS.actions.closeCircle} className={dropdown.clearIcon} />
            </button>
          )}
        </div>
      )}
      className=""
    >
      {() => (
        <div className={dropdownContent.container}>
          {/* Options list */}
          <div className={dropdownContent.optionsList}>
            {config.options.map(option => {
              const isSelected = value === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={cn(
                    dropdownItem.base,
                    dropdownItem.hover,
                    isSelected && dropdownItem.selected,
                    'text-left'
                  )}
                >
                  {/* Check indicator */}
                  <div className={dropdownItem.checkbox.container}>
                    {isSelected ? (
                      <div className={cn(dropdownItem.checkbox.checked, 'transition-all duration-150')}>
                        <Icon name={ICONS.actions.check} className={dropdownItem.checkbox.icon} />
                      </div>
                    ) : (
                      <div className={dropdownItem.checkbox.unchecked} />
                    )}
                  </div>

                  {/* Badge */}
                  <Badge variant={option.color || 'default'} size="sm">
                    {option.label.toUpperCase()}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Popover>
  );
};
