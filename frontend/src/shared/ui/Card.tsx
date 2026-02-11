/**
 * Card Component
 * Reusable card container with optional elevation/hover variants.
 */

import React, { type ReactNode } from 'react';

export type CardVariant = 'default' | 'lab' | 'metric';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'list' | 'sm' | 'md' | 'lg';
  /** Visual variant: default (no hover), lab (surface hover, matches table row), metric (brand hover) */
  variant?: CardVariant;
  /** Deprecated: use variant for hover style; when true with variant=default, only adds cursor-pointer */
  hover?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: '',
  lab: 'shadow-sm hover:bg-surface-hover transition-colors duration-200',
  metric: 'hover:border-brand hover:border-opacity-50 transition-colors duration-200',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding: paddingProp = 'md',
  variant = 'default',
  hover = false,
  onClick,
}) => {
  // md and lg intentionally share p-4; use 'list' for tighter padding
  const paddingClasses = {
    none: '',
    list: 'p-3',
    sm: 'p-4',
    md: 'p-4',
    lg: 'p-4',
  };

  const baseClasses = 'bg-surface rounded-md border border-border-default duration-200';
  const hoverClass = hover ? 'cursor-pointer' : '';
  const variantClass = VARIANT_CLASSES[variant];

  return (
    <div
      className={`${baseClasses} ${paddingClasses[paddingProp]} ${variantClass} ${hoverClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

/**
 * Card Header Component
 */
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-start justify-between mb-4 pb-4 border-b border-border-default">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {subtitle && <p className="text-sm text-text-tertiary mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
