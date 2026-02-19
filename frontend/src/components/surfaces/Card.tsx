/**
 * Card — container box.
 * 
 * Note: Callout variants are now handled by the <Callout> component.
 * This component handles standard CardBoxes and provides backward-compatibility
 * for the 'Callout' style usage by delegating to the new component.
 */

import React, { type ReactNode } from 'react';
import { Callout, type CalloutVariant, type CalloutProps } from '@/components/display/Callout';


export type CardVariant = 'default' | 'lab' | 'metric';
// Re-export CalloutVariant for backward compatibility imports
export type { CalloutVariant };

const BOX_VARIANT_CLASSES: Record<CardVariant, string> = {
  default: '',
  lab: 'shadow-sm hover:bg-surface-hover transition-colors duration-200',
  metric: 'hover:border-brand hover:border-opacity-50 transition-colors duration-200',
};

interface CardBoxProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'list' | 'sm' | 'md' | 'lg';
  variant?: CardVariant;
  hover?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

// Backward-compat: Union with CalloutProps
export type CardProps =
  | (CardBoxProps & { title?: never })
  | (CalloutProps & { variant: CalloutVariant; children?: ReactNode });

function isCalloutProps(props: CardProps): props is CalloutProps & { variant: CalloutVariant } {
  const v = (props as CardProps).variant;
  return v === 'neutral' || v === 'info' || v === 'success' || v === 'warning' || v === 'danger';
}

export const Card: React.FC<CardProps> = (props) => {
  const {
    className = '',
    variant = 'default',
  } = props;

  if (isCalloutProps(props)) {
    return <Callout {...props} className={className} />;
  }

  const { children, padding: paddingProp = 'md', hover = false, onClick } = props;
  const paddingClasses = {
    none: '',
    list: 'p-3',
    sm: 'p-4',
    md: 'p-4',
    lg: 'p-4',
  };
  const baseClasses = 'bg-surface rounded-md border border-border-default duration-200';
  const variantClass = BOX_VARIANT_CLASSES[(variant as CardVariant) || 'default'];
  const hoverClass = hover ? 'cursor-pointer' : '';

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

/** Backward-compat alias: CalloutCard is Card with callout variant */
export const CalloutCard: React.FC<CalloutProps> = (props) => (
  <Card {...props} variant={props.variant ?? 'neutral'} />
);

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-4 pb-4 border-b border-border-default">
    <div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {subtitle && <p className="text-sm text-text-tertiary mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
