/**
 * LabModalHeader — consistent header block for lab detail modals.
 */

import React, { type ReactNode } from 'react';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { useUserLookup } from '@/lib/api/users.api';

export interface LabModalContextInfo {
  patientName: string;
  patientId: string | number;
  orderId: string | number;
  orderTestId?: number;
  /** Test code or sample type shown after entity IDs */
  entityCode?: string;
  referringPhysician?: string;
  patientDob?: string;
}

export interface LabModalSampleInfo {
  sampleId: string | number;
  collectedAt?: string;
  collectedBy?: string;
}

interface LabModalHeaderProps {
  badges: ReactNode;
  contextInfo: LabModalContextInfo;
  sampleInfo?: LabModalSampleInfo;
  additionalContextInfo?: ReactNode;
}

function MetaSeparator() {
  return <span className="text-text-disabled select-none" aria-hidden="true">·</span>;
}

export const LabModalHeader: React.FC<LabModalHeaderProps> = ({
  badges,
  contextInfo,
  sampleInfo,
  additionalContextInfo,
}) => {
  const { getUserName } = useUserLookup();

  const patientIdLabel =
    typeof contextInfo.patientId === 'number'
      ? displayId.patient(contextInfo.patientId)
      : contextInfo.patientId;
  const orderIdLabel =
    typeof contextInfo.orderId === 'number'
      ? displayId.order(contextInfo.orderId)
      : contextInfo.orderId;

  return (
    <header className="pb-4 border-b border-border-default space-y-3">
      <div className="flex flex-wrap items-center gap-2">{badges}</div>

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-text-secondary">
        <span className="text-text-primary font-normal">{contextInfo.patientName}</span>
        <MetaSeparator />
        <span className="entity-id whitespace-nowrap">{patientIdLabel}</span>
        {contextInfo.patientDob && (
          <>
            <MetaSeparator />
            <span className="text-text-tertiary whitespace-nowrap">
              DOB {formatDate(contextInfo.patientDob)}
            </span>
          </>
        )}
        <MetaSeparator />
        <span className="entity-id whitespace-nowrap">{orderIdLabel}</span>
        {contextInfo.orderTestId != null && (
          <>
            <MetaSeparator />
            <span className="entity-id whitespace-nowrap">
              {displayId.orderTest(contextInfo.orderTestId)}
            </span>
          </>
        )}
        {contextInfo.entityCode && (
          <>
            <MetaSeparator />
            <span className="entity-id whitespace-nowrap">{contextInfo.entityCode}</span>
          </>
        )}
        {contextInfo.referringPhysician && (
          <>
            <MetaSeparator />
            <span className="text-text-primary whitespace-nowrap">
              {contextInfo.referringPhysician}
            </span>
          </>
        )}
      </div>

      {sampleInfo?.collectedAt && (
        <p className="text-xs text-text-tertiary">
          Sample{' '}
          <span className="entity-id">
            {typeof sampleInfo.sampleId === 'number'
              ? displayId.sample(sampleInfo.sampleId)
              : sampleInfo.sampleId}
          </span>{' '}
          collected{' '}
          <span className="text-text-secondary">{formatDate(sampleInfo.collectedAt)}</span>
          {sampleInfo.collectedBy && (
            <>
              {' '}
              by{' '}
              <span className="text-text-secondary">{getUserName(sampleInfo.collectedBy)}</span>
            </>
          )}
        </p>
      )}

      {additionalContextInfo}
    </header>
  );
};
