import React from 'react';
import { Icon, type IconName } from './Icon';
import { emptyStateCard } from '@/shared/design-system/tokens/components/card';

interface EmptyStateProps {
  /** Name of the icon to display */
  icon: IconName;
  /** Primary heading text */
  title: string;
  /** Secondary description text */
  description: string;
  /** Optional action button or link */
  action?: React.ReactNode;
  /** Optional class name for the container */
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`${emptyStateCard.container} ${className}`}
    >
      <div className={emptyStateCard.iconContainer}>
        <Icon name={icon} className={emptyStateCard.icon} />
      </div>
      <p className={emptyStateCard.title}>{title}</p>
      <p className={emptyStateCard.description}>{description}</p>
      {action && <div className={emptyStateCard.action}>{action}</div>}
    </div>
  );
};
