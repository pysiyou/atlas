/**
 * AgeFilter — popover trigger with dual-handle age range slider.
 */

import React from 'react';
import { Popover, Icon, FilterTriggerShell, OverlayRangeSlider } from '@/components';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';

interface AgeFilterProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  /** Optional right-side footer copy (e.g. "Showing 12 of 48"). */
  resultSummary?: string;
}

export const AgeFilter: React.FC<AgeFilterProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  placeholder = 'Filter by Age',
  className,
  resultSummary,
}) => {
  const isDefault = value[0] === min && value[1] === max;
  const showClear = !isDefault;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([min, max]);
  };

  const handleReset = () => {
    onChange([min, max]);
  };

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <FilterTriggerShell
          isOpen={isOpen}
          leftIcon={
            <Icon
              name={ICONS.dataFields.hourglass}
              className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                isOpen ? 'text-brand' : 'text-text-muted group-hover:text-brand'
              )}
            />
          }
          showClear={showClear}
          onClear={handleClear}
          className={className}
        >
          {isDefault ? (
            <span className="text-text-muted">{placeholder}</span>
          ) : (
            <span className="text-text-primary font-normal tabular-nums">
              {value[0]}–{value[1]} yrs
            </span>
          )}
        </FilterTriggerShell>
      )}
      className="p-panel w-[20rem]"
    >
      {() => (
        <OverlayRangeSlider
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          boundLabels={{ min: 'Min age', max: 'Max age' }}
          onReset={handleReset}
          footerSummary={resultSummary}
        />
      )}
    </Popover>
  );
};
