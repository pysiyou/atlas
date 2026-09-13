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
    container: 'bg-tone-neutral-bg border border-tone-neutral-border',
    title: 'text-tone-neutral-text font-medium',
    body: 'text-tone-neutral-text',
    dot: 'bg-tone-neutral-text',
  },
  info: {
    container: 'bg-tone-info-bg border border-tone-info-border',
    title: 'text-tone-info-text font-medium',
    body: 'text-tone-info-text',
    dot: 'bg-tone-info-text',
  },
  success: {
    container: 'bg-tone-success-bg border border-tone-success-border',
    title: 'text-tone-success-text font-medium',
    body: 'text-tone-success-text',
    dot: 'bg-tone-success-text',
  },
  warning: {
    container: 'bg-tone-warning-bg border border-tone-warning-border',
    title: 'text-tone-warning-text font-medium',
    body: 'text-tone-warning-text',
    dot: 'bg-tone-warning-text',
  },
  danger: {
    container: 'bg-tone-danger-bg border border-tone-danger-border',
    title: 'text-tone-danger-text font-medium',
    body: 'text-tone-danger-text',
    dot: 'bg-tone-danger-text',
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
