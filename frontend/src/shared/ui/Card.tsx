/**
 * Card Component
 * Reusable card container
 */

import React, { type ReactNode } from 'react';
import { cardBase, padding as cardPadding } from '@/shared/design-system/tokens/components/card';
import { border } from '@/shared/design-system/tokens/borders';
import { heading, body } from '@/shared/design-system/tokens/typography';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding: paddingProp = 'md',
  hover = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: cardPadding.card.sm,
    md: cardPadding.card.md,
    lg: cardPadding.card.lg,
  };

  const hoverClass = hover ? cardBase.hover : '';

  return (
    <div className={`${cardBase.base} ${paddingClasses[paddingProp]} ${hoverClass} ${className}`}>
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
    <div className={`flex items-start justify-between mb-4 pb-4 ${border.divider}`}>
      <div>
        <h3 className={`${heading.h3}`}>{title}</h3>
        {subtitle && <p className={`${body.muted} mt-1`}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
