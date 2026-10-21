/**
 * Popover filter field with dual-thumb range slider.
 */

import React from 'react';
import { FilterTriggerShell, Popover } from '@/components/overlays';
import { RangeSlider, type RangeTuple } from '@/components/overlays/RangeSlider';
import { cn } from '@/utils';

export interface RangeFilterFieldProps {
  value: RangeTuple;
  onChange: (value: RangeTuple) => void;
  minValue: number;
  maxValue: number;
  placeholder: string;
  formatSummary: (value: RangeTuple) => React.ReactNode;
  sliderMode: 'histogram' | 'track';
  distribution?: number[];
  formatValue?: (n: number) => string;
  summary?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const RangeFilterField: React.FC<RangeFilterFieldProps> = ({
  value,
  onChange,
  minValue,
  maxValue,
  placeholder,
  formatSummary,
  sliderMode,
  distribution,
  formatValue,
  summary,
  icon,
  className,
}) => {
  const isDefault = value[0] === minValue && value[1] === maxValue;
  const showClear = !isDefault;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([minValue, maxValue]);
  };

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <FilterTriggerShell
          isOpen={isOpen}
          leftIcon={icon}
          showClear={showClear}
          onClear={handleClear}
          className={className}
        >
          {isDefault ? (
            <span className="text-text-muted">{placeholder}</span>
          ) : (
            <span className={cn('text-text-primary font-normal tabular-nums')}>{formatSummary(value)}</span>
          )}
        </FilterTriggerShell>
      )}
      className="p-panel w-[21rem]"
    >
      {() => (
        <RangeSlider
          mode={sliderMode}
          value={value}
          onChange={onChange}
          minValue={minValue}
          maxValue={maxValue}
          distribution={distribution}
          formatValue={formatValue}
          summary={summary}
          onReset={() => onChange([minValue, maxValue])}
        />
      )}
    </Popover>
  );
};
