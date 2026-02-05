import React from 'react';
import { Icon, type IconName } from './Icon';

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
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <Icon name={icon} className="w-8 h-8 text-text-disabled" />
      </div>
      <p className="text-base font-semibold text-text mb-2">{title}</p>
      <p className="text-sm text-text-3 mb-4 max-w-md">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
