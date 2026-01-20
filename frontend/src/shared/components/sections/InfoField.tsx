/**
 * InfoField - Label-value display component
 * 
 * Provides a consistent way to display label-value pairs in detail views.
 * Supports both horizontal and vertical orientations.
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui/Icon';

export interface InfoFieldProps {
  /** Field label */
  label: string;
  /** Field value (can be string, number, or React node) */
  value: React.ReactNode;
  /** Optional icon to display before label */
  icon?: IconName;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Additional CSS classes */
  className?: string;
}

/**
 * InfoField component
 * 
 * @example
 * ```tsx
 * <InfoField
 *   label="Email"
 *   value={patient.email}
 *   icon="mail"
 *   orientation="horizontal"
 * />
 * ```
 */
export const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  icon,
  orientation = 'horizontal',
  className = '',
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className="w-4 h-4 text-gray-400" />}
          <label className="text-xs font-medium text-gray-500">{label}</label>
        </div>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    );
  }

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        {icon && <Icon name={icon} className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <label className="text-xs font-medium text-gray-500 whitespace-nowrap">{label}</label>
      </div>
      <div className="text-sm text-gray-900 text-right min-w-0">{value}</div>
    </div>
  );
};
