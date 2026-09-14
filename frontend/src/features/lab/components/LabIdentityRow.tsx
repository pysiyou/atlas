/**
 * Patient, test name, and IDs — one wrapping row; cards hide secondary fields at narrow widths.
 */

import React, { type ReactNode } from 'react';
import { cn, formatDate, displayId } from '@/utils';
import { LAB_CARD_CONTEXT, LAB_ENTITY_ID } from '../utils/labStyles';

export interface LabIdentityContext {
  patientName?: string;
  patientId?: number;
  orderId: number;
  orderTestId?: number;
  sampleId?: number;
  entityCode?: string;
  entityName?: string;
  referringPhysician?: string;
  patientDob?: string;
}

interface LabIdentityRowProps {
  context: LabIdentityContext;
  className?: string;
  compact?: boolean;
}

function InlineDot({ className }: { className?: string }) {
  return (
    <span className={cn(LAB_CARD_CONTEXT.separator, className)}>{LAB_CARD_CONTEXT.inlineDot}</span>
  );
}

function HiddenAt({ hide, children }: { hide?: string; children: ReactNode }) {
  if (!hide) return <>{children}</>;
  return <span className={hide}>{children}</span>;
}

export const LabIdentityRow: React.FC<LabIdentityRowProps> = ({
  context,
  className,
  compact = false,
}) => {
  const idClass = cn(LAB_ENTITY_ID, 'whitespace-nowrap');
  const nameClass = cn(LAB_CARD_CONTEXT.patientName, compact && 'min-w-0 truncate');
  const hideMd = compact ? 'hidden md:inline' : undefined;
  const hideLg = compact ? 'hidden lg:inline' : undefined;

  const parts: ReactNode[] = [];
  let needsSep = false;

  if (context.patientName) {
    parts.push(
      <span key="patient" className={nameClass}>
        {context.patientName}
      </span>
    );
    needsSep = true;
  }
  if (context.entityName) {
    if (needsSep) parts.push(<InlineDot key="dot-name" />);
    parts.push(
      <span key="entityName" className={cn(nameClass, 'normal-case')} title={context.entityName}>
        {context.entityName}
      </span>
    );
    needsSep = true;
  }

  if (needsSep) parts.push(<InlineDot key="dot-ord" />);
  parts.push(
    <span key="ord" className={idClass}>
      {displayId.order(context.orderId)}
    </span>
  );

  if (context.orderTestId != null) {
    parts.push(<InlineDot key="dot-tst" className={hideMd} />);
    parts.push(
      <HiddenAt key="tst" hide={hideMd}>
        <span className={idClass}>{displayId.orderTest(context.orderTestId)}</span>
      </HiddenAt>
    );
  }
  if (context.sampleId != null) {
    parts.push(<InlineDot key="dot-sam" className={hideMd} />);
    parts.push(
      <HiddenAt key="sam" hide={hideMd}>
        <span className={idClass}>{displayId.sample(context.sampleId)}</span>
      </HiddenAt>
    );
  }
  if (context.entityCode) {
    parts.push(<InlineDot key="dot-code" className={context.entityName ? hideLg : hideMd} />);
    parts.push(
      <HiddenAt key="code" hide={context.entityName ? hideLg : hideMd}>
        <span className={idClass}>{context.entityCode}</span>
      </HiddenAt>
    );
  }
  if (context.patientDob) {
    parts.push(<InlineDot key="dot-dob" className={hideLg} />);
    parts.push(
      <HiddenAt key="dob" hide={hideLg}>
        <span className="whitespace-nowrap">DOB {formatDate(context.patientDob)}</span>
      </HiddenAt>
    );
  }
  if (context.referringPhysician) {
    parts.push(<InlineDot key="dot-phys" className={hideLg} />);
    parts.push(
      <HiddenAt key="phys" hide={hideLg}>
        <span className={cn(nameClass, 'truncate')}>{context.referringPhysician}</span>
      </HiddenAt>
    );
  }

  return (
    <div
      className={cn(
        LAB_CARD_CONTEXT.container,
        compact && 'flex-nowrap overflow-hidden',
        className
      )}
    >
      {parts}
    </div>
  );
};
