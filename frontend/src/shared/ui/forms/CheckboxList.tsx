/**
 * CheckboxList Component
 *
 * Inline checkbox list for filter options with clean styling.
 * Shows all options directly without popovers.
 */

import React from 'react';
import { Icon } from '../display/Icon';
import { cn } from '@/utils';
import { ICONS } from '@/utils';

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
  /** Number of columns for grid layout */
  columns?: 1 | 2;
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
  columns = 1,
}) => {
  const handleToggle = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    onChange(newSelected);
  };

  return (
    <div className={cn(
      columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2',
      className
    )}>
      {options.map(option => {
        const isSelected = selectedIds.includes(option.id);
        return (
          <label
            key={option.id}
            className="flex items-center gap-3 cursor-pointer group py-1 transition-colors duration-200"
          >
            {/* Square Checkbox */}
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(option.id)}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-[18px] h-[18px] rounded-sm border flex items-center justify-center transition-colors duration-200',
                  isSelected
                    ? 'bg-brand border-brand'
                    : 'border-border-strong bg-surface group-hover:border-brand'
                )}
              >
                {isSelected && (
                  <Icon
                    name={ICONS.actions.check}
                    className="w-3 h-3 text-text-inverse"
                  />
                )}
              </div>
            </div>

            {/* Label */}
            <span
              className={cn(
                'text-sm transition-colors duration-200 group-hover:text-text-primary',
                isSelected ? 'text-text-primary' : 'text-text-secondary'
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
