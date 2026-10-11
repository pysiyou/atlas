/**
 * Left stack on queue cards — identity, operational alerts, audit.
 * Detail modals reuse this block so in-body header matches the card.
 */

import { type ReactNode } from 'react';
import { LabIdentityRow, type LabIdentityContext } from './LabIdentityRow';
import { LabAuditBlock } from './LabWorkflowHeader.parts';
import type { LabAuditLine } from '../constants/labWorkflowAuditLines';
import { LAB_CARD_ALERT, LAB_CARD_HEADER } from '../utils/labStyles';

export interface LabWorkflowLeftColumnProps {
  context: LabIdentityContext;
  alerts?: ReactNode;
  auditLines?: LabAuditLine[];
}

export function LabWorkflowLeftColumn({
  context,
  alerts,
  auditLines = [],
}: LabWorkflowLeftColumnProps) {
  return (
    <div className={LAB_CARD_HEADER.leftColumn}>
      <LabIdentityRow context={context} compact className="min-w-0" />
      {alerts ? <div className={LAB_CARD_ALERT.row}>{alerts}</div> : null}
      {auditLines.length > 0 ? (
        <LabAuditBlock lines={auditLines} compact tone="card" />
      ) : null}
    </div>
  );
}
