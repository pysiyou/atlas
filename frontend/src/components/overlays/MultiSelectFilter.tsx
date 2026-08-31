/**
 * MultiSelectFilter Component
 *
 * A filter component with a popover for multi-select options with checkboxes.
 * Inspired by the cargoplan ListSelector component.
 */

import React, { useCallback, useMemo } from 'react';
import { Popover } from './Popover';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { FilterTriggerShell } from './FilterTriggerShell';
import { MultiSelectTriggerContent } from './MultiSelectTriggerContent';
import { MultiSelectOptionsPanel } from './MultiSelectOptionsPanel';
import type { FilterOption } from './MultiSelectListItem';

export type { FilterOption };

/**
 * Props for the MultiSelectFilter component
 */
export interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  className?: string;
  icon?: IconName;
  singleSelect?: boolean;
}

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
  const allSelected = useMemo(
    () => options.length > 0 && selectedIds.length === options.length,
    [options.length, selectedIds.length]
  );

  const handleToggle = useCallback(
    (id: string) => {
      if (singleSelect) {
        const newSelected = selectedIds.includes(id) ? [] : [id];
        onChange(newSelected);
      } else {
        const newSelected = selectedIds.includes(id)
          ? selectedIds.filter(selectedId => selectedId !== id)
          : [...selectedIds, id];
        onChange(newSelected);
      }
    },
    [selectedIds, onChange, singleSelect]
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map(opt => opt.id));
    }
  }, [allSelected, options, onChange]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  const singleSelectedOption = useMemo(() => {
    if (selectedIds.length === 1) {
      return options.find(opt => opt.id === selectedIds[0]);
    }
    return null;
  }, [selectedIds, options]);

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }: { isOpen: boolean }) => (
        <FilterTriggerShell
          isOpen={isOpen}
          leftIcon={
            icon ? (
              <Icon
                name={icon}
                className="w-4 h-4 text-text-muted group-hover:text-brand shrink-0 transition-colors"
              />
            ) : undefined
          }
          showClear={selectedIds.length > 0}
          onClear={e => {
            e.preventDefault();
            e.stopPropagation();
            handleClear(e);
          }}
          onClearMouseDown={e => e.stopPropagation()}
          className={className}
        >
          <div className="overflow-hidden">
            <MultiSelectTriggerContent
              label={label}
              placeholder={placeholder}
              selectedIds={selectedIds}
              singleSelectedOption={singleSelectedOption ?? null}
            />
          </div>
        </FilterTriggerShell>
      )}
      className="min-w-[200px]"
    >
      {() => (
        <MultiSelectOptionsPanel
          options={options}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          singleSelect={singleSelect}
          showSelectAll={showSelectAll}
          selectAllLabel={selectAllLabel}
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
        />
      )}
    </Popover>
  );
};
