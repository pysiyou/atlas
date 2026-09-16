/**
 * Lab header stack — identity, badges, audit. Shared by cards and modals.
 */

import React, { createContext, type ReactNode, useContext } from 'react';
import { cn, formatDateTime } from '@/utils';
import { EntityId } from '@/components';
import { useUserLookup } from '@/lib/api/users.api';
import { LAB_CARD_HEADER, LAB_CARD_TYPOGRAPHY, LAB_HEADER } from '../utils/labStyles';
import { LabIdentityRow, type LabIdentityContext } from './LabIdentityRow';
import type { LabAuditLine } from './labWorkflowAuditLines';

export type {
  LabAuditLine,
  LabSampleAuditInfo,
} from './labWorkflowAuditLines';

/** When true, badge rows hide tertiary chips (cards only; modals stay full). */
// eslint-disable-next-line react-refresh/only-export-components -- compact flag for shared lab header consumers
export const LabHeaderCompactContext = createContext(false);
// eslint-disable-next-line react-refresh/only-export-components -- compact flag for shared lab header consumers
export function useLabHeaderCompact(): boolean {
  return useContext(LabHeaderCompactContext);
}

export interface LabWorkflowModalContext {
  patientName: string;
  patientId: string | number;
  orderId: string | number;
  orderTestId?: number;
  entityCode?: string;
  entityName?: string;
  referringPhysician?: string;
  patientDob?: string;
  sampleId?: number;
}

export interface LabModalHeaderProps {
  contextInfo: LabWorkflowModalContext;
  badges?: ReactNode;
  auditLines?: LabAuditLine[];
}

function hasReactNodeContent(node: ReactNode): boolean {
  if (node == null || node === false) return false;
  if (Array.isArray(node)) return node.some(hasReactNodeContent);
  if (React.isValidElement(node) && node.type === React.Fragment) {
    return hasReactNodeContent((node.props as { children?: ReactNode }).children);
  }
  return true;
}

function parseModalIdentity(contextInfo: LabWorkflowModalContext): LabIdentityContext {
  const orderId =
    typeof contextInfo.orderId === 'number'
      ? contextInfo.orderId
      : parseInt(String(contextInfo.orderId), 10);
  const patientId =
    typeof contextInfo.patientId === 'number'
      ? contextInfo.patientId
      : parseInt(String(contextInfo.patientId).replace(/\D/g, ''), 10);

  return {
    patientName: contextInfo.patientName,
    patientId: Number.isNaN(patientId) ? undefined : patientId,
    orderId: Number.isNaN(orderId) ? 0 : orderId,
    orderTestId: contextInfo.orderTestId,
    sampleId: contextInfo.sampleId,
    entityCode: contextInfo.entityCode,
    entityName: contextInfo.entityName,
    referringPhysician: contextInfo.referringPhysician,
    patientDob: contextInfo.patientDob,
  };
}

function LabHeaderStack({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'header' | 'div';
}) {
  const rows = React.Children.toArray(children).filter(hasReactNodeContent);
  if (rows.length === 0) return null;

  return (
    <Tag className={cn(Tag === 'header' ? LAB_HEADER.stack : LAB_HEADER.cardStack, className)}>
      {rows.map((row, index) => (
        <div key={index} className={LAB_HEADER.row}>
          {row}
        </div>
      ))}
    </Tag>
  );
}

export function LabAuditLineView({
  line,
  className,
  compact = false,
}: {
  line: LabAuditLine;
  className?: string;
  compact?: boolean;
}) {
  const { getUserName } = useUserLookup();
  const base = cn(LAB_HEADER.auditLine, className);
  const byUserClass = compact ? 'hidden md:inline' : undefined;

  switch (line.type) {
    case 'sample-collected':
      return (
        <span className={base}>
          Sample{' '}
          {typeof line.sampleId === 'number' ? (
            <EntityId type="sample" value={line.sampleId} />
          ) : (
            <EntityId>{line.sampleId}</EntityId>
          )}{' '}
          collected{' '}
          <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
            {formatDateTime(line.collectedAt)}
          </span>
          {line.collectedBy && (
            <span className={byUserClass}>
              {' '}
              by{' '}
              <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
                {getUserName(line.collectedBy)}
              </span>
            </span>
          )}
        </span>
      );
    case 'collection-only':
      return (
        <span className={base}>
          collected{' '}
          <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
            {formatDateTime(line.collectedAt)}
          </span>
          {line.collectedBy && (
            <span className={byUserClass}>
              {' '}
              by{' '}
              <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
                {getUserName(line.collectedBy)}
              </span>
            </span>
          )}
        </span>
      );
    case 'previous-sample-rejected':
      return (
        <span className={cn(base, compact && 'hidden md:inline')}>
          Previous sample <span className="text-warning-fg font-normal">rejected</span>
          {' — '}
          <EntityId type="sample" value={line.sampleId} /> collected{' '}
          <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
            {formatDateTime(line.collectedAt)}
          </span>
        </span>
      );
    case 'result-entered':
      return (
        <span className={base}>
          Results entered{' '}
          <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
            {formatDateTime(line.enteredAt)}
          </span>
          {line.enteredBy && (
            <span className={byUserClass}>
              {' '}
              by{' '}
              <span className={LAB_CARD_TYPOGRAPHY.emphasizedInline}>
                {getUserName(line.enteredBy)}
              </span>
            </span>
          )}
        </span>
      );
    case 'custom':
      return <span className={base}>{line.content}</span>;
    default: {
      const _exhaustive: never = line;
      return _exhaustive;
    }
  }
}

function LabAuditBlock({
  lines,
  className,
  compact = false,
}: {
  lines: LabAuditLine[];
  className?: string;
  compact?: boolean;
}) {
  if (lines.length === 0) return null;
  return (
    <div className={cn(LAB_HEADER.auditStack, className)}>
      {lines.map((line, index) => (
        <LabAuditLineView key={`${line.type}-${index}`} line={line} compact={compact} />
      ))}
    </div>
  );
}

export function LabHeaderContent({
  context,
  badges,
  auditLines = [],
  actions,
  stackAs = 'div',
  className,
}: {
  context: LabIdentityContext;
  badges?: ReactNode;
  auditLines?: LabAuditLine[];
  actions?: ReactNode;
  stackAs?: 'header' | 'div';
  className?: string;
}) {
  const compact = stackAs !== 'header';

  return (
    <LabHeaderStack as={stackAs} className={cn('min-w-0 w-full', className)}>
      <div className={LAB_CARD_HEADER.identityShell}>
        {actions ? (
          <div className={LAB_CARD_HEADER.actionColumn} onClick={e => e.stopPropagation()}>
            {actions}
          </div>
        ) : null}
        <LabIdentityRow
          context={context}
          compact={compact}
          className={actions ? LAB_CARD_HEADER.identityPadActions : undefined}
        />
      </div>
      {badges ? (
        <LabHeaderCompactContext.Provider value={compact}>
          <div className={LAB_HEADER.badgeRow}>{badges}</div>
        </LabHeaderCompactContext.Provider>
      ) : null}
      {auditLines.length > 0 ? (
        <LabAuditBlock lines={auditLines} compact={compact} />
      ) : null}
    </LabHeaderStack>
  );
}

export function LabModalHeader({
  contextInfo,
  badges,
  auditLines = [],
}: LabModalHeaderProps) {
  return (
    <LabHeaderContent
      stackAs="header"
      context={parseModalIdentity(contextInfo)}
      badges={badges}
      auditLines={auditLines}
    />
  );
}

