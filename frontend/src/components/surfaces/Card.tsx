/**
 * Card — container box for list/dashboard/lab surfaces.
 */

import React, { type ReactNode } from 'react';
import { RADIUS, SHADOW, SURFACE } from '@/components/theme/recipes';
import { cn } from '@/utils';

export type CardVariant = 'default' | 'lab' | 'metric';

const BOX_VARIANT_CLASSES: Record<CardVariant, string> = {
  default: '',
  lab: `${SHADOW.subtle} hover:bg-surface-hover transition-colors duration-200`,
  metric: 'hover:border-brand hover:border-opacity-50 transition-colors duration-200',
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-space-3',
  md: 'p-panel',
  lg: 'p-space-5',
} as const;

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: keyof typeof PADDING_CLASSES;
  variant?: CardVariant;
  hover?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const cardSurfaceClass = cn(SURFACE.raised, RADIUS.surface, 'duration-200');

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  hover = false,
  onClick,
}) => {
  const classes = cn(
    cardSurfaceClass,
    PADDING_CLASSES[padding],
    BOX_VARIANT_CLASSES[variant],
    hover && 'cursor-pointer',
    className,
  );

  if (onClick) {
    return (
      <button type="button" className={cn(classes, 'text-left w-full')} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
};
