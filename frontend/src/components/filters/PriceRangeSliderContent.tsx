/**
 * Price range slider body — shared by PriceRangeControl popover and filter modals.
 */

import React from 'react';
import { useDualHandleSlider } from './useDualHandleSlider';
import { PriceRangeSliderPanel } from './PriceRangeSliderPanel';

export interface PriceRangeSliderContentProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  currency: string;
}

export const PriceRangeSliderContent: React.FC<PriceRangeSliderContentProps> = ({
  value,
  onChange,
  min,
  max,
  currency,
}) => {
  const { localValue, sliderRef, getPercentage, onMouseDown } = useDualHandleSlider(
    value,
    onChange,
    min,
    max
  );

  return (
    <PriceRangeSliderPanel
      localValue={localValue}
      min={min}
      max={max}
      currency={currency}
      sliderRef={sliderRef}
      getPercentage={getPercentage}
      onMouseDown={onMouseDown}
    />
  );
};
