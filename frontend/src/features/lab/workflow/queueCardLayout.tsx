/**
 * Shared layout for lab queue cards — header, desktop shell, mobile shell, recessed panel.
 */

import { type ReactNode } from 'react';
import { cn } from '@/utils';
import { Card, EntityId } from '@/components';
import { LabHeaderCompactContext } from '../components/LabWorkflowHeader';
import type { LabAuditLine } from '../constants/labWorkflowAuditLines';
import { LabWorkflowLeftColumn } from '../components/LabWorkflowLeftColumn';
import type { LabIdentityContext } from '../components/LabIdentityRow';
import {
  LAB_CARD_CONTAINERS,
  LAB_CARD_FOOTER,
  LAB_CARD_HEADER,
  LAB_CARD_LIST_ITEMS,
  LAB_CARD_SPACING,
  LAB_CARD_TYPOGRAPHY,
  LAB_MOBILE_CARD,
} from '../utils/labStyles';

export interface QueueCardHeaderProps {
  context?: LabIdentityContext;
  /** Replaces generic identity + alerts + audit (sample collection card). */
  leftColumn?: ReactNode;
  badges?: ReactNode;
  alerts?: ReactNode;
  auditLines?: LabAuditLine[];
  /** Primary actions (buttons) — third header column when set. */
  headerActions?: ReactNode;
}

export function QueueCardHeader({
  context,
  leftColumn,
  badges,
  alerts,
  auditLines = [],
  headerActions,
}: QueueCardHeaderProps) {
  const showHeaderActions = hasQueueCardActions(headerActions);

  return (
    <div
      className={
        showHeaderActions ? LAB_CARD_HEADER.shellWithActions : LAB_CARD_HEADER.shell
      }
    >
      {leftColumn ?? (
        <LabWorkflowLeftColumn
          context={context!}
          alerts={alerts}
          auditLines={auditLines}
        />
      )}
      {badges ? (
        <LabHeaderCompactContext.Provider value={true}>
          <div
            className={cn(
              LAB_CARD_HEADER.badgeColumn,
              showHeaderActions && LAB_CARD_HEADER.badgeColumnBeforeActions,
            )}
          >
            {badges}
          </div>
        </LabHeaderCompactContext.Provider>
      ) : null}
      {showHeaderActions ? (
        <div
          className={LAB_CARD_HEADER.actionColumn}
          onClick={e => e.stopPropagation()}
        >
          {headerActions}
        </div>
      ) : null}
    </div>
  );
}

export interface QueueCardPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function QueueCardPanel({ title, children, className }: QueueCardPanelProps) {
  const sectionClass = className ?? LAB_CARD_CONTAINERS.contentSection;

  return (
    <div className={sectionClass}>
      <div className={LAB_CARD_SPACING.sectionTitleMargin}>
        <span className={LAB_CARD_TYPOGRAPHY.sectionTitle}>{title}</span>
      </div>
      <div className={LAB_CARD_TYPOGRAPHY.sectionContent}>{children}</div>
    </div>
  );
}

export function hasQueueCardActions(actions: ReactNode): boolean {
  if (actions == null || actions === false) return false;
  if (Array.isArray(actions)) return actions.some(hasQueueCardActions);
  return true;
}

export interface QueueCardProps {
  onClick?: (e: React.MouseEvent) => void;
  context?: LabIdentityContext;
  leftColumn?: ReactNode;
  auditLines?: LabAuditLine[];
  badges: ReactNode;
  alerts?: ReactNode;
  actions?: ReactNode;
  /** `'header'` — buttons in the third header column; `'footer'` — below card body (default). */
  actionsPlacement?: 'header' | 'footer';
  content?: ReactNode;
  contentTitle?: string;
  recollectionBanner?: ReactNode;
  flags?: ReactNode;
  className?: string;
}

/** Desktop / wide queue list card shell. */
export function QueueCard({
  onClick,
  context,
  leftColumn,
  auditLines,
  badges,
  alerts,
  actions,
  actionsPlacement = 'footer',
  content,
  contentTitle,
  recollectionBanner,
  flags,
  className = '',
}: QueueCardProps) {
  const showActions = hasQueueCardActions(actions);
  const headerActions = showActions && actionsPlacement === 'header' ? actions : undefined;
  const footerActions = showActions && actionsPlacement === 'footer' ? actions : undefined;

  return (
    <div className={`cursor-pointer ${className}`} onClick={onClick}>
      <Card variant="lab">
        <div className={`flex flex-col ${LAB_CARD_SPACING.cardGap}`}>
          <QueueCardHeader
            context={context}
            leftColumn={leftColumn}
            badges={badges}
            alerts={alerts}
            auditLines={auditLines}
            headerActions={headerActions}
          />

          {content && contentTitle ? (
            <QueueCardPanel title={contentTitle}>{content}</QueueCardPanel>
          ) : null}

          {flags}
          {recollectionBanner}

          {footerActions ? (
            <div className={LAB_CARD_FOOTER.actions} onClick={e => e.stopPropagation()}>
              {footerActions}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export interface QueueCardMobileProps {
  context?: LabIdentityContext;
  leftColumn?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  auditLines?: LabAuditLine[];
  alerts?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
  actionsPlacement?: 'header' | 'footer';
}

/** Narrow / mobile queue list card shell. */
export function QueueCardMobile({
  context,
  leftColumn,
  badges,
  actions,
  auditLines = [],
  alerts,
  meta,
  children,
  className,
  actionsPlacement = 'footer',
}: QueueCardMobileProps) {
  const showActions = hasQueueCardActions(actions);
  const headerActions = showActions && actionsPlacement === 'header' ? actions : undefined;
  const footerActions = showActions && actionsPlacement === 'footer' ? actions : undefined;
  const alertNode = alerts ?? meta;

  return (
    <div className={cn(LAB_MOBILE_CARD.stack, className)}>
      <QueueCardHeader
        context={context}
        leftColumn={leftColumn}
        badges={badges}
        alerts={alertNode}
        auditLines={auditLines}
        headerActions={headerActions}
      />
      {children}
      {footerActions ? (
        <div
          className={cn(LAB_CARD_FOOTER.actions, 'mt-auto')}
          onClick={e => e.stopPropagation()}
        >
          {footerActions}
        </div>
      ) : null}
    </div>
  );
}

export function QueueCardTestList({ tests }: { tests: Array<{ name: string; code: string }> }) {
  return (
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
}

export function QueueCardProgressMeta({
  count,
  total,
  label,
  isComplete = false,
}: {
  count: number;
  total: number;
  label: string;
  isComplete?: boolean;
}) {
  return (
    <span
      className={isComplete ? 'text-text-primary' : 'text-text-secondary'}
      title={`${count} of ${total} ${label}`}
    >
      {count}/{total} {label.toLowerCase()}
    </span>
  );
}
