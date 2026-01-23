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

export const OrderInfoField: React.FC<OrderInfoFieldProps> = ({ icon, label, value, className = '' }) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      <Icon name={icon} className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5 leading-relaxed">
          {value}
        </p>
      </div>
    </div>
  );
};
