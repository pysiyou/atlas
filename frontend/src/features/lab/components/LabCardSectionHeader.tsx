/**
 * LabCardSectionHeader - Unified flat section header for lab workflows.
 *
 * Canonical style matches "Required for" on sample cards (uppercase label, content below).
 */

import React, { type ReactNode } from 'react';
import { LAB_CARD_CONTAINERS, LAB_CARD_SPACING, LAB_CARD_TYPOGRAPHY } from '../utils/labStyles';

interface LabCardSectionHeaderProps {
  title: string;
  children?: ReactNode;
  className?: string;
}

export const LabCardSectionHeader: React.FC<LabCardSectionHeaderProps> = ({ title, children, className }) => {
  const hasChildren = children != null && children !== false;

  return (
    <div className={className}>
      <div className={hasChildren ? LAB_CARD_SPACING.sectionTitleMargin : ''}>
        <span className={LAB_CARD_TYPOGRAPHY.sectionTitle}>{title}</span>
      </div>
      {hasChildren ? (
        <div className={LAB_CARD_TYPOGRAPHY.sectionContent}>{children}</div>
      ) : null}
    </div>
  );
};

/** Recessed lab card panel — same container as queue cards (collection tests, parameters, etc.). */
export function LabCardContentPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? LAB_CARD_CONTAINERS.contentSection}>
      <LabCardSectionHeader title={title}>{children}</LabCardSectionHeader>
    </div>
  );
}
