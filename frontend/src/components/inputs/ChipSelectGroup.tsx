/**
 * Single-select chip row (toggle / deselect).
 */

import React from 'react';
import { FilterChip } from '@/components/primitives';

export interface ChipOption {
  id: string;
  label: React.ReactNode;
}

export interface ChipSelectGroupProps {
  options: ChipOption[];
  selectedId: string | null;
  onSelectedIdChange: (id: string | null) => void;
  size?: 'xs' | 'sm';
  allowDeselect?: boolean;
}

export function ChipSelectGroup({
  options,
  selectedId,
  onSelectedIdChange,
  size = 'xs',
  allowDeselect = true,
}: ChipSelectGroupProps) {
  return (
    <div className="flex flex-wrap gap-space-2">
      {options.map(opt => {
        const active = selectedId === opt.id;
        return (
          <FilterChip
            key={opt.id}
            size={size}
            active={active}
            onClick={() => onSelectedIdChange(active && allowDeselect ? null : opt.id)}
          >
            {opt.label}
          </FilterChip>
        );
      })}
    </div>
  );
}
