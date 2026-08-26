/**
 * InfoBanner - Unified component for section headers and contextual information
 * Replaces inconsistent patterns: contentTitle, ContextPanel, CalloutCard
 */

import React, { useState, type ReactNode } from 'react';
import { Icon } from '@/components';
import { ICONS, cn } from '@/utils';

export interface InfoBannerProps {
  /** Banner title */
  title: string;
  /** Visual variant - determines icon and colors */
  variant?: 'info' | 'warning' | 'danger' | 'neutral' | 'default';
  /** If true, shows collapsible panel with content */
  collapsible?: boolean;
  /** Starting state for collapsible */
  defaultCollapsed?: boolean;
  /** Content to display (for collapsible or expanded banners) */
  children?: ReactNode;
  /** Optional item count badge */
  itemCount?: number;
  /** CSS classes */
  className?: string;
}

/**
 * InfoBanner component
 * 
 * Supports multiple use cases:
 * 1. Simple title (default variant) - matches current contentTitle style
 * 2. Collapsible info panel (info/warning variants) - replaces ContextPanel
 * 3. Static callout (danger/warning/neutral variants) - replaces CalloutCard
 */
export const InfoBanner: React.FC<InfoBannerProps> = ({
  title,
  variant = 'default',
  collapsible = false,
  defaultCollapsed = false,
  children,
  itemCount,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Default variant: simple title only (like contentTitle)
  if (variant === 'default') {
    return (
      <div className={cn('text-xxs font-medium text-text-tertiary uppercase tracking-wide mb-1.5', className)}>
        {title}
      </div>
    );
  }

  // Variant styles
  const variantStyles = {
    info: {
      bg: 'bg-info-bg/50',
      border: 'border-info-stroke',
      icon: ICONS.ui.info,
      iconColor: 'text-info-fg',
      textColor: 'text-info-fg',
    },
    warning: {
      bg: 'bg-warning-bg/50',
      border: 'border-warning-stroke',
      icon: ICONS.actions.alertCircle,
      iconColor: 'text-warning-fg',
      textColor: 'text-warning-fg',
    },
    danger: {
      bg: 'bg-danger-bg/50',
      border: 'border-danger-stroke',
      icon: ICONS.actions.alertCircle,
      iconColor: 'text-danger-fg',
      textColor: 'text-danger-fg',
    },
    neutral: {
      bg: 'bg-surface-page/50',
      border: 'border-border-default',
      icon: ICONS.ui.info,
      iconColor: 'text-text-tertiary',
      textColor: 'text-text-secondary',
    },
  };

  const styles = variantStyles[variant as keyof typeof variantStyles];

  // Collapsible variant
  if (collapsible) {
    return (
      <div className={cn('rounded-lg border', styles.border, styles.bg, className)}>
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon 
              name={styles.icon} 
              className={cn('w-4 h-4', styles.iconColor)} 
            />
            <span className={cn('text-xs font-normal', styles.textColor)}>
              {title}
            </span>
            {itemCount !== undefined && (
              <span className="text-xxs text-text-disabled">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </div>
          <Icon
            name={isCollapsed ? ICONS.ui.chevronDown : ICONS.ui.chevronUp}
            className={cn('w-4 h-4 text-text-tertiary transition-transform')}
          />
        </button>

        {/* Content */}
        {!isCollapsed && children && (
          <div className="px-3 pb-3">
            {children}
          </div>
        )}
      </div>
    );
  }

  // Static variant (non-collapsible with content)
  return (
    <div className={cn('rounded-lg border', styles.border, styles.bg, 'p-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Icon 
          name={styles.icon} 
          className={cn('w-4 h-4', styles.iconColor)} 
        />
        <span className={cn('text-xs font-normal', styles.textColor)}>
          {title}
        </span>
      </div>

      {/* Content */}
      {children && (
        <div className="text-xs text-text-primary">
          {children}
        </div>
      )}
    </div>
  );
};
