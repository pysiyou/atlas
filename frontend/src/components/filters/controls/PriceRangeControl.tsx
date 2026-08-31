/**
 * PriceRangeControl Component
 * Price range slider for filters
 */

import React from 'react';
import { Popover, Icon, FilterTriggerShell } from '@/components';
import type { PriceRangeFilterControl } from '../types';
import { ICONS } from '@/utils';
import { useDualHandleSlider } from './useDualHandleSlider';
import { PriceRangeSliderPanel } from './PriceRangeSliderPanel';

/**
 * Props for PriceRangeControl component
 */
export interface PriceRangeControlProps {
  /** Current price range value */
  value: [number, number];
  /** Callback when price range changes */
  onChange: (value: [number, number]) => void;
  /** Filter control configuration */
  config: PriceRangeFilterControl;
  /** Custom className */
  className?: string;
}

function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toLocaleString()}`;
}

function PriceRangeTriggerContent({
  value,
  min,
  max,
  currency,
  placeholder,
}: {
  value: [number, number];
  min: number;
  max: number;
  currency: string;
  placeholder?: string;
}) {
  const [start, end] = value;
  if (start === min && end === max) {
    return <span className="text-text-muted">{placeholder || 'Filter by price range'}</span>;
  }
  return (
    <span className="text-text-primary font-normal">
      {formatPrice(start, currency)} - {formatPrice(end, currency)}
    </span>
  );
}

/**
 * PriceRangeControl Component
 *
 * Provides a range slider for filtering by price range.
 * Similar to AgeFilter but with price-specific formatting.
 */
export const PriceRangeControl: React.FC<PriceRangeControlProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  const min = config.min ?? 0;
  const max = config.max ?? 10000;
  const currency = config.currency ?? '';

  const { localValue, sliderRef, getPercentage, onMouseDown } = useDualHandleSlider(
    value,
    onChange,
    min,
    max
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([min, max]);
  };

  const showClear = value[0] !== min || value[1] !== max;

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <FilterTriggerShell
          isOpen={isOpen}
          leftIcon={
            <Icon
              name={ICONS.dataFields.wallet}
              className="w-4 h-4 text-text-muted group-hover:text-brand shrink-0 transition-colors"
            />
          }
          showClear={showClear}
          onClear={handleClear}
          className={className}
        >
          <PriceRangeTriggerContent
            value={value}
            min={min}
            max={max}
            currency={currency}
            placeholder={config.placeholder}
          />
        </FilterTriggerShell>
      )}
      className="p-4"
    >
      {() => (
        <PriceRangeSliderPanel
          localValue={localValue}
          min={min}
          max={max}
          currency={currency}
          sliderRef={sliderRef}
          getPercentage={getPercentage}
          onMouseDown={onMouseDown}
        />
      )}
    </Popover>
  );
};
