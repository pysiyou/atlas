/**
 * Base Lab Card Component
 * Shared structure for sample collection, result entry, and result validation cards.
 */

import React, { type ReactNode } from 'react';
import { Card, EntityId } from '@/components';
import { LabCardContentPanel } from './LabCardSectionHeader';
import { LabHeaderContent, type LabAuditLine } from './LabWorkflowHeader';
import type { LabIdentityContext } from './LabIdentityRow';
import { LAB_CARD_LIST_ITEMS, LAB_CARD_SPACING } from '../utils/labStyles';

interface LabWorkflowCardShellProps {
  onClick?: (e: React.MouseEvent) => void;
  context: LabIdentityContext;
  auditLines?: LabAuditLine[];
  badges: ReactNode;
  meta?: ReactNode;
  actions: ReactNode;
  content?: ReactNode;
  contentTitle?: string;
  recollectionBanner?: ReactNode;
  flags?: ReactNode;
  className?: string;
}

export const LabWorkflowCardShell: React.FC<LabWorkflowCardShellProps> = ({
  onClick,
  context,
  auditLines,
  badges,
  meta,
  actions,
  content,
  contentTitle,
  recollectionBanner,
  flags,
  className = '',
}) => (
  <div className={`cursor-pointer ${className}`} onClick={onClick}>
    <Card variant="lab">
      <div className={`flex flex-col ${LAB_CARD_SPACING.cardGap}`}>
        <LabHeaderContent
          context={context}
          badges={badges}
          meta={meta}
          auditLines={auditLines}
          actions={actions}
        />

        {content && contentTitle ? (
          <LabCardContentPanel title={contentTitle}>{content}</LabCardContentPanel>
        ) : null}

        {flags}
        {recollectionBanner}
      </div>
    </Card>
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

interface ProgressMetaProps {
  count: number;
  total: number;
  label: string;
  isComplete?: boolean;
}

export const ProgressMeta: React.FC<ProgressMetaProps> = ({
  count,
  total,
  label,
  isComplete = false,
}) => (
  <span
    className={
      isComplete ? 'text-text-primary' : 'text-text-secondary'
    }
    title={`${count} of ${total} ${label}`}
  >
    {count}/{total} {label.toLowerCase()}
  </span>
);
