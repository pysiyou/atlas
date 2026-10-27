/**
 * Lab modal header and shared header context. Queue cards use QueueCardHeader.
 */

import { createContext, type ReactNode, useContext } from 'react';
import type { LabAuditLine } from '../constants/labWorkflowAuditLines';
import { LabWorkflowLeftColumn } from './LabWorkflowLeftColumn';
import type { LabIdentityContext } from './LabIdentityRow';

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
  patientId: string | number;
  orderId: string | number;
  orderTestId?: number;
  entityCode?: string;
  entityName?: string;
  referentDoctorName?: string;
  patientDob?: string;
  sampleId?: number;
}

export interface LabModalHeaderProps {
  contextInfo: LabWorkflowModalContext;
  /** Same operational meta block as queue card `alerts`. */
  alerts?: ReactNode;
  auditLines?: LabAuditLine[];
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
      <LabWorkflowLeftColumn context={context} alerts={alerts} auditLines={auditLines} />
    </header>
  );
}
