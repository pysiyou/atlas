/**
 * Callout Component
 *
 * Displays a highlighted message or status alert.
 * Extracted from Card.tsx to separate concerns.
 */

import React from 'react';
import { Icon, type IconName } from '@/components/primitives/Icon';

export type CalloutVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

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

export interface CalloutProps {
  variant?: CalloutVariant;
  title: string;
  icon?: IconName;
  children?: React.ReactNode;
  items?: string[];
  className?: string;
}

export const Callout: React.FC<CalloutProps> = ({
  variant = 'neutral',
  title,
  icon,
  children,
  items,
  className = '',
}) => {
  const styles = CALLOUT_STYLES[variant];
  const iconName = icon ?? DEFAULT_CALLOUT_ICONS[variant];

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
};
