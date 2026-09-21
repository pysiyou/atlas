import React from 'react';
import { EMPTY } from '@/components/theme/recipes';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { cn } from '@/utils';

/**
 * Unified empty UI for tables, panels, sections, and feeds.
 * Copy: see EMPTY_COPY / emptySubtitle in emptyStateCopy.ts and @/utils/constants.
 */
interface EmptyStateProps {
  /** When omitted, only title and description are shown */
  icon?: IconName;
  /** Primary heading (optional when iconOnly) */
  title?: string;
  /** Secondary line under the title */
  description?: string;
  /** Icon only — no visible title or description; use title for aria-label when provided */
  iconOnly?: boolean;
  action?: React.ReactNode;
  className?: string;
  /** default = section/page; compact = tables, charts, popovers */
  variant?: 'default' | 'compact';
  /** Grow to fill parent flex/grid area and center content */
  fill?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  variant = 'default',
  fill = false,
  iconOnly = false,
}) => {
  const isCompact = variant === 'compact';
  const containerClasses = isCompact ? EMPTY.containerCompact : EMPTY.containerDefault;
  const iconWrapperClasses = isCompact ? EMPTY.iconWrapCompact : EMPTY.iconWrapDefault;
  const iconClasses = isCompact ? 'w-5 h-5 text-text-disabled' : 'w-8 h-8 text-text-disabled';
  const titleClasses = isCompact ? EMPTY.titleCompact : EMPTY.titleDefault;
  const ariaLabel =
    iconOnly && title
      ? description
        ? `${title}. ${description}`
        : title
      : undefined;

  return (
    <div
      className={cn(
        containerClasses,
        fill && 'h-full w-full flex-1 min-h-0',
        className
      )}
      role={iconOnly ? 'status' : undefined}
      aria-label={ariaLabel}
    >
      {icon != null && (
        <div className={iconWrapperClasses}>
          <Icon name={icon} className={iconClasses} aria-hidden={iconOnly ? true : undefined} />
        </div>
      )}
      {!iconOnly && title != null && title !== '' && <p className={titleClasses}>{title}</p>}
      {!iconOnly && description != null && description !== '' && (
        <p className={EMPTY.description}>{description}</p>
      )}
      {action && <div className={EMPTY.actionWrap}>{action}</div>}
    </div>
  );
};
