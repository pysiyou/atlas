/**
 * InfoField - Label-value display component
 *
 * Provides a consistent way to display label-value pairs in detail views.
 * Supports both horizontal and vertical orientations.
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui/Icon';
import { infoField } from '@/shared/design-system/tokens/components/shared';

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
      <div className={`${infoField.container.vertical} ${className}`}>
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className={infoField.icon} />}
          <label className={infoField.label}>{label}</label>
        </div>
        <div className={infoField.value}>{value}</div>
      </div>
    );
  }

  return (
    <div className={`${infoField.container.horizontal} ${className}`}>
      <div className={infoField.labelContainer}>
        {icon && <Icon name={icon} className={`${infoField.icon} flex-shrink-0`} />}
        <label className={`${infoField.label} whitespace-nowrap`}>{label}</label>
      </div>
      <div className={`${infoField.value} text-right min-w-0`}>{value}</div>
    </div>
  );
};
