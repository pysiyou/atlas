/**
 * Lab modal header and shared header context. Queue cards use QueueCardHeader.
 */

import { createContext, type ReactNode, useContext } from 'react';
import type { LabAuditLine } from '../constants/labWorkflowAuditLines';
import { LabWorkflowLeftColumn } from './LabWorkflowLeftColumn';
import { LabIdentityRow, type LabIdentityContext } from './LabIdentityRow';

export type { LabAuditLine } from '../constants/labWorkflowAuditLines';
export { LabAuditLineView, LabAuditBlock } from './LabWorkflowHeader.parts';

/** When true, badge rows use compact presentation (queue card header sets this). */
// eslint-disable-next-line react-refresh/only-export-components -- compact flag for shared lab header consumers
export const LabHeaderCompactContext = createContext(false);
// eslint-disable-next-line react-refresh/only-export-components -- compact flag for shared lab header consumers
export function useLabHeaderCompact(): boolean {
  return useContext(LabHeaderCompactContext);
}

export interface LabWorkflowModalContext {
  patientName: string;
  patientId: string;
  orderId: string;
  orderTestId?: number;
  entityCode?: string;
  entityName?: string;
  referentDoctorName?: string;
  patientDob?: string;
  sampleId?: string | null;
}

export interface LabModalHeaderProps {
  contextInfo: LabWorkflowModalContext;
  /** Same operational meta block as queue card `alerts`. */
  alerts?: ReactNode;
  auditLines?: LabAuditLine[];
}

function parseModalIdentity(contextInfo: LabWorkflowModalContext): LabIdentityContext {
  return {
    patientName: contextInfo.patientName,
    patientId: contextInfo.patientId,
    orderId: contextInfo.orderId,
    orderTestId: contextInfo.orderTestId,
    sampleId: contextInfo.sampleId,
    entityCode: contextInfo.entityCode,
    entityName: contextInfo.entityName,
    referentDoctorName: contextInfo.referentDoctorName,
    patientDob: contextInfo.patientDob,
  };
}

/** In-modal copy of the queue card left column (identity, alerts, audit). Badges live in modal chrome. */
export function LabModalHeader({
  contextInfo,
  alerts,
  auditLines = [],
}: LabModalHeaderProps) {
  const context = parseModalIdentity(contextInfo);

  return (
    <header className="min-w-0 w-full">
      <LabWorkflowLeftColumn
        identity={<LabIdentityRow context={context} compact className="min-w-0" />}
        alerts={alerts}
        auditLines={auditLines}
      />
    </header>
  );
}
