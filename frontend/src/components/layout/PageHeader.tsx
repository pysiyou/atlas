/**
 * PageHeader — detail page title row (`variant="detail"`) or compact list/section bar (`variant="bar"`).
 * Not the same as Panel header.
 */

import React, { type ReactNode } from 'react';
import { cn } from '@/utils';
import { DETAIL_TITLE, DETAIL_SUBTITLE } from '@/utils/constants';

export type PageHeaderVariant = 'detail' | 'bar';

export interface PageHeaderProps {
  variant?: PageHeaderVariant;
  title: ReactNode;
  subtitle?: ReactNode;
  avatar?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  variant = 'detail',
  title,
  subtitle,
  avatar,
  badges,
  actions,
  className = '',
}) => {
  if (variant === 'bar') {
    return (
      <header
        className={cn(
          'shrink-0 h-12 min-h-12 max-h-12 w-full flex items-center justify-between gap-4 flex-nowrap py-2 px-4 rounded bg-surface border border-border-default',
          className,
        )}
        role="banner"
      >
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <h1 className="text-lg font-light text-text-primary truncate leading-tight">{title}</h1>
          {subtitle != null && subtitle !== '' && (
            <p className="text-sm text-text-tertiary truncate leading-tight">{subtitle}</p>
          )}
        </div>
        {actions != null && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
    );
  }

  return (
    <header
      className={cn(
        'flex items-center justify-between shrink-0 gap-3 flex-nowrap w-full',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
        {avatar != null && <div className="shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={DETAIL_TITLE}>{title}</h1>
            {badges != null && <div className="flex items-center gap-2 flex-wrap">{badges}</div>}
          </div>
          {subtitle != null && subtitle !== '' && (
            <p className={`${DETAIL_SUBTITLE} mt-0.5`}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions != null && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </header>
  );
};
