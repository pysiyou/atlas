/**
 * Shared layout for lab queue cards — header, desktop shell, mobile shell, recessed panel.
 */
/* eslint-disable react-refresh/only-export-components -- card layout + small layout helpers */

import { type ReactNode, useState } from 'react';
import { cn } from '@/utils';
import { Card } from '@/components/surfaces';
import { EntityId } from '@/components/display';
import { LabHeaderCompactContext } from '../components/LabWorkflowHeader';
import type { LabAuditLine } from '../constants/labWorkflowAuditLines';
import { LabWorkflowLeftColumn } from '../components/LabWorkflowLeftColumn';
import type { LabIdentityContext } from '../components/LabIdentityRow';
import {
  WORKLIST_CARD_SURFACE,
  CARD_ACTIONS_ROW,
  CARD_HEADER_GRID,
  WORKLIST_CARD_LIST_ITEM,
  WORKLIST_CARD_SPACING,
  WORKLIST_CARD_TYPE,
  MOBILE_LIST_CARD,
} from '@/theme/recipes';

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
        showHeaderActions ? CARD_HEADER_GRID.shellWithActions : CARD_HEADER_GRID.shell
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
              CARD_HEADER_GRID.badgeColumn,
              showHeaderActions && CARD_HEADER_GRID.badgeColumnBeforeActions,
            )}
          >
            {badges}
          </div>
        </LabHeaderCompactContext.Provider>
      ) : null}
      {showHeaderActions ? (
        <div
          className={CARD_HEADER_GRID.actionColumn}
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
  const sectionClass = className ?? WORKLIST_CARD_SURFACE.contentSection;

  return (
    <div className={sectionClass}>
      <div className={WORKLIST_CARD_SPACING.sectionTitleMargin}>
        <span className={WORKLIST_CARD_TYPE.sectionTitle}>{title}</span>
      </div>
      <div className={WORKLIST_CARD_TYPE.sectionContent}>{children}</div>
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
      <Card variant="interactive">
        <div className={`flex flex-col ${WORKLIST_CARD_SPACING.cardGap}`}>
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
            <div className={CARD_ACTIONS_ROW.actions} onClick={e => e.stopPropagation()}>
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
    <div className={cn(MOBILE_LIST_CARD.stack, className)}>
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
          className={cn(CARD_ACTIONS_ROW.actions, 'mt-auto')}
          onClick={e => e.stopPropagation()}
        >
          {footerActions}
        </div>
      ) : null}
    </div>
  );
}

/** Max rows in "Required for" before collapsing the remainder behind a link. */
const WORKLIST_CARD_TEST_LIST_MAX_VISIBLE = 4;
const WORKLIST_CARD_TEST_LIST_COLLAPSED_COUNT = WORKLIST_CARD_TEST_LIST_MAX_VISIBLE - 1;

const queueCardTestListToggleClass = cn(
  WORKLIST_CARD_LIST_ITEM.label,
  'underline text-text-secondary hover:text-text-primary',
);

export function QueueCardTestList({ tests }: { tests: Array<{ name: string; code: string }> }) {
  const [expanded, setExpanded] = useState(false);
  const canTruncate = tests.length > WORKLIST_CARD_TEST_LIST_MAX_VISIBLE;
  const shouldCollapse = canTruncate && !expanded;
  const visibleTests = shouldCollapse
    ? tests.slice(0, WORKLIST_CARD_TEST_LIST_COLLAPSED_COUNT)
    : tests;
  const remainingCount = tests.length - WORKLIST_CARD_TEST_LIST_COLLAPSED_COUNT;

  const handleToggleClick = (e: React.MouseEvent, nextExpanded: boolean) => {
    e.stopPropagation();
    setExpanded(nextExpanded);
  };

  return (
    <ul className={WORKLIST_CARD_SPACING.listGap}>
      {visibleTests.map((test, i) => (
        <li key={test.code || i} className={WORKLIST_CARD_LIST_ITEM.row}>
          <span className={WORKLIST_CARD_LIST_ITEM.bullet} />
          <span className={WORKLIST_CARD_LIST_ITEM.label}>{test.name}</span>
          <EntityId variant="inline">{test.code}</EntityId>
        </li>
      ))}
      {shouldCollapse ? (
        <li className={WORKLIST_CARD_LIST_ITEM.row}>
          <span className={WORKLIST_CARD_LIST_ITEM.bullet} />
          <button
            type="button"
            className={queueCardTestListToggleClass}
            onClick={e => handleToggleClick(e, true)}
          >
            +{remainingCount} more
          </button>
        </li>
      ) : null}
      {canTruncate && expanded ? (
        <li className={WORKLIST_CARD_LIST_ITEM.row}>
          <span className={WORKLIST_CARD_LIST_ITEM.bullet} />
          <button
            type="button"
            className={queueCardTestListToggleClass}
            onClick={e => handleToggleClick(e, false)}
          >
            Show less
          </button>
        </li>
      ) : null}
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
