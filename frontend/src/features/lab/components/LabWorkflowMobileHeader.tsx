/**
 * Mobile / narrow lab card header — two-line identity, short meta, footer badges + actions.
 */

import React, { type ReactNode } from 'react';
import { cn, displayId } from '@/utils';
import { EntityId } from '@/components';
import { LAB_HEADER, LAB_MOBILE_CARD } from '../utils/labStyles';
import type { LabIdentityContext } from './LabIdentityRow';
import type { LabAuditLine } from '../constants/labWorkflowAuditLines';
import { LabAuditLineView, LabHeaderCompactContext } from './LabWorkflowHeader';

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
      <EntityId
        key="tst"
        type="orderTest"
        value={context.orderTestId}
        variant="inline"
        title={displayId.orderTest(context.orderTestId)}
      />
    );
  } else if (!context.entityName) {
    segments.push(
      <EntityId key="ord" type="order" value={context.orderId} variant="inline" />
    );
  }

  if (context.entityCode) {
    segments.push(
      <EntityId key="code" variant="inline" className="uppercase">
        {context.entityCode}
      </EntityId>
    );
  }

  if (context.sampleId != null && context.entityName) {
    segments.push(
      <EntityId
        key="sam"
        type="sample"
        value={context.sampleId}
        variant="inline"
        title={displayId.sample(context.sampleId)}
      />
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
