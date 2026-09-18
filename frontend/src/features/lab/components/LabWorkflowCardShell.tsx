/**
 * Base Lab Card Component
 * Shared structure for sample collection, result entry, and result validation cards.
 */

import React, { type ReactNode } from 'react';
import { Card, Badge, EntityId } from '@/components';
import { LabCardSectionHeader } from './LabCardSectionHeader';
import { LabHeaderContent, type LabAuditLine } from './LabWorkflowHeader';
import type { LabIdentityContext } from './LabIdentityRow';
import {
  LAB_CARD_SPACING,
  LAB_CARD_CONTAINERS,
  LAB_CARD_LIST_ITEMS,
  LAB_CARD_BADGE_SIZE,
} from '../utils/labStyles';

interface LabWorkflowCardShellProps {
  onClick?: (e: React.MouseEvent) => void;
  context: LabIdentityContext;
  auditLines?: LabAuditLine[];
  badges: ReactNode;
  actions: ReactNode;
  content: ReactNode;
  contentTitle: string;
  recollectionBanner?: ReactNode;
  flags?: ReactNode;
  className?: string;
}

export const LabWorkflowCardShell: React.FC<LabWorkflowCardShellProps> = ({
  onClick,
  context,
  auditLines,
  badges,
  actions,
  content,
  contentTitle,
  recollectionBanner,
  flags,
  className = '',
}) => (
  <div className={`${LAB_CARD_CONTAINERS.cardWrapper} ${className}`} onClick={onClick}>
    <Card variant="lab">
      <div className={`flex flex-col ${LAB_CARD_SPACING.cardGap}`}>
        <LabHeaderContent
          context={context}
          badges={badges}
          auditLines={auditLines}
          actions={actions}
        />

        <div className={LAB_CARD_CONTAINERS.contentSection}>
          <LabCardSectionHeader title={contentTitle}>{content}</LabCardSectionHeader>
        </div>

        {flags}
        {recollectionBanner}
      </div>
    </Card>
  </div>
);

interface InfoBadgeProps {
  count: number;
  total: number;
  label: string;
  isComplete?: boolean;
}

export const ProgressBadge: React.FC<InfoBadgeProps> = ({
  count,
  total,
  label,
  isComplete = false,
}) => (
  <div className="flex flex-col items-end gap-space-0-5">
    <Badge size={LAB_CARD_BADGE_SIZE} variant={isComplete ? 'success' : 'warning'}>
      {count}/{total} {label}
    </Badge>
  </div>
);

interface TestListProps {
  tests: Array<{ name: string; code: string }>;
}

export const TestList: React.FC<TestListProps> = ({ tests }) => (
  <ul className={LAB_CARD_SPACING.listGap}>
    {tests.map((test, i) => (
      <li key={test.code || i} className={LAB_CARD_LIST_ITEMS.testItem}>
        <span className={LAB_CARD_LIST_ITEMS.bullet} />
        <span className={LAB_CARD_LIST_ITEMS.testName}>{test.name}</span>
        <EntityId variant="inline">{test.code}</EntityId>
      </li>
    ))}
  </ul>
);
