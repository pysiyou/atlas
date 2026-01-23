/**
 * MultiSelectControl Component
 * Enhanced multi-select dropdown for filters
 */

import React from 'react';
import { MultiSelectFilter } from '@/shared/ui';
import type { IconName } from '@/shared/ui/Icon';
import type { MultiSelectFilterControl } from '../types';

/**
 * Props for MultiSelectControl component
 */
export interface MultiSelectControlProps {
  /** Currently selected option IDs */
  value: string[];
  /** Callback when selection changes */
  onChange: (value: string[]) => void;
  /** Filter control configuration */
  config: MultiSelectFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * MultiSelectControl Component
 *
 * Wraps the existing MultiSelectFilter component with the new filter control interface.
 *
 * @component
 */
export const MultiSelectControl: React.FC<MultiSelectControlProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  return (
    <MultiSelectFilter
      label={config.label}
      options={config.options}
      selectedIds={value}
      onChange={onChange}
      placeholder={config.placeholder || `Select ${config.label.toLowerCase()}...`}
      selectAllLabel={config.selectAllLabel || `All ${config.label.toLowerCase()}`}
      icon={config.icon as IconName | undefined}
      className={className}
    />
  );
};
