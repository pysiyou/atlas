/**
 * CheckboxList Component
 * 
 * Inline checkbox list for filter options with clean styling.
 * Shows all options directly without popovers.
 */

import React from 'react';
import { Icon } from './Icon';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';
import { neutralColors } from '@/shared/design-system/tokens/colors';
import { transitions } from '@/shared/design-system/tokens/animations';

/**
 * Props for CheckboxList component
 */
export interface CheckboxListProps {
  /** Available options to display */
  options: { id: string; label: string; color?: string }[];
  /** Currently selected option IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onChange: (selectedIds: string[]) => void;
  /** Custom className */
  className?: string;
}

/**
 * CheckboxList Component
 * 
 * Displays a list of checkboxes for multi-select filtering.
 * Options are visible inline without requiring popover interaction.
 * 
 * @component
 */
export const CheckboxList: React.FC<CheckboxListProps> = ({
  options,
  selectedIds,
  onChange,
  className,
}) => {
  const handleToggle = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    onChange(newSelected);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {options.map(option => {
        const isSelected = selectedIds.includes(option.id);
        return (
          <label
            key={option.id}
            className={cn(
              'flex items-center gap-3 cursor-pointer group py-1',
              transitions.colors
            )}
          >
            {/* Checkbox */}
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(option.id)}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center',
                  transitions.colors,
                  isSelected
                    ? 'bg-brand border-brand'
                    : cn('border-border-strong', 'group-hover:border-brand/50')
                )}
              >
                {isSelected && (
                  <Icon
                    name={ICONS.actions.check}
                    className="w-3 h-3 text-white"
                  />
                )}
              </div>
            </div>

            {/* Label */}
            <span
              className={cn(
                'text-sm',
                isSelected ? neutralColors.text.primary : neutralColors.text.secondary,
                'group-hover:text-text-primary',
                transitions.colors
              )}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
};
