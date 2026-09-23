/**
 * PriceRangeControl — popover trigger with price range slider.
 */

import React from 'react';
import { Popover, Icon, FilterTriggerShell } from '@/components';
import type { PriceRangeFilterControl } from './types';
import { ICONS } from '@/config/icons';
import { PriceRangeSliderContent } from './PriceRangeSliderContent';

export interface PriceRangeControlProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  config: PriceRangeFilterControl;
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

export const PriceRangeControl: React.FC<PriceRangeControlProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  const min = config.min ?? 0;
  const max = config.max ?? 10000;
  const currency = config.currency ?? '';

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
      className="p-panel"
    >
      {() => (
        <PriceRangeSliderContent
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          currency={currency}
        />
      )}
    </Popover>
  );
};
