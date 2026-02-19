/**
 * CheckboxList Component
 *
 * Inline checkbox list for filter options with clean styling.
 * Shows all options directly without popovers.
 * Delegates visual rendering to the shared <Checkbox> component.
 */

import React from 'react';
import { cn, uppercaseLabel } from '@/utils';
import { Checkbox } from './Checkbox';

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
 * Delegates visual rendering to <Checkbox> to avoid duplicating the checkbox visual logic.
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
    <div
      className={cn(columns === 2 ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'space-y-2', className)}
    >
      {options.map(option => (
        <Checkbox
          key={option.id}
          id={`checkbox-list-${option.id}`}
          checked={selectedIds.includes(option.id)}
          onChange={() => handleToggle(option.id)}
          label={uppercaseLabel(option.label)}
        />
      ))}
    </div>
  );
};
