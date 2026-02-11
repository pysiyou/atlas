import React from 'react';
import { Icon, type IconName } from './Icon';

/**
 * When to use: default = full-page/section empty; compact = embedded (tables, charts, widgets).
 * Default copy: use DEFAULT_EMPTY_* from @/shared/constants.
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
  const containerClasses = isCompact
    ? 'flex flex-col items-center justify-center py-6 px-4 text-center'
    : 'flex flex-col items-center justify-center py-12 px-6 text-center';
  const iconWrapperClasses = isCompact
    ? 'w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3'
    : 'w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4';
  const iconClasses = isCompact ? 'w-5 h-5 text-text-disabled' : 'w-8 h-8 text-text-disabled';
  const titleClasses = isCompact
    ? 'text-sm font-normal text-text-primary mb-1'
    : 'text-base font-normal text-text-primary mb-2';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={iconWrapperClasses}>
        <Icon name={icon} className={iconClasses} />
      </div>
      <p className={titleClasses}>{title}</p>
      {description != null && description !== '' && (
        <p className="text-sm text-text-tertiary mb-4 max-w-md">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
