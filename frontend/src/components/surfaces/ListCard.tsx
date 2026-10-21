/**
 * Interactive list/grid card shell.
 */

import React, { type ReactNode } from 'react';
import { RADIUS, SURFACE } from '@/theme/recipes';
import { cn } from '@/utils';

export interface ListCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export const LIST_CARD_CLASS =
  `${SURFACE.raised} ${RADIUS.surface} p-space-3 duration-200 cursor-pointer flex flex-col h-full`;

function ListCardRoot({ children, onPress, className }: ListCardProps) {
  return (
    <div onClick={onPress} className={cn(LIST_CARD_CLASS, className)}>
      {children}
    </div>
  );
}

export interface ListCardHeaderProps {
  leading: ReactNode;
  trailing?: ReactNode;
}

function ListCardHeader({ leading, trailing }: ListCardHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-space-3 pb-space-3 border-b border-border-default">
      {leading}
      {trailing}
    </div>
  );
}

type ListCardComponent = typeof ListCardRoot & {
  Header: typeof ListCardHeader;
};

export const ListCard = Object.assign(ListCardRoot, {
  Header: ListCardHeader,
}) as ListCardComponent;
