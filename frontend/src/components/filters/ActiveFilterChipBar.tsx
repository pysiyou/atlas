/**
 * Removable active-filter chips — labels supplied by the caller.
 */

import type React from 'react';
import { Icon, Badge } from '@/components/primitives';
import { ICONS } from '@/config/icons';
import { text } from '@/theme/recipes';

export interface ActiveFilterItem {
  id: string;
  label: React.ReactNode;
}

export interface ActiveFilterChipBarProps {
  items: ActiveFilterItem[];
  heading?: React.ReactNode;
  onClearAll?: () => void;
  onRemoveItem?: (id: string) => void;
}

export function ActiveFilterChipBar({
  items,
  heading = 'Filtered by:',
  onClearAll,
  onRemoveItem,
}: ActiveFilterChipBarProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-space-2 px-space-4 py-space-2 bg-surface-secondary border-b border-border-default">
      <span className={`${text({ role: 'label' })} text-text-secondary`}>{heading}</span>
      <div className="flex items-center gap-space-2 flex-wrap">
        {items.map(item => (
          <Badge key={item.id} variant="info" size="sm" className="flex items-center gap-space-1.5">
            <span>{item.label}</span>
            {onRemoveItem ? (
              <button
                onClick={() => onRemoveItem(item.id)}
                className="hover:opacity-70 transition-opacity"
                aria-label="Remove filter"
                type="button"
              >
                <Icon name={ICONS.actions.close} className="w-3 h-3" />
              </button>
            ) : null}
          </Badge>
        ))}
      </div>
      {onClearAll ? (
        <button
          onClick={onClearAll}
          className={`${text({ role: 'caption' })} text-text-secondary hover:text-text-primary ml-auto`}
          type="button"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
