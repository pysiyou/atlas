/**
 * OrderInfoField Component
 * Displays a label-value pair with an icon
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui/Icon';

export interface OrderInfoFieldProps {
  icon: IconName;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export const OrderInfoField: React.FC<OrderInfoFieldProps> = ({
  icon,
  label,
  value,
  className = '',
}) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      <Icon name={icon} className="w-4 h-4 text-text-disabled shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-tertiary">{label}</p>
        {/**
         * NOTE:
         * We intentionally render the value inside a <div> instead of a <p>.
         * `value` can be a ReactNode (e.g. <Badge />) and some components render
         * block-level elements like <div>. A <p> cannot contain a <div>, which
         * causes invalid HTML and can lead to React hydration warnings.
         */}
        <div className="text-sm font-medium text-text-primary mt-0.5 leading-relaxed">{value}</div>
      </div>
    </div>
  );
};
