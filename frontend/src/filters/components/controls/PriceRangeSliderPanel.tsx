/**
 * Price range slider panel shown inside PriceRangeControl popover.
 */

import React from 'react';

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
  <div className="space-y-4">
    <div className="flex items-center justify-between text-sm font-normal text-text-tertiary">
      <span>{formatPrice(localValue[0], currency)}</span>
      <span>{formatPrice(localValue[1], currency)}</span>
    </div>

    <div className="relative h-6 flex items-center select-none touch-none" ref={sliderRef}>
      <div className="absolute w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-brand"
          style={{
            left: `${getPercentage(localValue[0])}%`,
            width: `${getPercentage(localValue[1]) - getPercentage(localValue[0])}%`,
          }}
        />
      </div>

      <div
        className="absolute w-5 h-5 bg-surface border-2 border-brand rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 focus:outline-none focus:ring-2 focus:ring-brand/30"
        style={{ left: `calc(${getPercentage(localValue[0])}% - 10px)` }}
        onMouseDown={onMouseDown('min')}
      />

      <div
        className="absolute w-5 h-5 bg-surface border-2 border-brand rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 focus:outline-none focus:ring-2 focus:ring-brand/30"
        style={{ left: `calc(${getPercentage(localValue[1])}% - 10px)` }}
        onMouseDown={onMouseDown('max')}
      />
    </div>

    <div className="flex justify-between items-center text-xs text-text-disabled">
      <span>{formatPrice(min, currency)}</span>
      <span>{formatPrice(max, currency)}</span>
    </div>
  </div>
);
