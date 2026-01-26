/**
 * PriceRangeControl Component
 * Price range slider for filters
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Popover } from '@/shared/ui/Popover';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/utils';
import type { PriceRangeFilterControl } from '../types';
import { ICONS } from '@/utils/icon-mappings';
import { brandColors, neutralColors } from '@/shared/design-system/tokens/colors';
import { dropdown, filterControl } from '@/shared/design-system/tokens/components';

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

/**
 * PriceRangeControl Component
 *
 * Provides a range slider for filtering by price range.
 * Similar to AgeFilter but with price-specific formatting.
 *
 * @component
 */
// Large component is necessary for price range slider with dual handles, validation, formatting, and popover UI
// eslint-disable-next-line max-lines-per-function
export const PriceRangeControl: React.FC<PriceRangeControlProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  const min = config.min ?? 0;
  const max = config.max ?? 10000;
  const currency = config.currency ?? '';

  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<'min' | 'max' | null>(null);

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const getPercentage = useCallback(
    (val: number) => {
      return ((val - min) / (max - min)) * 100;
    },
    [min, max]
  );

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
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', mouseUpHandlerRef.current);
    };
  }, [onChange, handleMouseMove]);

  const onMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = type;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', mouseUpHandlerRef.current);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([min, max]);
  };

  /**
   * Format price for display
   */
  const formatPrice = (price: number): string => {
    return `${currency}${price.toLocaleString()}`;
  };

  const renderTriggerContent = () => {
    const [start, end] = value;
    if (start === min && end === max) {
      return <span className={neutralColors.text.muted}>{config.placeholder || 'Filter by price range'}</span>;
    }
    return (
      <span className={cn(neutralColors.text.secondary, 'font-medium')}>
        {formatPrice(start)} - {formatPrice(end)}
      </span>
    );
  };

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <div
          className={cn(
            dropdown.trigger.base,
            isOpen ? dropdown.trigger.open : dropdown.trigger.default,
            className
          )}
        >
          <Icon name={ICONS.dataFields.wallet} className={dropdown.icon} />
          <div className={dropdown.content}>{renderTriggerContent()}</div>

          <Icon
            name={ICONS.actions.chevronDown}
            className={cn(dropdown.chevron, isOpen && 'rotate-180')}
          />

          {value && (value[0] !== min || value[1] !== max) && (
            <button
              onClick={handleClear}
              className={dropdown.clearButton}
            >
              <Icon name={ICONS.actions.closeCircle} className={dropdown.clearIcon} />
            </button>
          )}
        </div>
      )}
      className="p-4"
    >
      {() => (
        <div className="space-y-4">
          <div className={cn('flex items-center justify-between text-sm font-medium', neutralColors.text.tertiary)}>
            <span>{formatPrice(localValue[0])}</span>
            <span>{formatPrice(localValue[1])}</span>
          </div>

          <div className="relative h-6 flex items-center select-none touch-none" ref={sliderRef}>
            {/* Track Background */}
            <div className="absolute w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              {/* Active Range */}
              <div
                className={`absolute h-full ${brandColors.primary.backgroundMedium}`}
                style={{
                  left: `${getPercentage(localValue[0])}%`,
                  width: `${getPercentage(localValue[1]) - getPercentage(localValue[0])}%`,
                }}
              />
            </div>

            {/* Min Handle */}
            <div
              className={`absolute w-5 h-5 bg-surface border-2 ${brandColors.primary.borderMedium} rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 focus:outline-none focus:ring-2 ${brandColors.primary.ring30}`}
              style={{ left: `calc(${getPercentage(localValue[0])}% - 10px)` }}
              onMouseDown={onMouseDown('min')}
            />

            {/* Max Handle */}
            <div
              className={`absolute w-5 h-5 bg-surface border-2 ${brandColors.primary.borderMedium} rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 focus:outline-none focus:ring-2 ${brandColors.primary.ring30}`}
              style={{ left: `calc(${getPercentage(localValue[1])}% - 10px)` }}
              onMouseDown={onMouseDown('max')}
            />
          </div>

          <div className={cn('flex justify-between items-center text-xs', neutralColors.text.disabled)}>
            <span>{formatPrice(min)}</span>
            <span>{formatPrice(max)}</span>
          </div>
        </div>
      )}
    </Popover>
  );
};
