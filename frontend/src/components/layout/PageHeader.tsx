/**
 * PageHeader — detail page title row (`variant="detail"`) or compact list/section bar (`variant="bar"`).
 * When rendered under AppShell, portals into the top chrome row (same row as sidebar logo).
 */

import React, { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SURFACE, TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';
import { useAppChromeMount } from './appChromeMount';

export type PageHeaderVariant = 'detail' | 'bar';
export type PageHeaderPlacement = 'inline' | 'chrome';

export interface PageHeaderProps {
  variant?: PageHeaderVariant;
  title: ReactNode;
  subtitle?: ReactNode;
  avatar?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

function PageHeaderContent({
  variant,
  placement,
  title,
  subtitle,
  avatar,
  badges,
  actions,
  className,
}: PageHeaderProps & { placement: PageHeaderPlacement }) {
  if (variant === 'bar') {
    return (
      <header
        className={cn(
          'w-full flex items-center justify-between gap-4 flex-nowrap min-w-0',
          placement === 'chrome'
            ? 'h-full min-h-16 px-0 lg:px-2'
            : 'shrink-0 h-12 min-h-12 max-h-12 py-2 px-4 rounded',
          placement === 'inline' && SURFACE.raised,
          className,
        )}
        role="banner"
      >
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <h1 className={`${TYPE.pageTitle} truncate leading-tight`}>{title}</h1>
          {subtitle != null && subtitle !== '' && (
            <p className={`${TYPE.meta} truncate leading-tight`}>{subtitle}</p>
          )}
        </div>
        {actions != null && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
    );
  }

  return (
    <header
      className={cn(
        'flex items-center justify-between shrink-0 gap-3 flex-nowrap w-full min-w-0',
        placement === 'chrome' && 'min-h-16 h-full py-2 px-0 lg:px-2',
        className,
      )}
      role="banner"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
        {avatar != null && <div className="shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className={TYPE.detailTitle}>{title}</h1>
            {badges != null && <div className="flex items-center gap-2 flex-wrap">{badges}</div>}
          </div>
          {subtitle != null && subtitle !== '' && (
            <p className={`${TYPE.meta} mt-0.5`}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions != null && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  variant = 'detail',
  ...rest
}) => {
  const mountNode = useAppChromeMount();
  const content = (
    <PageHeaderContent {...rest} variant={variant} placement={mountNode ? 'chrome' : 'inline'} />
  );

  if (mountNode) {
    return createPortal(content, mountNode);
  }

  return content;
};
