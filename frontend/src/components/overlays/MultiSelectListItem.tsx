/**
 * Individual option row in MultiSelectFilter.
 */

import React from 'react';
import { cn, uppercaseLabel } from '@/utils';
import { ICONS } from '@/config/icons';
import { Badge } from '@/components/primitives/Badge';
import { Icon } from '@/components/primitives/Icon';

export interface FilterOption {
  id: string;
  label: string;
  /** Badge color variant */
  color?: string;
}

export const MultiSelectListItem: React.FC<{
  option: FilterOption;
  isSelected: boolean;
  onToggle: () => void;
  singleSelect?: boolean;
}> = ({ option, isSelected, onToggle, singleSelect = false }) => (
  <label
    className={cn(
      'flex items-center gap-3 px-3 py-2 text-sm cursor-pointer',
      'hover:bg-surface-hover transition-colors',
      isSelected && 'bg-surface'
    )}
  >
    <div className="flex items-center justify-center">
      <input
        type={singleSelect ? 'radio' : 'checkbox'}
        checked={isSelected}
        onChange={onToggle}
        className="sr-only"
      />
      {singleSelect ? (
        <div
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-200',
            isSelected ? 'bg-brand' : 'bg-transparent border-2 border-border-default'
          )}
        >
          {isSelected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
        </div>
      ) : isSelected ? (
        <div className="w-4 h-4 rounded border-2 border-brand bg-brand flex items-center justify-center transition-all duration-150">
          <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
        </div>
      ) : (
        <div className="w-4 h-4 rounded border-2 border-border-default bg-surface transition-all duration-150" />
      )}
    </div>

    <Badge variant={option.color || 'default'} size="sm">
      {uppercaseLabel(option.label)}
    </Badge>
  </label>
);
