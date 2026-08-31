/**
 * MobileEntityCard — shared shell for mobile list/table cards.
 */

import React from 'react';
import { cn } from '@/utils';

export interface MobileEntityCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MOBILE_ENTITY_CARD_CLASS =
  'bg-surface border border-border-default rounded-md p-3 duration-200 cursor-pointer flex flex-col h-full';

export const MobileEntityCard: React.FC<MobileEntityCardProps> = ({
  children,
  onClick,
  className,
}) => (
  <div onClick={onClick} className={cn(MOBILE_ENTITY_CARD_CLASS, className)}>
    {children}
  </div>
);
