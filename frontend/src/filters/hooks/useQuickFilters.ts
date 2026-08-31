/**
 * useQuickFilters Hook
 * Logic for quick filter presets
 */

import { useCallback } from 'react';
import type { QuickFilterPreset, FilterValues } from '../types';

/**
 * Options for useQuickFilters hook
 */
export interface UseQuickFiltersOptions {
  /** Available quick filter presets */
  presets: QuickFilterPreset[];
  /** Current filter values */
  filters: FilterValues;
  /** Callback when a preset is applied */
  onApplyPreset: (preset: QuickFilterPreset) => void;
}

/**
 * Return type for useQuickFilters hook
 */
export interface UseQuickFiltersReturn {
  /** Check if a preset is currently active */
  isPresetActive: (presetId: string) => boolean;
  /** Apply a preset */
  applyPreset: (presetId: string) => void;
  /** Get active preset ID if any */
  activePresetId: string | null;
}

/**
 * Hook for managing quick filter presets
 *
 * @param options - Configuration options
 * @returns Quick filter functions
 *
 * @example
 * ```typescript
 * const { isPresetActive, applyPreset, activePresetId } = useQuickFilters({
 *   presets: [
 *     { id: 'today', label: 'Today', preset: { dateRange: [today, today] } },
 *   ],
 *   filters: currentFilters,
 *   onApplyPreset: (preset) => setFilters(preset.preset),
 * });
 * ```
 */
export function useQuickFilters(options: UseQuickFiltersOptions): UseQuickFiltersReturn {
  const { presets, filters, onApplyPreset } = options;

  /**
   * Check if a preset matches current filters
   */
  const isPresetActive = useCallback(
    (presetId: string) => {
      const preset = presets.find(p => p.id === presetId);
      if (!preset) return false;

      // Check if all preset values match current filters
      return Object.entries(preset.preset).every(([key, presetValue]) => {
        const currentValue = filters[key];

        // Handle arrays
        if (Array.isArray(presetValue) && Array.isArray(currentValue)) {
          if (presetValue.length !== currentValue.length) return false;
          return presetValue.every((val, idx) => {
            const current = currentValue[idx];
            if (val instanceof Date && current instanceof Date) {
              return val.getTime() === current.getTime();
            }
            return val === current;
          });
        }

        // Handle dates
        if (presetValue instanceof Date && currentValue instanceof Date) {
          return presetValue.getTime() === currentValue.getTime();
        }

        // Handle primitives
        return presetValue === currentValue;
      });
    },
    [presets, filters]
  );

  /**
   * Apply a preset
   */
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
        onApplyPreset(preset);
      }
    },
    [presets, onApplyPreset]
  );

  /**
   * Find active preset ID
   */
  const activePresetId = presets.find(preset => isPresetActive(preset.id))?.id || null;

  return {
    isPresetActive,
    applyPreset,
    activePresetId,
  };
}
