/**
 * RangeFilter - Numeric range filter component
 * 
 * Provides a dual-slider interface for filtering numeric ranges.
 * Used for age, price, and other numeric filters.
 */

import React from 'react';

export interface RangeFilterProps {
  /** Filter label */
  label: string;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Current range value */
  value: [number, number];
  /** Change handler */
  onChange: (range: [number, number]) => void;
  /** Unit to display (e.g., 'years', '$') */
  unit?: string;
  /** Step size for slider */
  step?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RangeFilter component
 * 
 * @example
 * ```tsx
 * <RangeFilter
 *   label="Age"
 *   min={0}
 *   max={150}
 *   value={ageRange}
 *   onChange={setAgeRange}
 *   unit="years"
 * />
 * ```
 */
export const RangeFilter: React.FC<RangeFilterProps> = ({
  label,
  min,
  max,
  value,
  onChange,
  unit = '',
  step = 1,
  className = '',
}) => {
  const [minValue, maxValue] = value;

  const handleMinChange = (newMin: number) => {
    if (newMin <= maxValue) {
      onChange([newMin, maxValue]);
    }
  };

  const handleMaxChange = (newMax: number) => {
    if (newMax >= minValue) {
      onChange([minValue, newMax]);
    }
  };

  const handleReset = () => {
    onChange([min, max]);
  };

  const isDefault = minValue === min && maxValue === max;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with label and reset */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        {!isDefault && (
          <button
            onClick={handleReset}
            className="text-xs text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Value display */}
      <div className="flex items-center justify-between text-sm text-gray-900">
        <span className="font-medium">
          {minValue} {unit}
        </span>
        <span className="text-gray-400">-</span>
        <span className="font-medium">
          {maxValue} {unit}
        </span>
      </div>

      {/* Dual range sliders */}
      <div className="relative pt-2 pb-1">
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full -translate-y-1/2" />
        
        {/* Active range */}
        <div
          className="absolute top-1/2 h-2 bg-sky-500 rounded-full -translate-y-1/2"
          style={{
            left: `${((minValue - min) / (max - min)) * 100}%`,
            right: `${100 - ((maxValue - min) / (max - min)) * 100}%`,
          }}
        />

        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
          style={{ pointerEvents: 'auto' }}
        />

        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
          style={{ pointerEvents: 'auto' }}
        />

        {/* Min thumb */}
        <div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-sky-500 rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-sm"
          style={{ left: `${((minValue - min) / (max - min)) * 100}%` }}
        />

        {/* Max thumb */}
        <div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-sky-500 rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow-sm"
          style={{ left: `${((maxValue - min) / (max - min)) * 100}%` }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
};
