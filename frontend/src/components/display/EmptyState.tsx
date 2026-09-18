import React from 'react';
import { EMPTY } from '@/components/theme/recipes';
import { Icon, type IconName } from '@/components/primitives/Icon';

/**
 * When to use: default = full-page/section empty; compact = embedded (tables, charts, widgets).
 * Default copy: use DEFAULT_EMPTY_* from @/utils/constants.
 */
interface EmptyStateProps {
  /** Name of the icon to display */
  icon: IconName;
  /** Primary heading text */
  title: string;
  /** Secondary description; optional when variant="compact" (icon + title only) */
  description?: string;
  /** Optional action button or link */
  action?: React.ReactNode;
  /** Optional class name for the container */
  className?: string;
  /** default = full layout; compact = smaller icon/padding, description optional */
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  variant = 'default',
}) => {
  const isCompact = variant === 'compact';
  const containerClasses = isCompact ? EMPTY.containerCompact : EMPTY.containerDefault;
  const iconWrapperClasses = isCompact ? EMPTY.iconWrapCompact : EMPTY.iconWrapDefault;
  const iconClasses = isCompact ? 'w-5 h-5 text-text-disabled' : 'w-8 h-8 text-text-disabled';
  const titleClasses = isCompact ? EMPTY.titleCompact : EMPTY.titleDefault;

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={iconWrapperClasses}>
        <Icon name={icon} className={iconClasses} />
      </div>
      <p className={titleClasses}>{title}</p>
      {description != null && description !== '' && (
        <p className={EMPTY.description}>{description}</p>
      )}
      {action && <div className={EMPTY.actionWrap}>{action}</div>}
    </div>
  );
};
