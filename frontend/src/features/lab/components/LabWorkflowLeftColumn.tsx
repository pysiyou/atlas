/**
 * Shared left-column shell — identity slot, operational alerts, audit.
 * Queue cards and detail modals pass their own identity; layout stays one stack.
 */

import { type ReactNode } from 'react';
import { LabAuditBlock } from './LabWorkflowHeader.parts';
import type { LabAuditLine } from '../constants/labWorkflowAuditLines';
import { cn } from '@/utils';
import { WORKLIST_CARD_ALERT, CARD_HEADER_GRID } from '@/theme/recipes';

export interface LabWorkflowLeftColumnProps {
  /** Stage-specific identity (two-line card identity or LabIdentityRow fallback). */
  identity: ReactNode;
  alerts?: ReactNode;
  auditLines?: LabAuditLine[];
  /** Audit line density; cards default to compact card tone. */
  tone?: 'card' | 'modal';
  className?: string;
}

/**
 * Identity + optional ops row + optional audit lines in the queue-card left grid slot.
 */
export function LabWorkflowLeftColumn({
  identity,
  alerts,
  auditLines = [],
  tone = 'card',
  className,
}: LabWorkflowLeftColumnProps) {
  return (
    <div className={cn(CARD_HEADER_GRID.leftColumn, className)}>
      {identity}
      {alerts ? <div className={WORKLIST_CARD_ALERT.row}>{alerts}</div> : null}
      {auditLines.length > 0 ? (
        <LabAuditBlock lines={auditLines} compact tone={tone} />
      ) : null}
    </div>
  );
}
