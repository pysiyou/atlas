/**
 * Mobile / narrow lab card header — two-line identity, short meta, footer badges + actions.
 */

import React, { type ReactNode } from 'react';
import { cn, displayId } from '@/utils';
import { LAB_ENTITY_ID, LAB_HEADER, LAB_MOBILE_CARD } from '../utils/labStyles';
import type { LabIdentityContext } from './LabIdentityRow';
import type { LabAuditLine } from './labHeaderAudit';
import { LabAuditLineView, LabHeaderCompactContext } from './labHeader';

function MobileIdentitySubline({ context }: { context: LabIdentityContext }) {
  const dot = <span className="text-text-disabled shrink-0 select-none">•</span>;
  const segments: ReactNode[] = [];

  if (context.entityName && context.patientName) {
    segments.push(
      <span key="patient" className={LAB_MOBILE_CARD.sublineName} title={context.patientName}>
        {context.patientName}
      </span>
    );
  }

  if (context.orderTestId != null) {
    segments.push(
      <span key="tst" className={cn(LAB_ENTITY_ID, 'truncate')} title={displayId.orderTest(context.orderTestId)}>
        {displayId.orderTest(context.orderTestId)}
      </span>
    );
  } else if (!context.entityName) {
    segments.push(
      <span key="ord" className={cn(LAB_ENTITY_ID, 'truncate')}>
        {displayId.order(context.orderId)}
      </span>
    );
  }

  if (context.entityCode) {
    segments.push(
      <span key="code" className={cn(LAB_ENTITY_ID, 'truncate uppercase')}>
        {context.entityCode}
      </span>
    );
  }

  if (context.sampleId != null && context.entityName) {
    segments.push(
      <span
        key="sam"
        className={cn(LAB_ENTITY_ID, 'truncate')}
        title={displayId.sample(context.sampleId)}
      >
        {displayId.sample(context.sampleId)}
      </span>
    );
  }

  if (segments.length === 0) return null;

  return (
    <div className={LAB_MOBILE_CARD.subline}>
      {segments.map((segment, index) => (
        <React.Fragment key={index}>
          {index > 0 ? dot : null}
          {segment}
        </React.Fragment>
      ))}
    </div>
  );
}

function MobileAuditMeta({ lines }: { lines: LabAuditLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className={cn(LAB_MOBILE_CARD.metaLine, LAB_HEADER.auditStack)}>
      {lines.map((line, index) => (
        <LabAuditLineView key={`${line.type}-${index}`} line={line} compact />
      ))}
    </div>
  );
}

export interface LabMobileCardHeaderProps {
  context: LabIdentityContext;
  badges?: ReactNode;
  actions?: ReactNode;
  auditLines?: LabAuditLine[];
  /** Replaces auto-generated date meta from audit lines */
  meta?: ReactNode;
  /** Status or icon aligned with the title row (e.g. collection status) */
  titleAside?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function LabMobileCardHeader({
  context,
  badges,
  actions,
  auditLines = [],
  meta,
  titleAside,
  children,
  className,
}: LabMobileCardHeaderProps) {
  const primary =
    context.entityName ??
    context.patientName ??
    context.entityCode ??
    displayId.order(context.orderId);

  const metaNode = meta ?? (auditLines.length > 0 ? <MobileAuditMeta lines={auditLines} /> : null);
  const showFooter = Boolean(badges) || Boolean(actions);

  return (
    <div className={cn(LAB_MOBILE_CARD.stack, className)}>
      <div className={LAB_MOBILE_CARD.titleHead}>
        <p className={LAB_MOBILE_CARD.title} title={typeof primary === 'string' ? primary : undefined}>
          {primary}
        </p>
        <MobileIdentitySubline context={context} />
        {titleAside ? <div className={LAB_MOBILE_CARD.titleAside}>{titleAside}</div> : null}
      </div>

      {metaNode}

      {children}

      {showFooter ? (
        <div className={LAB_MOBILE_CARD.footer} onClick={e => e.stopPropagation()}>
          {badges ? (
            <LabHeaderCompactContext.Provider value={true}>
              <div className={LAB_MOBILE_CARD.badgeRail}>{badges}</div>
            </LabHeaderCompactContext.Provider>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          {actions ? <div className={LAB_MOBILE_CARD.actionRail}>{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export function labMobileCardSurfaceClassName(className?: string): string {
  return cn('flex flex-col h-full min-h-0', className);
}
