/**
 * Price range slider panel shown inside PriceRangeControl popover.
 */

import React from 'react';
import { CONTROL, PRICE_RANGE_TYPE, RADIUS } from '@/components/theme/recipes';

export interface PriceRangeSliderPanelProps {
  localValue: [number, number];
  min: number;
  max: number;
  currency: string;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  getPercentage: (val: number) => number;
  onMouseDown: (type: 'min' | 'max') => (e: React.MouseEvent) => void;
}

function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toLocaleString()}`;
}

export const PriceRangeSliderPanel: React.FC<PriceRangeSliderPanelProps> = ({
  localValue,
  min,
  max,
  currency,
  sliderRef,
  getPercentage,
  onMouseDown,
}) => (
  <div className="space-y-space-4">
    <div className={`flex items-center justify-between ${PRICE_RANGE_TYPE.value}`}>
      <span>{formatPrice(localValue[0], currency)}</span>
      <span>{formatPrice(localValue[1], currency)}</span>
    </div>

    <div className="relative h-6 flex items-center select-none touch-none" ref={sliderRef}>
      <div className={`absolute w-full h-1.5 bg-border-default ${RADIUS.pill} overflow-hidden`}>
        <div
          className="absolute h-full bg-brand"
          style={{
            left: `${getPercentage(localValue[0])}%`,
            width: `${getPercentage(localValue[1]) - getPercentage(localValue[0])}%`,
          }}
        />
      </div>

      <div
        className={`absolute w-5 h-5 bg-surface border-2 border-brand ${RADIUS.pill} shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 ${CONTROL.focusBrand}`}
        style={{ left: `calc(${getPercentage(localValue[0])}% - 10px)` }}
        onMouseDown={onMouseDown('min')}
      />

      <div
        className={`absolute w-5 h-5 bg-surface border-2 border-brand ${RADIUS.pill} shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 ${CONTROL.focusBrand}`}
        style={{ left: `calc(${getPercentage(localValue[1])}% - 10px)` }}
        onMouseDown={onMouseDown('max')}
      />
    </div>

    <div className={`flex justify-between items-center ${PRICE_RANGE_TYPE.bound}`}>
      <span>{formatPrice(min, currency)}</span>
      <span>{formatPrice(max, currency)}</span>
    </div>
  </div>
);
