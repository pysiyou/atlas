/**
 * DetailPageHeader - Shared detail page header with title, optional subtitle, avatar, badges, actions.
 * Enforces a11y (always renders h1) and consistent typography via DETAIL_TITLE / DETAIL_SUBTITLE.
 */

import React, { type ReactNode } from 'react';
import { DETAIL_TITLE, DETAIL_SUBTITLE } from '@/shared/constants/typography';

export interface DetailPageHeaderProps {
  /** Page title (rendered in h1) */
  title: string;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Optional left slot (e.g. Avatar + popover) before title */
  avatar?: ReactNode;
  /** Optional badges after title row */
  badges?: ReactNode;
  /** Optional right-side actions */
  actions?: ReactNode;
  className?: string;
}

export const DetailPageHeader: React.FC<DetailPageHeaderProps> = ({
  title,
  subtitle,
  avatar,
  badges,
  actions,
  className = '',
}) => (
  <header
    className={`flex items-center justify-between shrink-0 gap-3 flex-nowrap w-full ${className}`.trim()}
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
