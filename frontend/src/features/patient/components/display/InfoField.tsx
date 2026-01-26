/**
 * InfoField Component
 * Displays a label-value pair with an icon
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui/Icon';

export interface InfoFieldProps {
  icon: IconName;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export const InfoField: React.FC<InfoFieldProps> = ({ icon, label, value, className = '' }) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      <Icon name={icon} className="w-4 h-4 text-text-disabled shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-tertiary">{label}</p>
        <p className="text-sm font-medium text-text-primary mt-0.5 leading-relaxed">{value}</p>
      </div>
    </div>
  );
};
