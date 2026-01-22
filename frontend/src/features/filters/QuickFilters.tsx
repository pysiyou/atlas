/**
 * QuickFilters Component
 * Preset filter buttons for common filter combinations
 */

import React from 'react';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/utils';
import type { QuickFilterPreset } from './types';

/**
 * Props for QuickFilters component
 */
export interface QuickFiltersProps {
  /** Available quick filter presets */
  presets: QuickFilterPreset[];
  /** Currently active preset ID */
  activePresetId: string | null;
  /** Callback when a preset is clicked */
  onPresetClick: (presetId: string) => void;
  /** Custom className */
  className?: string;
}

/**
 * QuickFilters Component
 * 
 * Displays pill-style buttons for quick filter presets.
 * Active preset is highlighted.
 * 
 * @component
 */
export const QuickFilters: React.FC<QuickFiltersProps> = ({
  presets,
  activePresetId,
  onPresetClick,
  className,
}) => {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {presets.map((preset) => {
        const isActive = activePresetId === preset.id;
        
        return (
          <button
            key={preset.id}
            onClick={() => onPresetClick(preset.id)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors',
              'border',
              isActive
                ? 'bg-sky-50 border-sky-300 text-sky-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            )}
          >
            {preset.icon && (
              <Icon name={preset.icon} className="w-3 h-3" />
            )}
            <span>{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
};
