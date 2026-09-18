/**
 * AgeFilter Component
 *
 * A modern, polished age range selector with dual-handle slider.
 * Features smooth animations, refined visual design, and enhanced micro-interactions.
 */

import React from 'react';
import { RANGE_SLIDER, RADIUS } from '@/components/theme/recipes';

const AGE_SLIDER_THUMB_CLASS =
  `absolute w-full h-1 appearance-none bg-transparent pointer-events-none ${RANGE_SLIDER.thumbChrome(RADIUS.field)}`;
import { Popover, Icon, FilterTriggerShell } from '@/components';
import { useRangeValue } from '@/hooks/useRangeValue';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';

interface AgeFilterProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
}

export const AgeFilter: React.FC<AgeFilterProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  placeholder = 'Filter by Age',
  className,
}) => {
  const { localValue, setLocalValue, handleClear } = useRangeValue(value, onChange, {
    defaultRange: [min, max],
  });

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1] - 1);
    const newValue: [number, number] = [newMin, localValue[1]];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0] + 1);
    const newValue: [number, number] = [localValue[0], newMax];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const minPercent = ((localValue[0] - min) / (max - min)) * 100;
  const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

  /**
   * Render the trigger button content
   */
  const renderTriggerContent = () => {
    const [start, end] = value;
    if (start === min && end === max) {
      return <span className="text-text-muted">{placeholder}</span>;
    }
    return (
      <span className="text-text-primary font-normal">
        {start} - {end}
      </span>
    );
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
          {renderTriggerContent()}
        </FilterTriggerShell>
      )}
      className="p-space-6 w-[320px]"
    >
      {() => (
        <div className="w-full">
          <p className="text-sm text-text-tertiary mb-space-4">Move the slider to filter by age</p>

          {/* Slider Track */}
          <div className="relative h-1 mb-space-6">
            {/* Background track */}
            <div className={`absolute inset-0 bg-border ${RADIUS.pill}`} />

            {/* Active track */}
            <div
              className={`absolute h-full bg-brand ${RADIUS.pill}`}
              style={{
                left: `${minPercent}%`,
                width: `${maxPercent - minPercent}%`,
              }}
            />

            {/* Min thumb */}
            <input
              type="range"
              min={min}
              max={max}
              value={localValue[0]}
              onChange={handleMinChange}
              className={AGE_SLIDER_THUMB_CLASS}
              style={{ zIndex: localValue[0] > max - 10 ? 5 : 3 }}
            />

            {/* Max thumb */}
            <input
              type="range"
              min={min}
              max={max}
              value={localValue[1]}
              onChange={handleMaxChange}
              className={AGE_SLIDER_THUMB_CLASS}
              style={{ zIndex: 4 }}
            />
          </div>

          {/* Age labels */}
          <div className="flex justify-between text-lg font-normal text-text-primary">
            <span>{localValue[0]} years</span>
            <span>{localValue[1]} years</span>
          </div>
        </div>
      )}
    </Popover>
  );
};
