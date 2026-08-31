/**
 * Options list and select-all footer for MultiSelectFilter popover.
 */

import React from 'react';
import { ICONS } from '@/config/icons';
import { Icon } from '@/components/primitives/Icon';
import { MultiSelectListItem, type FilterOption } from './MultiSelectListItem';

export interface MultiSelectOptionsPanelProps {
  options: FilterOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  singleSelect?: boolean;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  allSelected: boolean;
  onSelectAll: () => void;
}

export const MultiSelectOptionsPanel: React.FC<MultiSelectOptionsPanelProps> = ({
  options,
  selectedIds,
  onToggle,
  singleSelect = false,
  showSelectAll = true,
  selectAllLabel = 'Select all',
  allSelected,
  onSelectAll,
}) => (
  <div className="bg-surface border border-border-default rounded-md shadow-lg py-2">
    <div className="max-h-[300px] overflow-y-auto">
      {options.map(option => (
        <MultiSelectListItem
          key={option.id}
          option={option}
          isSelected={selectedIds.includes(option.id)}
          onToggle={() => onToggle(option.id)}
          singleSelect={singleSelect}
        />
      ))}
    </div>

    {showSelectAll && !singleSelect && options.length > 0 && (
      <div className="border-t border-border-default mt-2 pt-2">
        <div className="px-3 py-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
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
            <span className="text-xs font-normal text-text-primary">
              {allSelected ? 'Deselect all' : selectAllLabel}
            </span>
          </label>
        </div>
      </div>
    )}
  </div>
);
