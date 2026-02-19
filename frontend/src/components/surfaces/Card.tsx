/**
 * Card — container and callout in one file (max-depth-1).
 * Variants: default | lab | metric (box); neutral | info | success | warning | danger (callout).
 */

import React, { type ReactNode } from 'react';
import { Icon } from '@/components';
import type { IconName } from '@/components';

export type CardVariant = 'default' | 'lab' | 'metric';
export type CalloutVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const BOX_VARIANT_CLASSES: Record<CardVariant, string> = {
  default: '',
  lab: 'shadow-sm hover:bg-surface-hover transition-colors duration-200',
  metric: 'hover:border-brand hover:border-opacity-50 transition-colors duration-200',
};

const CALLOUT_STYLES: Record<
  CalloutVariant,
  { container: string; title: string; body: string; dot: string }
> = {
  neutral: {
    container: 'bg-neutral-100 border border-border-default',
    title: 'text-text-tertiary font-medium',
    body: 'text-text-tertiary',
    dot: 'bg-neutral-400',
  },
  info: {
    container: 'bg-brand-muted border border-border-focus',
    title: 'text-brand-fg font-medium',
    body: 'text-brand-fg',
    dot: 'bg-brand',
  },
  success: {
    container: 'bg-success-bg border border-success-stroke',
    title: 'text-success-fg-emphasis font-medium',
    body: 'text-success-fg-emphasis',
    dot: 'bg-success-fg-emphasis',
  },
  warning: {
    container: 'bg-warning-bg border border-warning-stroke',
    title: 'text-warning-fg-emphasis font-medium',
    body: 'text-warning-fg-emphasis',
    dot: 'bg-warning-fg-emphasis',
  },
  danger: {
    container: 'bg-danger-bg border border-danger-stroke',
    title: 'text-danger-fg-emphasis font-medium',
    body: 'text-danger-fg-emphasis',
    dot: 'bg-danger-fg-emphasis',
  },
};

const DEFAULT_CALLOUT_ICONS: Partial<Record<CalloutVariant, IconName>> = {
  danger: 'alert-circle',
  warning: 'warning',
  success: 'check-circle',
  info: 'info-circle',
};

interface CardBoxProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'list' | 'sm' | 'md' | 'lg';
  variant?: CardVariant;
  hover?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

interface CardCalloutProps {
  variant?: CalloutVariant;
  title: string;
  icon?: IconName;
  children?: ReactNode;
  items?: string[];
  className?: string;
}

export type CardProps =
  | (CardBoxProps & { title?: never })
  | (CardCalloutProps & { variant: CalloutVariant; children?: ReactNode });

function isCalloutProps(props: CardProps): props is CardCalloutProps & { variant: CalloutVariant } {
  const v = (props as CardProps).variant;
  return v === 'neutral' || v === 'info' || v === 'success' || v === 'warning' || v === 'danger';
}

export const Card: React.FC<CardProps> = (props) => {
  const {
    className = '',
    variant = 'default',
  } = props;

  if (isCalloutProps(props)) {
    const { title, icon, children, items } = props;
    const calloutVariant = variant as CalloutVariant;
    const styles = CALLOUT_STYLES[calloutVariant];
    const iconName = icon ?? DEFAULT_CALLOUT_ICONS[calloutVariant];
    return (
      <div
        className={`flex items-start gap-2 p-2 rounded ${styles.container} ${className}`}
        role={variant === 'danger' || variant === 'warning' ? 'alert' : undefined}
      >
        {iconName ? (
          <Icon name={iconName} className={`w-4 h-4 mt-0.5 shrink-0 ${styles.body}`} />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${styles.dot}`} />
        )}
        <div className="flex-1 min-w-0">
          <div className={`text-xs mb-1 ${styles.title}`}>{title}</div>
          {items && items.length > 0 ? (
            <ul className="list-disc list-inside space-y-0.5">
              {items.map((item, idx) => (
                <li key={idx} className={`text-xs ${styles.body}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <div className={`text-xs ${styles.body}`}>{children}</div>
          )}
        </div>
      </div>
    );
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
export const CalloutCard: React.FC<CardCalloutProps> = (props) => (
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
