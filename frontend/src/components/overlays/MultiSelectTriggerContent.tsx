/**
 * Trigger label content for MultiSelectFilter.
 */

import React from 'react';
import { uppercaseLabel } from '@/utils';
import { Badge } from '@/components/primitives/Badge';
import type { FilterOption } from './MultiSelectListItem';

export interface MultiSelectTriggerContentProps {
  label: string;
  placeholder?: string;
  selectedIds: string[];
  singleSelectedOption: FilterOption | null;
}

export const MultiSelectTriggerContent: React.FC<MultiSelectTriggerContentProps> = ({
  label,
  placeholder,
  selectedIds,
  singleSelectedOption,
}) => {
  if (selectedIds.length === 0) {
    return (
      <span className="text-text-muted whitespace-nowrap overflow-hidden truncate">
        {placeholder || `Select ${label}...`}
      </span>
    );
  }

  if (singleSelectedOption) {
    return (
      <Badge variant={singleSelectedOption.color || 'default'} size="xs">
        {uppercaseLabel(singleSelectedOption.label)}
      </Badge>
    );
  }

  return (
    <span className="text-text-primary truncate block whitespace-nowrap">
      <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-on-brand text-xxs font-normal align-middle mr-1 bg-brand">
        {selectedIds.length}
      </span>
      selected
    </span>
  );
};
