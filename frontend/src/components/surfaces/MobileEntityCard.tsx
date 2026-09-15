/**
 * MobileEntityCard — shared shell for mobile list/table cards.
 */

import React, { type ReactNode } from 'react';
import { cn } from '@/utils';

export interface MobileEntityCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MOBILE_ENTITY_CARD_CLASS =
  'bg-surface border border-border-default rounded-md p-3 duration-200 cursor-pointer flex flex-col h-full';

function MobileEntityCardRoot({ children, onClick, className }: MobileEntityCardProps) {
  return (
    <div onClick={onClick} className={cn(MOBILE_ENTITY_CARD_CLASS, className)}>
      {children}
    </div>
  );
}

export interface MobileEntityCardHeaderProps {
  leading: ReactNode;
  trailing?: ReactNode;
}

function MobileEntityCardHeader({ leading, trailing }: MobileEntityCardHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-default">
      {leading}
      {trailing}
    </div>
  );
}

type MobileEntityCardComponent = typeof MobileEntityCardRoot & {
  Header: typeof MobileEntityCardHeader;
};

export const MobileEntityCard = Object.assign(MobileEntityCardRoot, {
  Header: MobileEntityCardHeader,
}) as MobileEntityCardComponent;
