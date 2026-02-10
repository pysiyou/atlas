/**
 * InfoField - Label-value display component
 *
 * Provides a consistent way to display label-value pairs in detail views.
 * Supports both horizontal and vertical orientations.
 */

import React from 'react';
import { DETAIL_LABEL, DETAIL_VALUE } from '@/shared/constants';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';

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
  // Vertical layout (icon-left style used by patient/order displays)
  if (orientation === 'vertical') {
    return (
      <div className={`flex gap-3 ${className}`}>
        {icon && <Icon name={icon} className="w-4 h-4 text-fg-disabled shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className={DETAIL_LABEL}>{label}</div>
          {/* Using div instead of p to support ReactNode values that may contain block elements */}
          <div className={`font-normal mt-0.5 leading-relaxed ${DETAIL_VALUE}`}>{value}</div>
        </div>
      </div>
    );
  }

  // Horizontal layout (label-value side by side)
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} className="w-4 h-4 text-fg-subtle flex-shrink-0" />}
        <div className={`font-normal whitespace-nowrap ${DETAIL_LABEL}`}>{label}</div>
      </div>
      <div className={`text-right min-w-0 ${DETAIL_VALUE}`}>{value}</div>
    </div>
  );
};
