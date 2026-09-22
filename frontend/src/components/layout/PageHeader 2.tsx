/**
 * PageHeader — detail page title row (`variant="detail"`) or compact list/section bar (`variant="bar"`).
 * When rendered under AppShell, portals into the top chrome row (same row as sidebar logo).
 */

import React, { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CHROME, PAGE_HEADER, RADIUS, SURFACE, TYPE } from '@/components/theme/recipes';
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
          PAGE_HEADER.barRow,
          placement === 'chrome' ? CHROME.pageHeaderChrome : `${PAGE_HEADER.barInline} ${RADIUS.surface}`,
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
        {actions != null && <div className={PAGE_HEADER.barActions}>{actions}</div>}
      </header>
    );
  }

  return (
    <header
      className={cn(
        PAGE_HEADER.detailRow,
        placement === 'chrome' && CHROME.pageHeaderChrome,
        className,
      )}
      role="banner"
    >
      <div className={PAGE_HEADER.detailMain}>
        {avatar != null && <div className="shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-1">
          <div className={PAGE_HEADER.detailTitleRow}>
            <h1 className={TYPE.detailTitle}>{title}</h1>
            {badges != null && <div className={PAGE_HEADER.detailBadges}>{badges}</div>}
          </div>
          {subtitle != null && subtitle !== '' && (
            <p className={`${TYPE.meta} mt-space-0-5`}>{subtitle}</p>
          )}
        </div>
      </div>
      {actions != null && <div className={PAGE_HEADER.detailActions}>{actions}</div>}
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
