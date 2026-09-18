/**
 * OverlayRangeSlider - Dual-thumb range slider for use inside filter modals/popovers.
 * Shared by FilterModal (price) and PatientFilters (age).
 */

import React, { useState, useEffect } from 'react';
import { RANGE_SLIDER, RADIUS } from '@/components/theme/recipes';

const SLIDER_THUMB_CLASS =
  `absolute w-full h-1 appearance-none bg-transparent pointer-events-none ${RANGE_SLIDER.thumbChrome(RADIUS.field)}`;

export interface OverlayRangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  /** Hint text above the slider */
  hint?: string;
  /** Format each bound for display; default (v) => String(v) */
  formatLabel?: (value: number) => string;
}

export const OverlayRangeSlider: React.FC<OverlayRangeSliderProps> = ({
  value,
  onChange,
  min,
  max,
  hint,
  formatLabel = (v: number) => String(v),
}) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  useEffect(() => setLocalValue(value), [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1] - 1);
    const next: [number, number] = [newMin, localValue[1]];
    setLocalValue(next);
    onChange(next);
  };
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0] + 1);
    const next: [number, number] = [localValue[0], newMax];
    setLocalValue(next);
    onChange(next);
  };

  const minPercent = ((localValue[0] - min) / (max - min)) * 100;
  const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {hint && <p className="text-sm text-text-tertiary mb-space-4">{hint}</p>}
      <div className="relative h-1 mb-space-6">
        <div className={`absolute inset-0 bg-border ${RADIUS.pill}`} />
        <div
          className={`absolute h-full bg-brand ${RADIUS.pill}`}
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[0]}
          onChange={handleMinChange}
          className={SLIDER_THUMB_CLASS}
          style={{ zIndex: localValue[0] > max - 10 ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[1]}
          onChange={handleMaxChange}
          className={SLIDER_THUMB_CLASS}
          style={{ zIndex: 4 }}
        />
      </div>
      <div className="flex justify-between text-lg font-normal text-text-primary">
        <span>{formatLabel(localValue[0])}</span>
        <span>{formatLabel(localValue[1])}</span>
      </div>
    </div>
  );
};
