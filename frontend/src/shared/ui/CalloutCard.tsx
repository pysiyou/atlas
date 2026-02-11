/**
 * CalloutCard - Reusable alert/callout block with variant, optional icon, title, and body.
 * Use for rejection criteria, fasting notices, warnings, success/info callouts, etc.
 */

import React, { type ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

export type CalloutVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

interface CalloutCardProps {
  /** Visual variant (maps to theme bg/border/text) */
  variant?: CalloutVariant;
  /** Label/title shown above the body */
  title: string;
  /** Optional icon name; defaults per variant if not set */
  icon?: IconName;
  /** Body: custom content */
  children?: ReactNode;
  /** Body: render as bullet list (use instead of children) */
  items?: string[];
  className?: string;
}

const VARIANT_STYLES: Record<
  CalloutVariant,
  { container: string; title: string; body: string; dot: string }
> = {
  neutral: {
    container: 'bg-neutral-100 border border-stroke',
    title: 'text-fg-subtle font-medium',
    body: 'text-fg-subtle',
    dot: 'bg-neutral-400',
  },
  info: {
    container: 'bg-brand-muted border border-stroke-focus',
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

/** Default icon per variant when icon prop is not provided */
const DEFAULT_ICONS: Partial<Record<CalloutVariant, IconName>> = {
  danger: 'alert-circle',
  warning: 'warning',
  success: 'check-circle',
  info: 'info-circle',
};

export const CalloutCard: React.FC<CalloutCardProps> = ({
  variant = 'neutral',
  title,
  icon,
  children,
  items,
  className = '',
}) => {
  const styles = VARIANT_STYLES[variant];
  const iconName = icon ?? DEFAULT_ICONS[variant];

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
              <li key={idx} className={`text-xs ${styles.body}`}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <div className={`text-xs ${styles.body}`}>{children}</div>
        )}
      </div>
    </div>
  );
};
