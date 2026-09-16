/**
 * Circular selection indicator (payment method / multi-select lists).
 */
import React from 'react';
import { Icon } from '@/components/primitives/Icon';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';

export interface SelectionCheckProps {
  isSelected: boolean;
  className?: string;
}

export const SelectionCheck: React.FC<SelectionCheckProps> = ({ isSelected, className }) => (
  <div
    className={cn(
      'w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-200 shrink-0',
      isSelected ? 'bg-brand' : 'bg-transparent border-2 border-border-strong',
      className
    )}
    aria-hidden
  >
    {isSelected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
  </div>
);
