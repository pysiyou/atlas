/**
 * Callout Component
 *
 * Displays a highlighted message or status alert.
 * Extracted from Card.tsx to separate concerns.
 */

import React from 'react';
import { Icon } from '@/components/primitives/Icon';
import { FEEDBACK_ICON_KEYS } from '@/config/icons';
import type { IconKey } from '@/config/icons';
import { text, RADIUS, TONE } from '@/theme/recipes';

export type CalloutVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** Compose TONE well + fg (+ fill dot) for a Callout variant. */
function calloutChrome(role: CalloutVariant) {
  const tone = TONE[role];
  return {
    container: tone.well,
    title: `${tone.fg} font-medium`,
    body: tone.fg,
    dot: tone.fill,
  };
}

const CALLOUT_STYLES: Record<
  CalloutVariant,
  { container: string; title: string; body: string; dot: string }
> = {
  neutral: calloutChrome('neutral'),
  info: calloutChrome('info'),
  success: calloutChrome('success'),
  warning: calloutChrome('warning'),
  danger: calloutChrome('danger'),
};

const DEFAULT_CALLOUT_ICON_KEYS: Partial<Record<CalloutVariant, IconKey>> = {
  danger: FEEDBACK_ICON_KEYS.danger,
  warning: FEEDBACK_ICON_KEYS.warning,
  success: FEEDBACK_ICON_KEYS.success,
  info: FEEDBACK_ICON_KEYS.info,
};

export interface CalloutProps {
  variant?: CalloutVariant;
  title: string;
  icon?: IconKey;
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
  const iconKey = icon ?? DEFAULT_CALLOUT_ICON_KEYS[variant];

  return (
    <div
      className={`flex items-start gap-space-2 p-space-2 ${RADIUS.field} ${styles.container} ${className}`}
      role={variant === 'danger' || variant === 'warning' ? 'alert' : undefined}
    >
      {iconKey ? (
        <Icon iconKey={iconKey} className={`w-4 h-4 mt-space-0-5 shrink-0 ${styles.body}`} />
      ) : (
        <span className={`w-1.5 h-1.5 ${RADIUS.pill} mt-space-1-5 shrink-0 ${styles.dot}`} />
      )}
      <div className="flex-1 min-w-0">
        <div className={`${text({ role: 'body' })} mb-space-1 ${styles.title}`}>{title}</div>
        {items && items.length > 0 ? (
          <ul className="list-disc list-inside space-y-space-0-5">
            {items.map((item, idx) => (
              <li key={idx} className={`${text({ role: 'body' })} ${styles.body}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <div className={`${text({ role: 'body' })} ${styles.body}`}>{children}</div>
        )}
      </div>
    </div>
  );
};
