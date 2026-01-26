/**
 * AgeFilter Component
 * 
 * A modern, polished age range selector with dual-handle slider.
 * Features smooth animations, refined visual design, and enhanced micro-interactions.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Popover } from '@/shared/ui/Popover';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';

interface AgeFilterProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
}

// Large component is necessary for age range slider with dual handles, mouse/touch event handling, and popover UI
// eslint-disable-next-line max-lines-per-function
export const AgeFilter: React.FC<AgeFilterProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  placeholder = 'Filter by Age',
  className,
}) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [isDraggingHandle, setIsDraggingHandle] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<'min' | 'max' | null>(null);

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Calculate percentage position for a given value
   */
  const getPercentage = useCallback(
    (val: number) => {
      return ((val - min) / (max - min)) * 100;
    },
    [min, max]
  );

  /**
   * Convert mouse position to slider value
   */
  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return 0;
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const rawValue = percent * (max - min) + min;
      return Math.round(rawValue);
    },
    [min, max]
  );

  /**
   * Handle mouse move during drag
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;

      const newValue = getValueFromPosition(e.clientX);

      setLocalValue(prev => {
        const [currMin, currMax] = prev;
        if (isDragging.current === 'min') {
          const nextMin = Math.min(newValue, currMax);
          return [nextMin, currMax];
        }
        const nextMax = Math.max(newValue, currMin);
        return [currMin, nextMax];
      });
    },
    [getValueFromPosition]
  );

  // Use a ref to keep track of latest local value for the mouseup commit
  const latestValueRef = useRef(localValue);
  useEffect(() => {
    latestValueRef.current = localValue;
  }, [localValue]);

  // Use ref to store the mouseup handler to avoid circular dependency
  const mouseUpHandlerRef = useRef<() => void>(() => {});

  // Update the handler ref whenever dependencies change
  useEffect(() => {
    mouseUpHandlerRef.current = () => {
      if (isDragging.current) {
        onChange(latestValueRef.current);
      }
      isDragging.current = null;
      setIsDraggingHandle(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', mouseUpHandlerRef.current);
    };
  }, [onChange, handleMouseMove]);

  /**
   * Handle mouse down on slider handle
   */
  const onMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = type;
    setIsDraggingHandle(type);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', mouseUpHandlerRef.current);
  };

  /**
   * Clear the filter and reset to default range
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([min, max]);
  };

  /**
   * Render the trigger button content
   */
  const renderTriggerContent = () => {
    const [start, end] = value;
    if (start === min && end === max) {
      return <span className="text-text-tertiary">{placeholder}</span>;
    }
    return (
      <span className={cn('text-text-secondary', 'font-medium')}>
        {start} - {end}
      </span>
    );
  };

  const minPercent = getPercentage(localValue[0]);
  const maxPercent = getPercentage(localValue[1]);
  const rangeWidth = maxPercent - minPercent;

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <div
          className={cn(
            'group relative flex items-center gap-2 w-full h-[34px] px-3 py-1.5',
            'bg-surface border rounded-md cursor-pointer transition-colors duration-200',
            isOpen
              ? 'border-brand bg-brand/5'
              : 'border-border hover:border-border-strong hover:bg-surface-hover',
            className
          )}
        >
          {/* Column 1: Left Icon */}
          <Icon
            name={ICONS.dataFields.hourglass}
            className={cn(
              'w-4 h-4 shrink-0',
              isOpen ? 'text-brand' : cn('text-text-disabled', 'group-hover:text-brand/70')
            )}
          />
          
          {/* Column 2: Content - flexible middle */}
          <div className={cn('flex-1 min-w-0 text-xs font-medium truncate', 'font-medium')}>{renderTriggerContent()}</div>

          {/* Column 3: Right Icons (clear + chevron) - close icon always reserves space */}
          <div className="flex items-center gap-1 shrink-0">
            {value && (value[0] !== min || value[1] !== max) ? (
              <button
                onClick={handleClear}
                className={cn('p-0.5 rounded hover:bg-brand/10 transition-colors group/clear')}
                aria-label="Clear age filter"
              >
                <Icon 
                  name={ICONS.actions.closeCircle} 
                  className={cn('w-3.5 h-3.5 text-text-disabled', 'group-hover/clear:text-brand')} 
                />
              </button>
            ) : (
              <div className="w-[18px]" />
            )}
            <Icon
              name={ICONS.actions.chevronDown}
              className={cn(
                'w-3.5 h-3.5 text-text-disabled transition-transform duration-200',
                isOpen && cn('rotate-180', 'text-brand')
              )}
            />
          </div>
        </div>
      )}
      className="p-6 w-[320px]"
    >
      {() => (
        <div className="space-y-5">
          {/* Simple Value Display */}
          <div className={cn('flex items-center justify-center gap-2 text-sm', 'text-text-tertiary')}>
            <span className={cn('font-semibold tabular-nums', 'text-text-primary')}>{localValue[0]}</span>
            <span className="text-text-disabled">-</span>
            <span className={cn('font-semibold tabular-nums', 'text-text-primary')}>{localValue[1]}</span>
            <span className={cn('text-text-tertiary', 'ml-1')}>years</span>
          </div>

          {/* Enhanced Slider - Pill-shaped track with multi-segment gradient */}
          <div className="relative h-10 flex items-center select-none touch-none py-3" ref={sliderRef}>
            {/* Track Background - Light pill-shaped track */}
            <div className="absolute w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
              {/* Active Range with vibrant multi-segment gradient */}
              <div
                className="absolute h-full rounded-full transition-all duration-150 bg-[linear-gradient(to_right,#60a5fa,#3b82f6,#6366f1,#8b5cf6,#a855f7,#ec4899)]"
                style={{
                  left: `${minPercent}%`,
                  width: `${rangeWidth}%`,
                }}
              >
                {/* Subtle shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent rounded-full" />
              </div>
            </div>

            {/* Min Handle - Circular dot with dotted outline when active */}
            <div
              className={cn(
                'absolute w-4 h-4 rounded-full cursor-grab active:cursor-grabbing z-10 transition-all duration-200',
                'hover:scale-125',
                isDraggingHandle === 'min'
                  ? 'bg-brand scale-125 shadow-lg'
                  : 'bg-brand/60 hover:bg-brand'
              )}
              style={{ left: `calc(${minPercent}% - 8px)` }}
              onMouseDown={onMouseDown('min')}
              role="slider"
              aria-label="Minimum age"
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={localValue[0]}
              tabIndex={0}
            >
              {/* Dotted outline when dragging */}
              {isDraggingHandle === 'min' && (
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-brand -m-1 animate-pulse" />
              )}
            </div>

            {/* Max Handle - Circular dot with dotted outline when active */}
            <div
              className={cn(
                'absolute w-4 h-4 rounded-full cursor-grab active:cursor-grabbing z-10 transition-all duration-200',
                'hover:scale-125',
                isDraggingHandle === 'max'
                  ? 'bg-brand scale-125 shadow-lg'
                  : 'bg-brand/60 hover:bg-brand'
              )}
              style={{ left: `calc(${maxPercent}% - 8px)` }}
              onMouseDown={onMouseDown('max')}
              role="slider"
              aria-label="Maximum age"
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={localValue[1]}
              tabIndex={0}
            >
              {/* Dotted outline when dragging */}
              {isDraggingHandle === 'max' && (
                <div className={cn('absolute inset-0 rounded-full border-2 border-dashed -m-1 animate-pulse', 'border-brand')} />
              )}
            </div>
          </div>

          {/* Age Labels - Positioned below track */}
          <div className="flex justify-between items-center text-xs font-medium mt-1">
            <span className={cn(
              'transition-colors duration-200',
              localValue[0] === min ? 'text-brand' : 'text-text-tertiary'
            )}>
              {min}
            </span>
            <span className={cn(
              'transition-colors duration-200',
              localValue[1] === max ? 'text-brand' : 'text-text-tertiary'
            )}>
              {max}
            </span>
          </div>
        </div>
      )}
    </Popover>
  );
};
