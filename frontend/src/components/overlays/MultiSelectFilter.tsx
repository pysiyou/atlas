/**
 * MultiSelectFilter — popover filter with multi-select (or single-select) options.
 */

import React, { useCallback, useMemo } from 'react';
import { cn, uppercaseLabel } from '@/utils';
import { ICONS } from '@/config/icons';
import { Badge } from '@/components';
import { parseBadgeVariant } from '@/components/primitives/badgeStyles';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { Popover } from './Popover';
import { FilterTriggerShell } from './FilterTriggerShell';
import { MENU_ITEM_TYPE, RADIUS, TYPE } from '@/components/theme/recipes';

export interface FilterOption {
  id: string;
  label: string;
  /** Badge color variant */
  color?: string;
}

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

function MultiSelectListItem({
  option,
  isSelected,
  onToggle,
  singleSelect = false,
}: {
  option: FilterOption;
  isSelected: boolean;
  onToggle: () => void;
  singleSelect?: boolean;
}) {
  return (
    <label
      className={cn(
        `flex items-center gap-space-3 px-space-3 py-space-2 ${MENU_ITEM_TYPE} cursor-pointer`,
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
              `w-5 h-5 ${RADIUS.pill} flex items-center justify-center transition-colors duration-200`,
              isSelected ? 'bg-brand' : 'bg-transparent border-2 border-border-default'
            )}
          >
            {isSelected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
          </div>
        ) : isSelected ? (
          <div className={`w-4 h-4 ${RADIUS.menuItem} border-2 border-brand bg-brand flex items-center justify-center transition-all duration-150`}>
            <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
          </div>
        ) : (
          <div className={`w-4 h-4 ${RADIUS.menuItem} border-2 border-border-default bg-surface transition-all duration-150`} />
        )}
      </div>

      <Badge variant={parseBadgeVariant(option.color)} size="xs">
        {uppercaseLabel(option.label)}
      </Badge>
    </label>
  );
}

function MultiSelectTriggerContent({
  label,
  placeholder,
  selectedIds,
  singleSelectedOption,
}: {
  label: string;
  placeholder?: string;
  selectedIds: string[];
  singleSelectedOption: FilterOption | null;
}) {
  if (selectedIds.length === 0) {
    return (
      <span className="text-text-muted whitespace-nowrap overflow-hidden truncate">
        {placeholder || `Select ${label}...`}
      </span>
    );
  }

  if (singleSelectedOption) {
    return (
      <Badge variant={parseBadgeVariant(singleSelectedOption.color)} size="xs">
        {uppercaseLabel(singleSelectedOption.label)}
      </Badge>
    );
  }

  return (
    <span className="text-text-primary truncate block whitespace-nowrap">
      <span className={`inline-flex items-center justify-center min-w-[18px] h-4 px-space-1 ${RADIUS.pill} text-on-brand ${TYPE.caption} font-normal align-middle mr-space-1 bg-brand`}>
        {selectedIds.length}
      </span>
      selected
    </span>
  );
}

function MultiSelectOptionsPanel({
  options,
  selectedIds,
  onToggle,
  singleSelect = false,
  showSelectAll = true,
  selectAllLabel = 'Select all',
  allSelected,
  onSelectAll,
}: {
  options: FilterOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  singleSelect?: boolean;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  allSelected: boolean;
  onSelectAll: () => void;
}) {
  return (
    <div className="flex flex-col py-space-2 min-w-0">
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
        <div className="border-t border-border-default mt-space-2 pt-space-2">
          <div className="px-space-3 py-space-2">
            <label className="flex items-center gap-space-3 cursor-pointer">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="sr-only"
                />
                {allSelected ? (
                  <div className={`w-4 h-4 ${RADIUS.menuItem} border-2 border-brand bg-brand flex items-center justify-center transition-all duration-150`}>
                    <Icon name={ICONS.actions.cross} className="w-3 h-3 text-on-brand" />
                  </div>
                ) : (
                  <div className={`w-4 h-4 ${RADIUS.menuItem} border-2 border-brand bg-brand flex items-center justify-center transition-all duration-150`}>
                    <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                  </div>
                )}
              </div>
              <span className={`${TYPE.value} font-normal`}>
                {allSelected ? 'Deselect all' : selectAllLabel}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
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
