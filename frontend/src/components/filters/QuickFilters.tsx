/**
 * QuickFilters Component
 * Preset filter buttons for common filter combinations
 */

import React from 'react';
import { FilterChip, type IconName } from '@/components';
import { cn } from '@/utils';
import type { QuickFilterPreset } from './types';

export interface QuickFiltersProps {
  presets: QuickFilterPreset[];
  activePresetId: string | null;
  onPresetClick: (presetId: string) => void;
  className?: string;
}

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
      {presets.map(preset => (
        <FilterChip
          key={preset.id}
          size="xs"
          active={activePresetId === preset.id}
          icon={preset.icon as IconName | undefined}
          onClick={() => onPresetClick(preset.id)}
        >
          {preset.label}
        </FilterChip>
      ))}
    </div>
  );
};
