/**
 * InfoBanner - Unified flat section header for lab workflows.
 *
 * Canonical style matches "Required for" on sample cards (uppercase label, content below).
 */

import React, { type ReactNode } from 'react';
import { LAB_CARD_SPACING, LAB_CARD_TYPOGRAPHY } from '../utils/labStyles';

interface InfoBannerProps {
  title: string;
  children?: ReactNode;
  className?: string;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({ title, children, className }) => {
  const hasChildren = children != null && children !== false;

  return (
    <div className={className}>
      <div className={hasChildren ? LAB_CARD_SPACING.sectionTitleMargin : ''}>
        <span className={LAB_CARD_TYPOGRAPHY.sectionTitle}>{title}</span>
      </div>
      {hasChildren ? children : null}
    </div>
  );
};
