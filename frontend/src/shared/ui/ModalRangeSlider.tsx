/**
 * ModalRangeSlider - Dual-thumb range slider for use inside filter modals.
 * Shared by FilterModal (price) and PatientFilters (age).
 */

import React, { useState, useEffect } from 'react';

const SLIDER_THUMB_CLASS =
  'absolute w-full h-1 appearance-none bg-transparent pointer-events-none ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-brand [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer';

export interface ModalRangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
  /** Hint text above the slider */
  hint?: string;
  /** Format each bound for display; default (v) => String(v) */
  formatLabel?: (value: number) => string;
}

export const ModalRangeSlider: React.FC<ModalRangeSliderProps> = ({
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
      {hint && <p className="text-sm text-text-tertiary mb-4">{hint}</p>}
      <div className="relative h-1 mb-6">
        <div className="absolute inset-0 bg-border rounded-full" />
        <div
          className="absolute h-full bg-brand rounded-full"
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
