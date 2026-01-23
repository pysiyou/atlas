/**
 * Card Component
 * Reusable card container
 */

import React, { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const hoverClass = hover ? 'transition-all' : '';

  return (
    <div className={`bg-white rounded ${paddingClasses[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Card Header Component
 */
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
