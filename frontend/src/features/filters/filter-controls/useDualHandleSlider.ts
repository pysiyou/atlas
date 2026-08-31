/**
 * Dual-handle range slider drag logic for PriceRangeControl.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export function useDualHandleSlider(
  value: [number, number],
  onChange: (value: [number, number]) => void,
  min: number,
  max: number
) {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<'min' | 'max' | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const getPercentage = useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
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

  const latestValueRef = useRef(localValue);
  useEffect(() => {
    latestValueRef.current = localValue;
  }, [localValue]);

  const mouseUpHandlerRef = useRef<() => void>(() => {});

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

  return {
    localValue,
    sliderRef,
    getPercentage,
    onMouseDown,
  };
}
