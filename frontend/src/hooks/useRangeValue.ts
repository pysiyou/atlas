/**
 * useRangeValue - Controlled range sync and clear-to-default for min/max inputs.
 * Use with dual-handle range controls (e.g. AgeFilter, PriceRangeControl) to avoid duplicating sync/clear logic.
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseRangeValueOptions {
  /** Default range when "clear" is triggered (e.g. [min, max]) */
  defaultRange: [number, number];
}

export interface UseRangeValueReturn {
  localValue: [number, number];
  setLocalValue: React.Dispatch<React.SetStateAction<[number, number]>>;
  handleClear: (e: React.MouseEvent) => void;
}

export function useRangeValue(
  value: [number, number],
  onChange: (value: [number, number]) => void,
  { defaultRange }: UseRangeValueOptions
): UseRangeValueReturn {
  const [localValue, setLocalValue] = useState<[number, number]>(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(defaultRange);
    },
    [onChange, defaultRange]
  );

  return { localValue, setLocalValue, handleClear };
}
