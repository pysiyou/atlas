/**
 * Card — container box for list/dashboard/lab surfaces.
 */

import React, { type ReactNode } from 'react';
import { RADIUS, SHADOW, SURFACE } from '@/theme/recipes';
import { cn } from '@/utils';
import { FieldsPlaceholder } from './FieldsPlaceholder';

export type CardVariant = 'default' | 'interactive' | 'metric';

const BOX_VARIANT_CLASSES: Record<CardVariant, string> = {
  default: '',
  interactive: `${SHADOW.subtle} hover:bg-surface-hover transition-colors duration-200`,
  metric: 'hover:border-brand hover:border-opacity-50 transition-colors duration-200',
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-space-3',
  md: 'p-panel',
  lg: 'p-space-5',
} as const;

export interface CardProps {
  children?: ReactNode;
  className?: string;
  padding?: keyof typeof PADDING_CLASSES;
  variant?: CardVariant;
  hover?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  loading?: boolean;
}

const cardSurfaceClass = cn(SURFACE.raised, RADIUS.surface, 'duration-200');

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  hover = false,
  onClick,
  loading = false,
}) => {
  /** Same pair pattern as Panel; min-height gives auto-sized cards a measurable host. */
  const body = loading ? (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <FieldsPlaceholder />
    </div>
  ) : (
    children
  );
  const classes = cn(
    cardSurfaceClass,
    PADDING_CLASSES[padding],
    BOX_VARIANT_CLASSES[variant],
    hover && BOX_VARIANT_CLASSES.interactive,
    onClick != null && 'cursor-pointer',
    loading && 'flex min-h-[8rem] flex-col',
    className,
  );

  if (onClick && !loading) {
    return (
      <button type="button" className={cn(classes, 'text-left w-full')} onClick={onClick}>
        {body}
      </button>
    );
  }

  return (
    <div className={classes} aria-busy={loading || undefined}>
      {body}
    </div>
  );
};
